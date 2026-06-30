'use client';

import React, { useState } from 'react';
import { Player } from '@remotion/player';
import { MyComposition } from './composition';

export const DemoPlayer: React.FC = () => {
  const [title, setTitle] = useState('AKUBRECAH KRA');
  const [subtitle, setSubtitle] = useState('Remotion Integration Successful');

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto p-6 bg-zinc-950 border border-zinc-800 rounded-none shadow-2xl relative overflow-hidden">
      {/* Player Section */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full aspect-video border-[3px] border-zinc-800 bg-black overflow-hidden relative shadow-lg">
          <Player
            component={MyComposition}
            inputProps={{
              titleText: title,
              subtitleText: subtitle,
            }}
            durationInFrames={150}
            fps={30}
            compositionWidth={1920}
            compositionHeight={1080}
            style={{
              width: '100%',
              height: '100%',
            }}
            controls
            loop
          />
        </div>
        <div className="mt-4 text-xs font-mono text-zinc-500 flex justify-between w-full">
          <span>DIMENSIONS: 1920x1080 (16:9)</span>
          <span>FPS: 30 // LENGTH: 5s (150 FRAMES)</span>
        </div>
      </div>

      {/* Editor / Customization Section */}
      <div className="w-full lg:w-96 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-zinc-800 pt-6 lg:pt-0 lg:pl-8">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#39ff14] mb-2 font-sans">
            VIDEO GENERATOR
          </h2>
          <p className="text-xs text-zinc-400 font-mono mb-6 uppercase tracking-wider">
            Edit parameters to update video dynamically
          </p>

          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Title Text
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 text-white font-mono text-sm focus:outline-none focus:border-[#39ff14] transition-colors rounded-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Subtitle Text
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 text-white font-mono text-sm focus:outline-none focus:border-[#39ff14] transition-colors rounded-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-800 pt-6">
          <div className="p-4 bg-zinc-900 border-l-[3px] border-[#39ff14] font-mono text-xs text-zinc-400">
            <span className="text-white font-bold block mb-1">PRO TIP</span>
            Remotion renders React components to high-quality video frames using Puppeteer. This player is playing it in real time using your React tree.
          </div>
        </div>
      </div>
    </div>
  );
};
