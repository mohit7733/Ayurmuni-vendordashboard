// DoctorVideoCall.jsx — Doctor Dashboard video consultation (production integration).
// Patient-side call UI lives in the separate patient app repository.
import React, { useState, useEffect, useRef, useCallback } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Loader2, Phone, Video, Clock } from "lucide-react";

import VideoHeader from "./VideoHeader";
import VideoControls from "./VideoControls";
import WaitingScreen from "./WaitingScreen";
import VideoPip from "./VideoPip";
import {
  apiErrorMessage,
  endCall,
  fetchAgoraToken,
  fetchCallStatus,
  getCallEndedPresentation,
  isCallJoinBlocked,
  joinAgoraChannel,
  reportJoinedEvent,
  startCall,
} from "../../../services/appointmentCallService";

// Recording Service
class RecordingService {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.startTime = null;
  }

  async startRecording(stream) {
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.recordedChunks.push(event.data);
    };

    this.mediaRecorder.start(1000);
    this.isRecording = true;
    this.startTime = Date.now();
  }

  async stopRecording() {
    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        resolve({ blob, url, duration: Date.now() - this.startTime });
      };
      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }
}

const formatDuration = (seconds) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

const getEndTimeTimestamp = (endTime) => {
  if (!endTime) return null;

  const timeOnlyMatch = String(endTime).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeOnlyMatch) {
    const today = new Date();
    today.setHours(
      Number(timeOnlyMatch[1]),
      Number(timeOnlyMatch[2]),
      Number(timeOnlyMatch[3] || 0),
      0
    );
    return today.getTime();
  }

  const timestamp = new Date(endTime).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const VIDEO_PLAY_CONFIG = { fit: "contain" };

export default function DoctorVideoCall({ consultationId: consultationIdProp, patientDetails, onCallEnd }) {
  const { consultationId: consultationIdParam } = useParams();
  const consultationId = consultationIdProp || consultationIdParam;

  const [callState, setCallState] = useState("idle");
  const [callStatusData, setCallStatusData] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [patientJoined, setPatientJoined] = useState(false);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [timeUntilEnd, setTimeUntilEnd] = useState(null);
  const notifiedEndWarningsRef = useRef(new Set());
  const [networkQuality, setNetworkQuality] = useState(4);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [devices, setDevices] = useState({
    audioInputs: [],
    videoInputs: [],
    currentAudio: null,
    currentVideo: null,
  });

  const clientRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null });
  const timerRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const recordingServiceRef = useRef(new RecordingService());
  const containerRef = useRef(null);
  const pipPositionRef = useRef({ x: 0, y: 0 });
  const isInChannelRef = useRef(false);
  const callStateRef = useRef("idle");
  const remoteUserRef = useRef(null);

  const [permissions, setPermissions] = useState({ camera: false, microphone: false });
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const applyStatus = useCallback((status) => {
    setCallStatusData(status);

    if (status.call_status === "ended") {
      if (status.duration_minutes != null) {
        setDuration(Math.round(status.duration_minutes * 60));
      }
      setCallState("ended");
      return;
    }

    if (callStateRef.current === "ended") {
      setCallState("idle");
    }
  }, []);

  const cleanupAgora = useCallback(async () => {
    isInChannelRef.current = false;
    remoteUserRef.current = null;
    clearInterval(timerRef.current);

    const { audio, video } = localTracksRef.current;
    if (audio) {
      audio.stop();
      audio.close();
    }
    if (video) {
      video.stop();
      video.close();
    }
    localTracksRef.current = { audio: null, video: null };

    if (clientRef.current) {
      try {
        await clientRef.current.leave();
      } catch (leaveError) {
        console.warn("Agora leave failed:", leaveError);
      }
      clientRef.current = null;
    }
  }, []);

  const loadCallStatus = useCallback(async () => {
    if (!consultationId) return null;

    const status = await fetchCallStatus(consultationId);
    applyStatus(status);
    return status;
  }, [applyStatus, consultationId]);

  const reconcilePresence = useCallback(async () => {
    if (!consultationId) return;

    try {
      const status = await fetchCallStatus(consultationId);
      applyStatus(status);

      if (status.call_status === "ended") {
        if (isInChannelRef.current) {
          await cleanupAgora();
        }
        return;
      }

      if (
        status.call_status === "in_progress" &&
        isInChannelRef.current &&
        status.presence_sync?.should_report_joined
      ) {
        reportJoinedEvent(consultationId).catch((err) => {
          console.warn("Joined event resync failed:", err);
        });
      }
    } catch (err) {
      console.warn("Call status reconcile failed:", err);
    }
  }, [applyStatus, cleanupAgora, consultationId]);

  const handleRemoteUserLeft = useCallback(async () => {
    if (!consultationId) {
      setPatientJoined(false);
      return;
    }

    try {
      const status = await fetchCallStatus(consultationId);
      if (status.call_status === "ended") {
        await cleanupAgora();
        applyStatus(status);
        toast("Consultation ended");
        return;
      }
    } catch (err) {
      console.warn("Call status check after remote user left failed:", err);
    }

    setPatientJoined(false);
  }, [applyStatus, cleanupAgora, consultationId]);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const cam = await navigator.mediaDevices.getUserMedia({ video: true });
        cam.getTracks().forEach((t) => t.stop());
        setPermissions((p) => ({ ...p, camera: true }));

        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        mic.getTracks().forEach((t) => t.stop());
        setPermissions((p) => ({ ...p, microphone: true }));
      } catch (err) {
        console.error("Permission error:", err);
      } finally {
        setCheckingPermissions(false);
      }
    };
    checkPermissions();
  }, []);

  useEffect(() => {
    if (!consultationId || checkingPermissions) return undefined;

    let cancelled = false;

    (async () => {
      setLoadingStatus(true);
      try {
        const status = await fetchCallStatus(consultationId);
        if (!cancelled) {
          applyStatus(status);
        }
      } catch (err) {
        if (!cancelled) {
          setError(apiErrorMessage(err, "Failed to load call status"));
        }
      } finally {
        if (!cancelled) {
          setLoadingStatus(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyStatus, checkingPermissions, consultationId]);

  useEffect(() => {
    const handleResume = () => {
      if (document.visibilityState === "visible") {
        reconcilePresence();
      }
    };

    window.addEventListener("online", reconcilePresence);
    document.addEventListener("visibilitychange", handleResume);

    return () => {
      window.removeEventListener("online", reconcilePresence);
      document.removeEventListener("visibilitychange", handleResume);
    };
  }, [reconcilePresence]);

  const getDevices = useCallback(async () => {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = mediaDevices.filter((d) => d.kind === "audioinput");
      const videoInputs = mediaDevices.filter((d) => d.kind === "videoinput");
      setDevices((prev) => ({ ...prev, audioInputs, videoInputs }));
    } catch (err) {
      console.error("Error getting devices:", err);
    }
  }, []);

  useEffect(() => {
    getDevices();
    navigator.mediaDevices.addEventListener("devicechange", getDevices);
    return () => navigator.mediaDevices.removeEventListener("devicechange", getDevices);
  }, [getDevices]);

  const playLocalVideo = useCallback(() => {
    const { video } = localTracksRef.current;
    if (!video || !localVideoRef.current) return;
    video.play(localVideoRef.current, VIDEO_PLAY_CONFIG);
  }, []);

  const playRemoteVideo = useCallback((track) => {
    if (!track || !remoteVideoRef.current) return;
    track.play(remoteVideoRef.current, VIDEO_PLAY_CONFIG);
  }, []);

  useEffect(() => {
    if (callState === "active") {
      playLocalVideo();
    }
  }, [callState, playLocalVideo]);

  useEffect(() => {
    if (patientJoined && remoteUserRef.current?.videoTrack) {
      playRemoteVideo(remoteUserRef.current.videoTrack);
    }
  }, [patientJoined, playRemoteVideo]);

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimerRef.current);
      setRecordingDuration(0);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  useEffect(() => {
    const endTime = getEndTimeTimestamp(patientDetails?.end_time);
    if (!endTime || callState !== "active") {
      setTimeUntilEnd(null);
      notifiedEndWarningsRef.current.clear();
      return undefined;
    }

    const updateTimeUntilEnd = () => {
      const remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeUntilEnd(remainingSeconds);

      const warningMessages = {
        300: "Your meeting will end in 5 minutes",
        120: "Your meeting will end in 2 minutes",
        30: "Your meeting will end in 30 seconds",
      };

      Object.entries(warningMessages).forEach(([threshold, message]) => {
        const thresholdSeconds = Number(threshold);
        if (
          remainingSeconds <= thresholdSeconds &&
          remainingSeconds > 0 &&
          !notifiedEndWarningsRef.current.has(thresholdSeconds)
        ) {
          notifiedEndWarningsRef.current.add(thresholdSeconds);
          toast(message);
        }
      });
    };

    updateTimeUntilEnd();
    const endTimeTimer = setInterval(updateTimeUntilEnd, 1000);
    return () => clearInterval(endTimeTimer);
  }, [callState, patientDetails?.end_time]);

  const joinCall = useCallback(async () => {
    setCallState("joining");
    setError(null);

    try {
      if (!permissions.camera || !permissions.microphone) {
        throw new Error("Camera or microphone access required");
      }

      toast.loading("Starting consultation...", { id: "call-join" });

      const status = await loadCallStatus();
      if (isCallJoinBlocked(status)) {
        if (status?.call_status === "ended") {
          throw new Error("This video call has already ended.");
        }
        if (status?.status === "cancelled") {
          throw new Error("This appointment has been cancelled.");
        }
        if (status?.status === "missed" || status?.missed_by) {
          throw new Error("This consultation was marked as missed.");
        }
        throw new Error("This video call is no longer available.");
      }

      if (status?.call_status === "not_started") {
        await startCall(consultationId);
      }

      const tokenData = await fetchAgoraToken(consultationId);
      if (!tokenData?.app_id || !tokenData?.channel || !tokenData?.token) {
        throw new Error("Invalid token data");
      }

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          remoteUserRef.current = user;
          setPatientJoined(true);
          playRemoteVideo(user.videoTrack);
        }
        if (mediaType === "audio") user.audioTrack.play();
      });

      client.on("user-unpublished", (user) => user.videoTrack?.stop());
      client.on("user-left", () => {
        remoteUserRef.current = null;
        handleRemoteUserLeft();
      });
      client.on("network-quality", (stats) =>
        setNetworkQuality(Math.max(stats.uplinkNetworkQuality, stats.downlinkNetworkQuality))
      );
      client.on("connection-state-change", (curState) => {
        if (curState === "DISCONNECTED") {
          setError("Connection lost. Reconnecting...");
          reconcilePresence();
        }
      });

      await joinAgoraChannel(client, tokenData, {
        appointmentId: consultationId,
      });

      isInChannelRef.current = true;

      reportJoinedEvent(consultationId).catch((err) => {
        console.warn("Joined event delivery failed:", err);
      });

      // Alternative: Create tracks with more explicit constraints
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        {
          AEC: true,
          AGC: true,
          ANS: true,
        },
        {
          encoderConfig: {
            width: 640,
            height: 480,
            frameRate: 24,
            bitrateMin: 200,
            bitrateMax: 600,
          },
          facingMode: "user",
          optimizationMode: "motion",
        }
      );
      localTracksRef.current = { audio: audioTrack, video: videoTrack };
      await client.publish([audioTrack, videoTrack]);

      setCallState("active");
      toast.success("Consultation started", { id: "call-join" });
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      await cleanupAgora();
      const message = apiErrorMessage(err, "Failed to join consultation");
      setError(message);
      toast.error(message, { id: "call-join" });
      setCallState(callStatusData?.call_status === "ended" ? "ended" : "idle");
    }
  }, [
    callStatusData?.call_status,
    cleanupAgora,
    consultationId,
    loadCallStatus,
    permissions,
    handleRemoteUserLeft,
    playRemoteVideo,
    reconcilePresence,
  ]);

  const toggleRecording = useCallback(async () => {
    if (!isRecording) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      await recordingServiceRef.current.startRecording(stream);
      setIsRecording(true);
      toast.success("Recording started");
      return;
    }

    const { blob, url, duration: recordDuration } =
      await recordingServiceRef.current.stopRecording();
    setIsRecording(false);
    const file = new File(
      [blob],
      `consultation_${consultationId}_${Date.now()}.webm`,
      { type: "video/webm" }
    );
    console.log("Recording saved:", file, url, recordDuration);
    toast.success("Recording saved");
  }, [consultationId, isRecording]);

  const leaveCall = useCallback(async () => {
    if (isRecording) {
      await toggleRecording();
    }

    try {
      await endCall(consultationId);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to end call on server"));
      return;
    }

    await cleanupAgora();

    try {
      const status = await fetchCallStatus(consultationId);
      applyStatus(status);
      if (status.duration_minutes != null) {
        setDuration(Math.round(status.duration_minutes * 60));
      }
    } catch {
      // Local ended state is still valid if status refresh fails.
    }

    setCallState("ended");
    toast.success("Consultation ended");
    if (onCallEnd) onCallEnd();
  }, [applyStatus, cleanupAgora, consultationId, isRecording, onCallEnd, toggleRecording]);

  const toggleMic = useCallback(async () => {
    const { audio } = localTracksRef.current;
    if (!audio) return;
    await audio.setEnabled(isMuted);
    setIsMuted(!isMuted);
    toast(isMuted ? "Microphone unmuted" : "Microphone muted");
  }, [isMuted]);

  const toggleCamera = useCallback(async () => {
    const { video } = localTracksRef.current;
    if (!video) return;
    const nextCameraOff = !isCameraOff;
    await video.setEnabled(!nextCameraOff);
    setIsCameraOff(nextCameraOff);
    if (!nextCameraOff) {
      playLocalVideo();
    }
    toast(nextCameraOff ? "Camera stopped" : "Camera started");
  }, [isCameraOff, playLocalVideo]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const switchCamera = useCallback(async () => {
    const { video } = localTracksRef.current;
    if (!video) return;

    const currentDeviceId = video.getTrack().getSettings().deviceId;
    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = mediaDevices.filter((d) => d.kind === "videoinput");
    const currentIndex = videoDevices.findIndex((d) => d.deviceId === currentDeviceId);
    const nextDevice = videoDevices[(currentIndex + 1) % videoDevices.length];

    if (nextDevice) {
      await video.setDevice(nextDevice.deviceId);
      playLocalVideo();
      toast.success("Camera switched");
    }
  }, [playLocalVideo]);

  const onDragEnd = (event, info) => {
    pipPositionRef.current = { x: info.point.x, y: info.point.y };
  };

  useEffect(() => {
    return () => {
      cleanupAgora();
    };
  }, [cleanupAgora]);

  if (checkingPermissions || loadingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-16 h-16 mx-auto rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "#0a4d3e", borderTopColor: "transparent" }}
          />
          <p className="text-gray-400 mt-4">
            {checkingPermissions ? "Checking permissions..." : "Loading consultation status..."}
          </p>
        </div>
      </div>
    );
  }

  if (callState === "ended") {
    const endedPresentation = getCallEndedPresentation(callStatusData);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{endedPresentation.title}</h2>
          {endedPresentation.subtitle && (
            <p className="text-gray-500 text-sm mb-4">{endedPresentation.subtitle}</p>
          )}
          <p className="text-gray-500 mb-2 flex items-center justify-center gap-2">
            <Clock size={16} />
            Duration: {formatDuration(duration)}
          </p>
          {callStatusData?.call_ended_at && (
            <p className="text-gray-400 text-sm mb-6">
              Ended at {new Date(callStatusData.call_ended_at).toLocaleString()}
            </p>
          )}
          <button
            onClick={e => {
              // onCallEnd()
              window.location.reload()
            }}
            className="px-6 py-2 bg-[#0a4d3e] text-white rounded-lg hover:bg-[#0d614e] transition-colors"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }

  const joinLabel =
    callStatusData?.call_status === "in_progress" ? "Join Consultation" : "Start Consultation";

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden"
    >
      {timeUntilEnd !== null && timeUntilEnd > 0 && timeUntilEnd <= 300 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2  rounded-lg bg-amber-500/95 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg" style={{ zIndex: 1000 }}>
          Meeting ends in {formatDuration(timeUntilEnd)}
        </div>
      )}
      <VideoHeader
        patientName={patientDetails?.first_name}
        duration={duration}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        networkQuality={networkQuality}
        isRecording={isRecording}
        recordingDuration={recordingDuration}
      />

      <div className="relative h-[100vh] mx-4">
        <div className="relative w-full h-full bg-black/50 rounded-2xl overflow-hidden shadow-2xl">
          <div
            ref={remoteVideoRef}
            className="video-call-player absolute inset-0 bg-black"
          />

          {!patientJoined && callState === "active" && (
            <WaitingScreen patientName={patientDetails?.first_name} />
          )}

          {callState !== "active" && callState !== "joining" && (
            <div className="absolute inset-0 flex flex-col items-center top-10 bg-black/80 z-10">
              {callState === "idle" ? (
                <>
                  <Video size={48} className="text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm mb-4">Ready to start consultation</p>
                  {permissions.camera && permissions.microphone ? (
                    <a
                      onClick={joinCall}
                      className="video-call-no-drag px-6 py-2.5 bg-[#0a4d3e] text-white rounded-xl text-sm font-semibold hover:bg-[#0d614e] transition-all flex items-center gap-2 shadow-lg"
                    >
                      <Phone size={16} /> {joinLabel}
                    </a>
                  ) : (
                    <a
                      onClick={() => window.location.reload()}
                      className="video-call-no-drag px-5 py-2 bg-[#0a4d3e] text-white rounded-lg text-sm"
                    >
                      Refresh & Allow
                    </a>
                  )}
                </>
              ) : (
                <>
                  <Loader2 size={40} className="text-emerald-500 animate-spin mb-3" />
                  <p className="text-gray-400 text-sm">Connecting...</p>
                </>
              )}
              {error && (
                <div className="mt-3 px-3 py-1.5 bg-red-500/20 rounded-lg flex items-center gap-1.5">
                  <AlertCircle size={12} className="text-red-400" />
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}
            </div>
          )}

          {patientJoined && callState === "active" && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500/90 backdrop-blur rounded-lg flex items-center gap-1.5 z-20">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-white text-xs">Patient Connected</span>
            </div>
          )}
        </div>
      </div>

      {callState === "active" && (
        <VideoPip
          videoRef={localVideoRef}
          isCameraOff={isCameraOff}
          isMuted={isMuted}
          onDragEnd={onDragEnd}
        />
      )}

      <VideoControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isRecording={isRecording}
        isFullscreen={isFullscreen}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleRecording={toggleRecording}
        onToggleFullscreen={toggleFullscreen}
        onEndCall={leaveCall}
        onOpenSettings={() => setShowSettings(!showSettings)}
        onSwitchCamera={switchCamera}
        availableCameras={devices.videoInputs}
        callState={callState}
        onJoinCall={joinCall}
      />
    </div>
  );
}
