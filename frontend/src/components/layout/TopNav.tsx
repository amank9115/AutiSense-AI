import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Platform", to: "/" },
  { label: "Live Screening", to: "/live-screening" },
  { label: "Parent Dashboard", to: "/parent" },
  { label: "Doctor Dashboard", to: "/doctor" },
  { label: "Video Analysis", to: "/video-analysis" },
  { label: "Collaboration", to: "/collaboration" },
]

const TopNav = () => {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-semibold tracking-[0.16em] text-cyan-100 uppercase">
          Neurolytix AI
        </Link>
        <nav className="hidden gap-5 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.to;
            return (
            <Link
              key={item.to}
              href={item.to}
              className={`text-sm transition-colors ${isActive ? "text-cyan-300" : "text-slate-300 hover:text-cyan-100"}`}
            >
              {item.label}
            </Link>
          )})}
        </nav>
      </div>
    </header>
  )
}

export default TopNav
