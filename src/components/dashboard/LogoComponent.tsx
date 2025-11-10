import React from 'react'

export const LogoComponent = () => {
  return (
    <div className="flex min-w-[100px] items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#69b4b7_0%,#3e64b4_100%)] text-base font-semibold text-white shadow-[0_14px_30px_rgba(62,100,180,0.35)]">
          OS
        </div>
        <div className="hidden lg:flex flex-col leading-tight">
          <span className="font-poppins text-lg font-semibold tracking-tight text-white">EmpaTech OS</span>
          <span className="text-xs text-white/60">Your daily control center</span>
        </div>
      </div>
  )
}
