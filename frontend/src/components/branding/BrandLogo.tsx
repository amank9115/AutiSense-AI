import Image from "next/image";

const BrandLogo = () => {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
        <Image src="/illustrations/manassaathi-logo.png" alt="Manassaathi logo" className="h-full w-full object-contain" width={64} height={64} />
      </div>

      <div className="min-w-0 leading-tight">
        <p className="truncate text-[10px] tracking-[0.22em] text-primary uppercase">AI Platform</p>
        <p className="truncate bg-gradient-to-r from-primary via-primary-accent to-secondary bg-clip-text text-[15px] font-bold text-transparent sm:text-lg">MANASSAATHI AI</p>
      </div>
    </div>
  )
}

export default BrandLogo
