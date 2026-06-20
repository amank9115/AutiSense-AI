const BrandLogo = () => {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-sky-200/70 bg-white p-1 shadow-[0_8px_26px_rgba(14,165,233,0.28)] sm:h-14 sm:w-14">
        <img src="/illustrations/manassaathi-logo.png" alt="Manassaathi logo" className="h-full w-full rounded-xl object-cover" />
      </div>

      <div className="min-w-0 leading-tight">
        <p className="truncate text-[10px] tracking-[0.22em] text-sky-600 uppercase dark:text-sky-300">AI Platform</p>
        <p className="truncate bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 bg-clip-text text-[15px] font-bold text-transparent sm:text-lg">MANASSAATHI AI</p>
      </div>
    </div>
  )
}

export default BrandLogo
