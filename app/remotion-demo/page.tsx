import React from 'react';
import { DemoPlayer } from '@/components/remotion/demo-player';
import Link from 'next/link';

export const metadata = {
  title: 'Remotion Studio | Akubrecah KRA Portal',
  description: 'Design and preview programmatic video layouts in real time.',
};

export default function RemotionDemoPage() {
  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col justify-between overflow-x-hidden font-sans">
      {/* Background aesthetics */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#39ff14] opacity-5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#39ff14] opacity-5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="z-10 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md sticky top-0 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-[#39ff14]" />
            <h1 className="text-xl font-black tracking-tight uppercase">
              REMOTION <span className="text-zinc-500 font-normal">STUDIO</span>
            </h1>
          </div>
          <Link
            href="/"
            className="text-xs font-mono text-zinc-400 hover:text-white border border-zinc-800 hover:border-white px-3 py-1.5 transition-colors uppercase"
          >
            &larr; Back to Portal
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="z-10 flex-grow py-12 px-6 flex flex-col justify-center items-center">
        <div className="max-w-6xl w-full text-center mb-12">
          <span className="text-xs font-mono tracking-widest text-[#39ff14] uppercase bg-[#39ff14]/10 px-3 py-1 border border-[#39ff14]/20 inline-block mb-4">
            Beta Feature Enabled
          </span>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 max-w-2xl mx-auto">
            Programmatic Video Rendering
          </h2>
          <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto">
            Create high-fidelity video templates in React and preview changes instantly with smooth frame-by-frame scrubbing.
          </p>
        </div>

        <DemoPlayer />
      </main>

      {/* Footer */}
      <footer className="z-10 border-t border-zinc-950 py-6 px-6 text-center text-xs font-mono text-zinc-800 opacity-60">
        AKUBRECAH ENTERTAINMENT // REMOTION SDK INTEGRATION
      </footer>
    </div>
  );
}
