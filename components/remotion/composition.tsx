import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import React from 'react';

export interface MyCompositionProps {
  titleText: string;
  subtitleText: string;
}

export const MyComposition: React.FC<MyCompositionProps> = ({
  titleText = 'AKUBRECAH',
  subtitleText = 'Next-Gen Video Generation Framework',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring animation for title
  const titleSpring = spring({
    frame,
    fps,
    config: {
      damping: 12,
    },
  });

  // Calculate title scale and opacity based on spring
  const titleScale = interpolate(titleSpring, [0, 1], [0.8, 1]);
  const titleOpacity = titleSpring;

  // Slide up animation for subtitle
  const subtitleSpring = spring({
    frame: frame - 15, // start after 15 frames
    fps,
    config: {
      damping: 14,
    },
  });
  
  const subtitleY = interpolate(subtitleSpring, [0, 1], [50, 0]);
  const subtitleOpacity = subtitleSpring;

  return (
    <div className="absolute inset-0 bg-[#0f0f11] flex flex-col justify-center items-center font-sans overflow-hidden p-8 border-[6px] border-[#39ff14] text-white">
      {/* Background radial glow */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          background: 'radial-gradient(circle, #39ff14 0%, transparent 70%)',
        }}
      />

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="z-10 text-center max-w-2xl">
        <h1 
          className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-[#39ff14] leading-none mb-6"
          style={{
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
          }}
        >
          {titleText}
        </h1>
        <p 
          className="text-lg md:text-2xl font-light text-zinc-400 tracking-wide"
          style={{
            transform: `translateY(${subtitleY}px)`,
            opacity: subtitleOpacity,
          }}
        >
          {subtitleText}
        </p>
      </div>

      {/* Aesthetic Border Elements */}
      <div className="absolute top-6 left-6 text-xs font-mono text-[#39ff14] opacity-50">SYS // REMOTION.ACTIVE</div>
      <div className="absolute bottom-6 right-6 text-xs font-mono text-[#39ff14] opacity-50">
        FRAME: {frame} / FPS: {fps}
      </div>
    </div>
  );
};
