// components/VideoPip.jsx - Compact Version
import React, { useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { VideoOff, MicOff } from 'lucide-react';

const VideoPip = ({ videoRef, isCameraOff, isMuted, onDragEnd }) => {
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none">
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        style={{ x, y }}
        className="absolute bottom-20 right-4 w-36 md:w-44 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black pointer-events-auto cursor-move z-30"
        whileDrag={{ scale: 1.02 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div
          ref={videoRef}
          className="video-pip w-full aspect-[4/3] bg-black [&_video]:object-contain [&_video]:w-full [&_video]:h-full"
        />
        
        {isCameraOff && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/90">
            <VideoOff size={24} className="text-gray-500 mb-1" />
            <span className="text-[10px] text-gray-400">Camera off</span>
          </div>
        )}
        
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white flex items-center gap-1">
          <span>You</span>
          {isMuted && <MicOff size={8} className="text-red-400" />}
        </div>

        {/* Drag handle */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-white/20 rounded-full" />
      </motion.div>
    </div>
  );
};

export default VideoPip;