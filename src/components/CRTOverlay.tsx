'use client';

export default function CRTOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-100 overflow-hidden mix-blend-overlay opacity-80">
      {/* Scanlines (Linhas horizontais da TV) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-size-[100%_4px]"></div>
      
      {/* Vignette (Escurecimento nas bordas da tela inteira) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)]"></div>
      
      {/* Glare/Reflexo do vidro do fliperama */}
      <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[50%] bg-linear-to-b from-white/5 to-transparent skew-y-12 transform opacity-30"></div>
    </div>
  );
}