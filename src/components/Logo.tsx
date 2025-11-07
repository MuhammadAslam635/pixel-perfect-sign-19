const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-6 h-6 relative z-10"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.3" />
          <path d="M2 17L12 22L22 17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12L12 17L22 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="text-xl font-semibold text-primary">EmpaTech OS</span>
    </div>
  );
};

export default Logo;
