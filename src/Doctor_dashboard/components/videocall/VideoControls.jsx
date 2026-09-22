// components/VideoControls.jsx - Compact Version
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Video, VideoOff, Square, Circle, 
  Maximize2, Minimize2, Settings, PhoneOff,
  Camera, Phone
} from 'lucide-react';

const ControlButton = ({ icon: Icon, active, onClick, variant = 'default', size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'p-2.5' : 'p-3';
  
  const getStyles = () => {
    if (variant === 'danger') {
      return active 
        ? 'bg-red-600 text-white'
        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30';
    }
    if (variant === 'success') {
      return 'bg-[#0d614e] text-white hover:bg-[#0a4d3e] shadow-lg';
    }
    return active
      ? 'bg-[#0d614e] text-white'
      : 'bg-white/10 text-white hover:bg-white/20';
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative rounded-full transition-all duration-200 ${sizeClasses} ${getStyles()}`}
    >
      <Icon size={16} />
    </motion.button>
  );
};

const VideoControls = ({
  isMuted,
  isCameraOff,
  isRecording,
  isFullscreen,
  onToggleMic,
  onToggleCamera,
  onToggleRecording,
  onToggleFullscreen,
  onEndCall,
  onOpenSettings,
  onSwitchCamera,
  availableCameras,
  callState
}) => {
  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="video-call-no-drag fixed bottom-8 left-14 right-0 z-50"
    >
      <div className="flex justify-center">
        <div className="bg-black/50 backdrop-blur-xl rounded-2xl px-3 py-2 shadow-2xl border border-white/10">
          
          {callState === "idle" ? (
           ""
          ) : (
            <div className="flex items-center gap-2">
              {/* Mic Control */}
              <ControlButton
                icon={isMuted ? MicOff : Mic}
                active={!isMuted}
                onClick={onToggleMic}
              />

              {/* Camera Control */}
              <ControlButton
                icon={isCameraOff ? VideoOff : Video}
                active={!isCameraOff}
                onClick={onToggleCamera}
              />

              {/* Switch Camera (if multiple cameras) */}
              {/* {availableCameras && availableCameras.length > 1 && (
                <ControlButton
                  icon={Camera}
                  onClick={onSwitchCamera}
                />
              )} */}

              {/* Recording Control */}
              {/* <ControlButton
                icon={isRecording ? Square : Circle}
                active={isRecording}
                onClick={onToggleRecording}
                variant={isRecording ? 'danger' : 'default'}
              /> */}

              {/* Fullscreen Control */}
              <ControlButton
                icon={isFullscreen ? Minimize2 : Maximize2}
                onClick={onToggleFullscreen}
              />

              {/* Settings Control */}
              {/* <ControlButton
                icon={Settings}
                onClick={onOpenSettings}
              /> */}

              {/* Divider */}
              <div className="w-px h-6 bg-white/20 mx-1" />

              {/* End Call */}
              <ControlButton
                icon={PhoneOff}
                onClick={onEndCall}
                variant="danger"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VideoControls;