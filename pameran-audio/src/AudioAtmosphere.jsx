export function AudioWave({ bars = 9, className = '', height = 'h-8' }) {
  return (
    <div className={`wave-track ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`wave-bar ${height}`}
          style={{ animationDelay: `${(i % 5) * 0.12}s`, animationDuration: `${0.9 + (i % 3) * 0.25}s` }}
        />
      ))}
    </div>
  );
}

export function Atmosphere({ children }) {
  const particles = [
    { left: '12%', size: 6, dur: 14, delay: 0 },
    { left: '28%', size: 4, dur: 18, delay: 3 },
    { left: '45%', size: 7, dur: 12, delay: 6 },
    { left: '62%', size: 5, dur: 16, delay: 2 },
    { left: '78%', size: 8, dur: 20, delay: 5 },
    { left: '90%', size: 4, dur: 15, delay: 8 },
  ];

  return (
    <main className="App-atmosphere min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(225,6,0,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,77,77,0.05),transparent_50%)]" />

      {particles.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            bottom: '-20px',
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      <div className="relative w-full flex justify-center">{children}</div>
    </main>
  );
}

export function PapiLogo({ size = 'md' }) {
  const text = size === 'lg' ? 'text-3xl' : 'text-2xl';

  return (
    <div className="flex flex-col items-center justify-center gap-1 mb-5">
      <div
        className={`${text} font-extrabold tracking-[0.3em] text-white`}
      >
        PAPI
      </div>
      <div className="text-[11px] tracking-[0.25em] text-white/40 uppercase">
        Portable Audio Party
      </div>
    </div>
  );
}
