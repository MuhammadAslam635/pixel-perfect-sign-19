const StatsCard = () => {
  return (
    <section className="stats-card relative w-full overflow-hidden rounded-[36px] border border-white/10 px-6 py-6 sm:px-8 sm:py-8">
      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div className="flex flex-wrap items-center gap-1">
          <span className="rounded-full border border-white/5 bg-white/5 px-2 py-1.5 text-[8px] font-medium uppercase tracking-wide text-white/75">
            Total Campagings
          </span>
          <span className="rounded-full bg-gradient-to-r from-[#67B2B7]/80 to-[#405FB3]/90 px-4 py-1.5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(62,100,180,0.35)]">
            +3.4%
          </span>
        </div>

        <p className="text-[15px] font-semibold tracking-tight text-white sm:text-[48px] w-20">
          220,342.76
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 stats-chart" />

        <div className="absolute right-6 top-6 rounded-2xl border border-white/10 bg-black/60 px-4 py-2 text-center text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur">
          <span className="block text-[11px] text-white/60">Campagings</span>
          <span className="block text-sm font-semibold">200</span>
        </div>

        <span className="absolute top-12 right-[18%] z-10 h-[180px] w-px bg-gradient-to-b from-white/80 to-transparent" />
        <span className="absolute top-12 right-[18%] z-0 h-[180px] w-[2px] bg-black/40 blur-[2px]" />
        <span className="absolute top-[150px] right-[18%] z-10 h-5 w-5 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#67B2B7] to-[#3E64B4] shadow-[0_0_0_14px_rgba(104,179,183,0.35)]" />

        <svg
          viewBox="0 0 460 162"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="line-blue" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#68B1B8" />
              <stop offset="100%" stopColor="#385AB4" />
            </linearGradient>
            <linearGradient id="fill-green" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#68B1B8" stopOpacity="0" />
              <stop offset="55%" stopColor="#68B1B8" stopOpacity="0.1" />
              <stop offset="85%" stopColor="#68B1B8" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#68B1B8" stopOpacity="0.42" />
            </linearGradient>
            <filter id="line-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M-2,130 C30,128 50,120 80,126 C110,132 130,110 160,118 C190,126 220,70 255,60 C285,78 310,110 338,102 C362,96 382,110 410,126 C430,138 450,136 462,138 L462,162 L-2,162 Z"
            fill="url(#fill-green)"
            opacity="0.75"
          />
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
    </section>
  );
};

export default StatsCard;
