// PatientVideoCallWeb.jsx — REFERENCE ONLY (not part of Doctor Dashboard delivery).
// The patient application is a separate repo; implement the same API flow there.
// This file and /patvideocall route are kept for local prototyping only.
import React, { useState, useEffect, useRef, useCallback } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  AlertCircle,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  Leaf,
  Clock,
  Loader2,
  Stethoscope,
} from "lucide-react";
import { useParams } from "react-router-dom";
import VideoPip from "./VideoPip";
import {
  apiErrorMessage,
  endCall,
  fetchAgoraToken,
  fetchCallStatus,
  joinAgoraChannel,
  reportJoinedEvent,
  startCall,
} from "../../../services/appointmentCallService";

const TEST_CONFIG = {
  enabled: false,
  appId: "",
  token: "",
  channel: "",
  uid: null,
};

const ControlButton = ({ icon: Icon, active, onClick, variant = "default", label }) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    aria-label={label}
    className={`flex flex-col items-center gap-1 min-w-[52px] sm:min-w-0 sm:flex-row sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-2.5 rounded-2xl sm:rounded-xl font-medium transition-all ${
      variant === "danger"
        ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25"
        : active
          ? "bg-white/15 hover:bg-white/25 text-white"
          : "bg-red-500/90 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
    }`}
  >
    <Icon size={20} className="sm:w-[18px] sm:h-[18px]" />
    <span className="text-[10px] sm:text-sm leading-none">{label}</span>
  </motion.button>
);

const formatDuration = (seconds) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

const VIDEO_PLAY_CONFIG = { fit: "contain" };

export default function PatientVideoCallWeb({ doctorName = "Doctor", onCallEnd }) {
  const { token: urlAuthToken, consultationId } = useParams();
  const accessToken =
    urlAuthToken ||
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken") ||
    "";

  const [callState, setCallState] = useState("idle");
  const [callStatusData, setCallStatusData] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [doctorJoined, setDoctorJoined] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  const clientRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null });
  const timerRef = useRef(null);
  const isMutedRef = useRef(false);
  const isCameraOffRef = useRef(false);
  const isInChannelRef = useRef(false);
  const callStateRef = useRef("idle");

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
    } else if (callStateRef.current === "ended") {
      setCallState("idle");
    }
  }, []);

  const cleanupAgora = useCallback(async () => {
    isInChannelRef.current = false;
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
    if (!consultationId || TEST_CONFIG.enabled) return null;
    const status = await fetchCallStatus(consultationId, accessToken);
    applyStatus(status);
    return status;
  }, [accessToken, applyStatus, consultationId]);

  const reconcilePresence = useCallback(async () => {
    if (!consultationId || TEST_CONFIG.enabled) return;

    try {
      const status = await fetchCallStatus(consultationId, accessToken);
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
        reportJoinedEvent(consultationId, accessToken).catch((err) => {
          console.warn("Joined event resync failed:", err);
        });
      }
    } catch (err) {
      console.warn("Call status reconcile failed:", err);
    }
  }, [accessToken, applyStatus, cleanupAgora, consultationId]);

  const playLocalVideo = useCallback(async () => {
    const { video } = localTracksRef.current;
    if (!video || !localVideoRef.current || isCameraOffRef.current) return;
    try {
      await video.play(localVideoRef.current, VIDEO_PLAY_CONFIG);
    } catch (err) {
      console.warn("Local video play failed:", err);
    }
  }, []);

  const playRemoteVideo = useCallback((track) => {
    if (!track || !remoteVideoRef.current) return;
    try {
      track.play(remoteVideoRef.current, VIDEO_PLAY_CONFIG);
    } catch (err) {
      console.warn("Remote video play failed:", err);
    }
  }, []);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isCameraOffRef.current = isCameraOff;
  }, [isCameraOff]);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const cam = await navigator.mediaDevices.getUserMedia({ video: true });
        cam.getTracks().forEach((t) => t.stop());
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        mic.getTracks().forEach((t) => t.stop());
        setPermissionsGranted(true);
      } catch (err) {
        console.error("Permission error:", err);
        setError("Camera or microphone access is required. Please allow permissions and refresh.");
        setPermissionsGranted(false);
      } finally {
        setCheckingPermissions(false);
      }
    };
    checkPermissions();
  }, []);

  useEffect(() => {
    if (!consultationId || checkingPermissions || TEST_CONFIG.enabled) {
      if (TEST_CONFIG.enabled) {
        setLoadingStatus(false);
      }
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setLoadingStatus(true);
      try {
        const status = await fetchCallStatus(consultationId, accessToken);
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
  }, [accessToken, applyStatus, checkingPermissions, consultationId]);

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

  useEffect(() => {
    if (callState === "active") {
      playLocalVideo();
    }
  }, [callState, playLocalVideo]);

  const joinCall = useCallback(async () => {
    if (!permissionsGranted) {
      setError("Please allow camera and microphone access first");
      return;
    }

    setCallState("joining");
    setError(null);
    toast.loading("Connecting to consultation...", { id: "join" });

    try {
      if (!accessToken && !TEST_CONFIG.enabled) {
        throw new Error("Please log in again — session token not found");
      }

      let status = null;
      if (!TEST_CONFIG.enabled) {
        status = await loadCallStatus();
        if (status?.call_status === "ended") {
          throw new Error("This video call has already ended.");
        }

        if (status?.call_status === "not_started") {
          await startCall(consultationId, accessToken);
        }
      }

      const tokenData = TEST_CONFIG.enabled
        ? {
            app_id: TEST_CONFIG.appId,
            token: TEST_CONFIG.token,
            channel: TEST_CONFIG.channel,
            uid: TEST_CONFIG.uid,
          }
        : await fetchAgoraToken(consultationId, accessToken);

      if (!tokenData?.app_id || !tokenData?.channel || !tokenData?.token) {
        throw new Error("Invalid token data received");
      }

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);

        if (mediaType === "video") {
          setDoctorJoined(true);
          toast.success("Doctor has joined the consultation", { id: "join" });
          playRemoteVideo(user.videoTrack);
        }

        if (mediaType === "audio" && user.audioTrack) {
          user.audioTrack.play();
        }
      });

      client.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video" && user.videoTrack) {
          user.videoTrack.stop();
        }
      });

      client.on("user-left", () => {
        setDoctorJoined(false);
        toast("Doctor left the consultation", { icon: "👨‍⚕️" });
      });

      client.on("connection-state-change", (curState) => {
        if (curState === "DISCONNECTED") {
          setError("Connection lost. Reconnecting...");
          reconcilePresence();
        }
      });

      if (TEST_CONFIG.enabled) {
        await client.join(
          tokenData.app_id,
          tokenData.channel,
          tokenData.token,
          Number(tokenData.uid)
        );
      } else {
        await joinAgoraChannel(client, tokenData, {
          appointmentId: consultationId,
          accessToken,
        });
      }

      isInChannelRef.current = true;

      if (!TEST_CONFIG.enabled) {
        reportJoinedEvent(consultationId, accessToken).catch((err) => {
          console.warn("Joined event delivery failed:", err);
        });
      }

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        AEC: true,
        AGC: true,
        ANS: true,
      });
      const videoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: {
          width: 640,
          height: 480,
          frameRate: 24,
          bitrateMin: 200,
          bitrateMax: 600,
        },
        facingMode: "user",
        optimizationMode: "motion",
      });

      localTracksRef.current = { audio: audioTrack, video: videoTrack };
      isMutedRef.current = false;
      isCameraOffRef.current = false;
      setIsMuted(false);
      setIsCameraOff(false);

      await client.publish([audioTrack, videoTrack]);

      setCallState("active");
      toast.success("Connected successfully", { id: "join" });
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      console.error("Join error:", err);
      await cleanupAgora();
      const message = apiErrorMessage(
        err,
        "Could not join. Check your camera/mic permissions or credentials."
      );
      setError(message);
      toast.error(message, { id: "join" });
      setCallState(callStatusData?.call_status === "ended" ? "ended" : "idle");
    }
  }, [
    accessToken,
    callStatusData?.call_status,
    cleanupAgora,
    consultationId,
    loadCallStatus,
    permissionsGranted,
    playRemoteVideo,
    reconcilePresence,
  ]);

  const leaveCall = useCallback(async () => {
    setShowLeaveConfirm(false);
    toast.loading("Ending consultation...", { id: "end" });

    try {
      if (!TEST_CONFIG.enabled) {
        await endCall(consultationId, accessToken);
      }
    } catch (err) {
      console.error("endCall:", err);
      toast.error(apiErrorMessage(err, "Failed to end call on server"), { id: "end" });
      return;
    }

    await cleanupAgora();

    if (!TEST_CONFIG.enabled) {
      try {
        const status = await fetchCallStatus(consultationId, accessToken);
        applyStatus(status);
        if (status.duration_minutes != null) {
          setDuration(Math.round(status.duration_minutes * 60));
        }
      } catch {
        // Keep local ended state if status refresh fails.
      }
    }

    setCallState("ended");
    toast.success("Consultation ended", { id: "end" });
    if (onCallEnd) onCallEnd();
  }, [accessToken, applyStatus, cleanupAgora, consultationId, onCallEnd]);

  const toggleMic = useCallback(async () => {
    const { audio } = localTracksRef.current;
    if (!audio) return;

    const nextMuted = !isMutedRef.current;
    await audio.setEnabled(!nextMuted);
    isMutedRef.current = nextMuted;
    setIsMuted(nextMuted);

    if (!isCameraOffRef.current) {
      await playLocalVideo();
    }

    toast(nextMuted ? "Microphone muted" : "Microphone unmuted");
  }, [playLocalVideo]);

  const toggleCamera = useCallback(async () => {
    const { video } = localTracksRef.current;
    if (!video) return;

    const nextCameraOff = !isCameraOffRef.current;
    await video.setEnabled(!nextCameraOff);
    isCameraOffRef.current = nextCameraOff;
    setIsCameraOff(nextCameraOff);

    if (!nextCameraOff) {
      await playLocalVideo();
    }

    toast(nextCameraOff ? "Camera stopped" : "Camera started");
  }, [playLocalVideo]);

  useEffect(() => {
    return () => {
      cleanupAgora();
    };
  }, [cleanupAgora]);

  if (checkingPermissions || loadingStatus) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#0a2e26] via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 size={48} className="mx-auto text-emerald-400 animate-spin" />
          <p className="text-gray-400 text-sm sm:text-base">
            {checkingPermissions
              ? "Checking camera and microphone..."
              : "Loading consultation status..."}
          </p>
        </div>
      </div>
    );
  }

  if (callState === "ended") {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#0a2e26] via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center max-w-md w-full"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-emerald-600 sm:w-10 sm:h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Consultation Ended</h2>
          <p className="text-gray-500 mb-2">Duration: {formatDuration(duration)}</p>
          {callStatusData?.call_ended_at && (
            <p className="text-gray-400 text-sm mb-6">
              Ended at {new Date(callStatusData.call_ended_at).toLocaleString()}
            </p>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-8 py-3 bg-[#0D614E] text-white rounded-xl hover:bg-[#0a4d3e] transition-colors font-medium"
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
    <div className="relative min-h-[100dvh] bg-gradient-to-br from-[#0a2e26] via-gray-900 to-gray-950 overflow-hidden flex flex-col">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="shrink-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4 safe-top"
      >
        <div className="bg-gradient-to-r from-[#0a4d3e]/95 to-[#0D614E]/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                <Leaf size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-white truncate">
                  Video Consultation
                </h1>
                <p className="text-[10px] sm:text-xs text-emerald-100/80 flex items-center gap-1">
                  <Stethoscope size={10} />
                  Dr. {doctorName}
                </p>
              </div>
            </div>

            {callState === "active" && (
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg">
                  {isMuted ? (
                    <MicOff size={12} className="text-red-300" />
                  ) : (
                    <Mic size={12} className="text-emerald-300" />
                  )}
                  {isCameraOff ? (
                    <VideoOff size={12} className="text-red-300" />
                  ) : (
                    <Video size={12} className="text-emerald-300" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/25 rounded-lg">
                  <Clock size={12} className="text-emerald-200" />
                  <span className="text-white font-mono text-xs sm:text-sm tabular-nums">
                    {formatDuration(duration)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      <div className="flex-1 min-h-0 px-3 py-3 sm:px-4 sm:py-4 pb-28 sm:pb-32">
        <div className="relative w-full h-full !min-h-[86.5vh] sm:min-h-0 bg-black/60 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/5 ">
          <div
            ref={remoteVideoRef}
            className="video-call-player absolute inset-0 bg-black [&_video]:object-contain [&_video]:w-full [&_video]:h-full"
          />

          {!doctorJoined && callState === "active" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90 z-10 p-6 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <Users size={32} className="text-gray-400 sm:w-10 sm:h-10" />
              </div>
              <p className="text-white font-medium text-base sm:text-lg mb-1">
                Waiting for your doctor
              </p>
              <p className="text-gray-400 text-xs sm:text-sm max-w-xs">
                Dr. {doctorName} will join shortly. Please stay on this screen.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-300 text-xs">Connected — waiting room</span>
              </div>
            </div>
          )}

          {callState !== "active" && callState !== "joining" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95 z-10 p-6 text-center">
              {callState === "idle" ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-[#0D614E]/20 flex items-center justify-center mb-4">
                    <Video size={32} className="text-emerald-400" />
                  </div>
                  <p className="text-white font-medium text-base sm:text-lg mb-1">Ready to join</p>
                  <p className="text-gray-400 text-xs sm:text-sm mb-6 max-w-xs">
                    Your consultation with Dr. {doctorName} is ready. Tap below when you&apos;re set.
                  </p>
                  {permissionsGranted && (
                    <button
                      type="button"
                      onClick={joinCall}
                      className="px-8 py-3.5 bg-[#0D614E] text-white rounded-2xl font-semibold hover:bg-[#0a4d3e] active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/40"
                    >
                      <Phone size={18} /> {joinLabel}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Loader2 size={40} className="text-emerald-400 animate-spin mb-3" />
                  <p className="text-gray-300 text-sm">Connecting...</p>
                </>
              )}
              {error && (
                <div className="mt-4 px-4 py-2.5 bg-red-500/15 border border-red-500/30 rounded-xl flex items-start gap-2 max-w-sm">
                  <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-300 text-xs sm:text-sm text-left">{error}</p>
                </div>
              )}
            </div>
          )}

          {doctorJoined && callState === "active" && (
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-col gap-2">
              <div className="px-2.5 py-1.5 bg-emerald-500/90 backdrop-blur rounded-lg flex items-center gap-1.5 w-fit">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="text-white text-[10px] sm:text-xs font-medium">
                  Doctor Connected
                </span>
              </div>
              <div className="px-2.5 py-1 bg-black/50 backdrop-blur rounded-lg w-fit">
                <span className="text-white text-xs sm:text-sm">Dr. {doctorName}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {callState === "active" && (
        <VideoPip
          videoRef={localVideoRef}
          isCameraOff={isCameraOff}
          isMuted={isMuted}
          onDragEnd={() => {}}
        />
      )}

      <AnimatePresence>
        {callState === "active" && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-6"
          >
            <div className="max-w-lg mx-auto bg-black/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl px-2 py-2.5 sm:px-4 sm:py-3">
              <div className="flex items-center justify-center gap-1.5 sm:gap-3">
                <ControlButton
                  icon={isMuted ? MicOff : Mic}
                  active={!isMuted}
                  onClick={toggleMic}
                  label={isMuted ? "Unmute" : "Mute"}
                />
                <ControlButton
                  icon={isCameraOff ? VideoOff : Video}
                  active={!isCameraOff}
                  onClick={toggleCamera}
                  label={isCameraOff ? "Camera" : "Video"}
                />
                <ControlButton
                  icon={PhoneOff}
                  onClick={() => setShowLeaveConfirm(true)}
                  variant="danger"
                  label="Leave"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                End Consultation?
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Are you sure you want to leave? This will end your video consultation.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/15 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={leaveCall}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                >
                  Leave Call
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
