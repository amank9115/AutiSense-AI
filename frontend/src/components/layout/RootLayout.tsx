

import Footer from "./MainFooter"
import Navbar from "./Navbar"

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <Navbar />
      <main className="pt-24">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default RootLayout
