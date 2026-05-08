interface PageBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function PageBackground({ children, className = "" }: PageBackgroundProps) {
  return (
    <div className={`min-h-screen bg-[#061411] py-12 relative overflow-hidden ${className}`}>
      {/* Dev Cave Animated Core */}
      <div className="absolute top-[-10%] -left-[10%] w-[60%] h-[60%] bg-[#1F6F5B]/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
      <div className="absolute top-[-5%] -right-[5%] w-[40%] h-[40%] bg-[#F2E600]/5 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute -bottom-[20%] left-[10%] w-[70%] h-[70%] bg-[#145A47]/10 rounded-full mix-blend-screen filter blur-[150px] animate-blob animation-delay-4000" />
      
      {/* Grid Pattern with Glow */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(31,111,91,0.05),transparent_70%)]" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
