const StatsCard = () => {
  return (
    <section className="w-full overflow-hidden rounded-[36px] border border-white/10">
      <div className="flex h-full flex-col justify-between gap-4 lg:gap-6 p-8 lg:h-[284px] lg:flex-row lg:items-stretch">
        <div className="flex h-full w-full max-w-[300px] lg:max-w-[260px] flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-full border-0 bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur">
              Total Campaigns
            </div>
            <div className="rounded-full bg-gradient-to-r from-cyan-500/40 to-indigo-400/40 px-4 py-1.5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(62,100,180,0.35)] backdrop-blur">
              +3.4%
            </div>
          </div>

          <div>
            <p className="text-[44px] font-semibold tracking-tight text-white md:text-[50px]">220,342.76</p>
          </div>
        </div>

        <div className="relative flex h-full flex-1 items-end justify-center overflow-hidden p-0 bg-transparent min-h-[200px] md:min-h-[220px]">

          <div className="pointer-events-none absolute top-8 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-center text-white backdrop-blur">
            <span className="block text-xs text-white/60">Campaigns</span>
            <span className="block text-sm font-semibold">200</span>
          </div>

          <span className="pointer-events-none absolute top-16 left-1/2 z-0 h-[180px] w-px -translate-x-1/2 bg-gradient-to-b from-white/80 to-transparent opacity-80" />
          <span className="pointer-events-none absolute top-16 left-1/2 z-0 h-[180px] w-[2px] -translate-x-1/2 bg-black/40 blur-[2px] opacity-60" />
          <span className="pointer-events-none absolute top-16 left-1/2 z-0 -translate-x-1/2 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-400 shadow-[0_0_0_14px_rgba(104,179,183,0.35)]" style={{ width: 20, height: 20 }} />

          <svg viewBox="0 0 460 162" preserveAspectRatio="none" className="absolute inset-0 z-0 h-full w-full">
            <defs>
              {/* Blue line stroke with cyan→blue gradient */}
              <linearGradient id="line-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#68B1B8" />
                <stop offset="100%" stopColor="#385AB4" />
              </linearGradient>
              {/* Green area fill under line */}
              <linearGradient id="fill-green" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#68B1B8" stopOpacity="0" />
                <stop offset="55%" stopColor="#68B1B8" stopOpacity="0.10" />
                <stop offset="85%" stopColor="#68B1B8" stopOpacity="0.26" />
                <stop offset="100%" stopColor="#68B1B8" stopOpacity="0.42" />
              </linearGradient>
              {/* Soft glow for line */}
              <filter id="line-glow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Area fill behind the line */}
            <path
              d="M-2,130 C30,128 50,120 80,126 C110,132 130,110 160,118 C190,126 220,70 255,60 C285,78 310,110 338,102 C362,96 382,110 410,126 C430,138 450,136 462,138 L462,162 L-2,162 Z"
              fill="url(#fill-green)"
              opacity="0.75"
            />
            {/* Blue line stroke */}
            {/* Soft glow line behind */}
            <path
              d="M-2,130 C30,128 50,120 80,126 C110,132 130,110 160,118 C190,126 220,70 255,60 C285,78 310,110 338,102 C362,96 382,110 410,126 C430,138 450,136 462,138"
              fill="none"
              stroke="#385AB4"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.24"
              filter="url(#line-glow)"
            />
            <path
              d="M-2,130 C30,128 50,120 80,126 C110,132 130,110 160,118 C190,126 220,70 255,60 C285,78 310,110 338,102 C362,96 382,110 410,126 C430,138 450,136 462,138"
              fill="none"
              stroke="url(#line-blue)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.98"
            />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default StatsCard;
