import CameraAnalysisPanel from "../components/camera/CameraAnalysisPanel"
import Container from "../components/common/Container"

const AnalysisLabPage = () => {
  return (
    <div className="pb-20">
      <Container>
        <section className="rounded-[2rem] border border-white/20 bg-slate-950/70 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">AI Camera Lab</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Live WebRTC behavior analysis module</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">
            This frontend module captures camera input using WebRTC, renders a live preview, and simulates real-time behavioral metrics for ML API integration.
          </p>
        </section>
        <section className="mt-7">
          <CameraAnalysisPanel />
        </section>
      </Container>
    </div>
  )
}

export default AnalysisLabPage

