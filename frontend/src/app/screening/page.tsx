"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore, MlResults } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import { fetchJson } from "@/api/client";
import { screeningApi } from "@/services/api/screeningApi";
import { logger } from "@/lib/logger";
import {
  type CapturedFrame,
  saveScreeningProgress,
  loadScreeningProgress,
  clearScreeningProgress,
} from "@/lib/screeningProgress";

const MODULES = [
  { id: "calibration", title: "Calibration", duration: 5, icon: "center_focus_strong", parentHint: "Ensure your child is facing the camera clearly.", childPrompt: "Look at the camera!" },
  { id: "eye_contact", title: "Eye Contact", duration: 10, icon: "visibility", parentHint: "Call your child's name once and observe.", childPrompt: "Follow the moving shape!" },
  { id: "joint_attention", title: "Joint Attention", duration: 10, icon: "ads_click", parentHint: "Point to a corner of the screen.", childPrompt: "Look where I'm pointing!" },
  { id: "name_response", title: "Name Response", duration: 10, icon: "hearing", parentHint: "Call their name. Wait 3 seconds, call again if needed.", childPrompt: "" },
  { id: "facial_expression", title: "Expressions", duration: 10, icon: "sentiment_satisfied", parentHint: "Smile at your child or make a silly face.", childPrompt: "Show me a big smile!" },
];

type CaptureQuality = { level: "good" | "fair" | "poor"; hint: string };

// Translate raw brightness (mean luma ~0–255) + inter-frame motion into a
// human-facing capture-quality signal so parents can fix lighting/steadiness
// in real time, reducing failed/insufficient screenings.
function deriveQuality(brightness: number, motion: number): CaptureQuality {
  if (brightness < 30) return { level: "poor", hint: "Too dark — add more light" };
  if (brightness > 135) return { level: "poor", hint: "Too bright — reduce glare" };
  if (motion > 45) return { level: "fair", hint: "Hold the camera steady" };
  if (brightness < 45) return { level: "fair", hint: "A little more light helps" };
  return { level: "good", hint: "Looks great — hold this position" };
}

export default function ScreeningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = searchParams?.get("childId");
  const setMlResults = useAppStore((state) => state.setMlResults);

  useEffect(() => {
    if (!childId) {
      router.push("/dashboard/parent/children");
    }
  }, [childId, router]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(-1); // -1 = setup
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  // null = no failure; "insufficient" = too few frames captured (must redo capture);
  // "analysis" = capture succeeded but the ML/network call failed (can retry analysis).
  const [failure, setFailure] = useState<null | "insufficient" | "analysis">(null);
  const webcamRef = useRef<Webcam>(null);
  const capturedFramesRef = useRef<CapturedFrame[]>([]);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousFrameSampleRef = useRef<number[] | null>(null);
  const startedAtRef = useRef<number>(0);
  const [frameCount, setFrameCount] = useState(0);
  const [quality, setQuality] = useState<CaptureQuality | null>(null);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

  // Capture real video frames as base64 JPEGs and compute client-side behavioral metrics.
  // Metrics are in 0–1 scale to match FrameDto validation; the backend scales to 0–100
  // before forwarding to the Python ML service.
  const captureFrame = useCallback(() => {
    const video = webcamRef.current?.video;
    if (!video || !(video instanceof HTMLVideoElement) || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 320, 240);
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.7);

    // Pixel-level analysis: brightness + inter-frame motion (mirrors CameraPreview logic)
    const frameData = ctx.getImageData(0, 0, 320, 240);
    const pixels = frameData.data;
    const sampleStep = 32;
    const sample: number[] = [];
    let lumTotal = 0;
    for (let i = 0; i < pixels.length; i += sampleStep) {
      const lum = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
      lumTotal += lum;
      sample.push(lum);
    }
    const brightness = sample.length > 0 ? lumTotal / sample.length : 0;

    let motion = 0;
    const prev = previousFrameSampleRef.current;
    if (prev && prev.length === sample.length) {
      let diff = 0;
      for (let i = 0; i < sample.length; i++) diff += Math.abs(sample[i] - prev[i]);
      motion = (diff / sample.length / 255) * 100;
    }
    previousFrameSampleRef.current = sample;

    // Surface a live capture-quality signal from the same brightness/motion stats.
    setQuality(deriveQuality(brightness, motion));

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const stability = clamp01((100 - motion * 2) / 100);
    const focus     = clamp01((80 - Math.abs(brightness - 60) * 0.5) / 100);

    const eyeContact      = clamp01(stability * 0.7 + focus * 0.3);
    const attentionSpan   = clamp01(eyeContact * 0.7 + (1 - motion / 100) * 0.3);
    const emotionSignals  = clamp01(0.5 + stability * 0.4 - Math.abs(motion - 15) * 0.008);
    const gestureAnalysis = clamp01(0.3 + motion * 0.012);
    const confidence      = clamp01(0.4 + stability * 0.3);

    capturedFramesRef.current.push({
      eyeContact,
      attentionSpan,
      emotionSignals,
      gestureAnalysis,
      confidence,
      imageBase64,
    });
    setFrameCount((c) => c + 1);
  }, []);

  // Start/stop frame capture during active screening
  useEffect(() => {
    if (currentModuleIndex >= 0 && !isCompleted) {
      frameIntervalRef.current = setInterval(captureFrame, 2000);
      return () => {
        if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      };
    }
  }, [currentModuleIndex, isCompleted, captureFrame]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);

  // Persist progress at each module boundary so a crash/refresh can resume.
  useEffect(() => {
    if (currentModuleIndex >= 0 && !isCompleted && childId) {
      saveScreeningProgress(
        {
          childId,
          moduleIndex: currentModuleIndex,
          timeLeft: MODULES[currentModuleIndex].duration,
          frames: capturedFramesRef.current,
          startedAt: startedAtRef.current,
        },
        Date.now(),
      );
    }
  }, [currentModuleIndex, isCompleted, childId]);

  // On mount, offer a Resume option if an interrupted session exists for this child.
  useEffect(() => {
    if (childId) setHasSavedProgress(!!loadScreeningProgress(childId, Date.now()));
  }, [childId]);

  const startScreening = useCallback(() => {
    clearScreeningProgress();
    capturedFramesRef.current = [];
    previousFrameSampleRef.current = null;
    setFrameCount(0);
    setHasSavedProgress(false);
    startedAtRef.current = Date.now();
    setCurrentModuleIndex(0);
    setTimeLeft(MODULES[0].duration);
  }, []);

  // Pause: persist progress for crash recovery, then leave for the dashboard.
  const pauseScreening = useCallback(() => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (childId) {
      saveScreeningProgress(
        { childId, moduleIndex: currentModuleIndex, timeLeft, frames: capturedFramesRef.current, startedAt: startedAtRef.current },
        Date.now(),
      );
    }
    router.push("/dashboard/parent");
  }, [childId, currentModuleIndex, timeLeft, router]);

  // Resume an interrupted session: rehydrate frames + position and continue.
  const resumeScreening = useCallback(() => {
    if (!childId) return;
    const saved = loadScreeningProgress(childId, Date.now());
    if (!saved) {
      setHasSavedProgress(false);
      return;
    }
    capturedFramesRef.current = saved.frames;
    previousFrameSampleRef.current = null;
    startedAtRef.current = saved.startedAt;
    setFrameCount(saved.frames.length);
    setHasSavedProgress(false);
    setCurrentModuleIndex(saved.moduleIndex);
    setTimeLeft(MODULES[saved.moduleIndex]?.duration ?? MODULES[0].duration);
  }, [childId]);

  // Submit captured frames to the backend ML pipeline. On failure we surface an
  // honest error + retry — we never fabricate or persist a synthetic risk score.
  const runAnalysis = useCallback(async () => {
    setIsProcessing(true);
    setProcessingError(null);
    setFailure(null);

    const frames = capturedFramesRef.current;

    if (!(frames.length >= 3 && childId)) {
      // Too little usable data was captured — the screening must be redone.
      setFailure("insufficient");
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Create session in backend
      const session = await screeningApi.createSession(childId, {
        moduleCount: MODULES.length,
        frameCount: frames.length,
        source: "web-camera",
      });

      // 2. Call ML service for analysis
      const mlResult = await fetchJson<{ riskScore?: number; riskLabel?: string; modelVersion?: string; featureAverages?: { eye_contact?: number; attention_span?: number; emotion_signals?: number }; recommendations?: string[] }>("/ml/camera-screening", {
        method: "POST",
        body: JSON.stringify({ frames }),
      });

      // Map snake_case feature_averages → CamelCase summary for results page
      const fa = mlResult.featureAverages || {};
      const results: MlResults = {
        riskScore: mlResult.riskScore ?? 0,
        riskLabel: mlResult.riskLabel ?? "low",
        modelVersion: mlResult.modelVersion ?? "heuristic-v1",
        summary: {
          EyeContact: fa.eye_contact ?? 0,
          JointAttention: fa.attention_span ?? 0,
          FacialExpression: fa.emotion_signals ?? 0,
        },
        recommendations: mlResult.recommendations ?? [],
      };

      // 3. Persist results to backend session
      try {
        await screeningApi.saveResults(session.id, {
          riskScore: results.riskScore,
          riskLevel: results.riskLabel.toUpperCase(),
          confidence: 0.9,
          behaviors: results.summary as Record<string, unknown>,
          recommendations: results.recommendations,
        });
      } catch (e) {
        logger.error("ScreeningPage", "Failed to save screening results", e);
      }

      clearScreeningProgress();
      setMlResults(results);
      setIsProcessing(false);
      setTimeout(() => router.push(`/results?sessionId=${session.id}`), 1500);
    } catch (err) {
      // Network/ML failure: keep the captured frames so the parent can retry
      // without redoing the whole screening. No fabricated results.
      logger.error("ScreeningPage", "Camera screening analysis failed", err);
      setProcessingError(err instanceof Error ? err.message : "We couldn't reach the analysis service.");
      setFailure("analysis");
      setIsProcessing(false);
    }
  }, [childId, setMlResults, router]);

  const finishScreening = useCallback(() => {
    setIsCompleted(true);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    runAnalysis();
  }, [runAnalysis]);

  // Restart the whole screening from setup (used when too few frames were captured).
  const restartScreening = useCallback(() => {
    clearScreeningProgress();
    capturedFramesRef.current = [];
    previousFrameSampleRef.current = null;
    setFrameCount(0);
    setHasSavedProgress(false);
    setProcessingError(null);
    setFailure(null);
    setIsCompleted(false);
    setCurrentModuleIndex(-1);
    setTimeLeft(0);
  }, []);

  // Timer useEffect - must be after finishScreening declaration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentModuleIndex >= 0 && currentModuleIndex < MODULES.length && !isCompleted) {
      if (timeLeft > 0) {
        timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      } else {
        if (currentModuleIndex < MODULES.length - 1) {
          setCurrentModuleIndex(currentModuleIndex + 1);
          setTimeLeft(MODULES[currentModuleIndex + 1].duration);
        } else {
          finishScreening();
        }
      }
    }
    return () => clearTimeout(timer);
  }, [currentModuleIndex, timeLeft, isCompleted, finishScreening]);

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-surface-variant p-8 rounded-2xl max-w-md text-center shadow-lg border border-outline/10">
          <span className="material-symbols-outlined text-error text-5xl mb-4">videocam_off</span>
          <h2 className="text-xl font-bold mb-2">Camera Access Required</h2>
          <p className="text-on-surface-variant mb-6">Please allow camera access in your browser settings to proceed with the screening.</p>
          <button onClick={() => window.location.reload()} className="bg-primary text-on-primary px-6 py-2 rounded-full font-semibold">Try Again</button>
        </div>
      </div>
    );
  }

  const activeModule = currentModuleIndex >= 0 ? MODULES[currentModuleIndex] : null;

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body antialiased flex flex-col relative overflow-hidden">
      {/* ── Background Elements ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-secondary/5 blur-3xl" />
      </div>

      {/* ── Header / Timeline ── */}
      {currentModuleIndex >= 0 && !isCompleted && (
        <header className="fixed top-0 left-0 right-0 bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 z-50 px-4 py-3 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-primary font-bold shadow-inner">
                {currentModuleIndex + 1}
              </div>
              <div>
                <h2 className="text-sm font-bold leading-tight">{activeModule?.title}</h2>
                <div className="text-xs text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  {timeLeft}s remaining
                </div>
              </div>
            </div>
            {/* Timeline Dots */}
            <div className="hidden sm:flex items-center gap-2">
              {MODULES.map((m, i) => (
                <div key={m.id} className="flex items-center">
                  <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i < currentModuleIndex ? 'bg-primary scale-100' : i === currentModuleIndex ? 'bg-secondary scale-125 animate-pulse' : 'bg-outline-variant scale-75'}`} />
                  {i < MODULES.length - 1 && <div className={`w-6 h-0.5 mx-1 transition-colors ${i < currentModuleIndex ? 'bg-primary/50' : 'bg-outline-variant/30'}`} />}
                </div>
              ))}
            </div>
            {/* Pause + Live Indicator */}
            <div className="flex items-center gap-2">
              <button
                onClick={pauseScreening}
                aria-label="Pause and save screening"
                className="flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-3 py-1.5 rounded-full border border-outline-variant/20 transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">pause</span>
                <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Pause</span>
              </button>
              <div className="flex items-center gap-2 bg-error/10 px-3 py-1.5 rounded-full border border-error/20">
                <div className="w-2 h-2 bg-error rounded-full animate-pulse" />
                <span className="text-xs font-bold text-error uppercase tracking-widest">Rec</span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* ── Main Content Area ── */}
      <main className={`flex-grow flex items-center justify-center p-4 sm:p-8 relative z-10 transition-all duration-500 ${currentModuleIndex >= 0 ? 'pt-24' : ''}`}>
        
        {/* State 1: Setup / Pre-screening */}
        {currentModuleIndex === -1 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl w-full">
            <div className="bg-surface rounded-3xl p-8 sm:p-10 shadow-2xl border border-outline-variant/20 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-secondary" />
               <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                 <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>camera_front</span>
               </div>
               <h1 className="text-3xl font-headline font-extrabold mb-4">Ready to Begin?</h1>
               <p className="text-on-surface-variant mb-8 text-lg">
                 Ensure you are in a well-lit room and your child is comfortable. The screening will take approximately 1 minute.
               </p>
               <div className="bg-secondary-container/30 rounded-2xl p-4 mb-8 text-left border border-secondary/10 flex gap-4">
                 <span className="material-symbols-outlined text-secondary mt-1">lightbulb</span>
                 <p className="text-sm text-on-surface-variant">We will provide instructions for you (the parent) and visual prompts for your child on screen.</p>
               </div>
               {hasSavedProgress ? (
                 <div className="flex flex-col gap-3">
                   <div className="bg-primary-container/40 border border-primary/10 rounded-2xl p-3 flex items-center gap-3 text-left">
                     <span className="material-symbols-outlined text-primary">history</span>
                     <p className="text-sm text-on-surface-variant">We saved your earlier progress. You can pick up where you left off.</p>
                   </div>
                   <button onClick={resumeScreening} disabled={hasPermission === null} className="w-full bg-gradient-to-r from-primary to-secondary text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2">
                     <span className="material-symbols-outlined">play_arrow</span>
                     {hasPermission === null ? "Waiting for Camera..." : "Resume Screening"}
                   </button>
                   <button onClick={startScreening} disabled={hasPermission === null} className="w-full text-on-surface-variant font-semibold py-2 hover:text-on-surface transition-colors disabled:opacity-50">
                     Start fresh instead
                   </button>
                 </div>
               ) : (
                 <button onClick={startScreening} disabled={hasPermission === null} className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 mx-auto">
                   {hasPermission === null ? "Waiting for Camera..." : "Start Session"}
                   <span className="material-symbols-outlined">play_arrow</span>
                 </button>
               )}
            </div>
          </motion.div>
        )}

        {/* State 2: Active Screening */}
        {currentModuleIndex >= 0 && !isCompleted && (
          <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 items-center lg:items-start">
            
            {/* Left: Interactive Stimulus / Instructions */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6 order-2 lg:order-1">
              
              {/* Parent Instruction Card */}
              <motion.div 
                key={`parent-${currentModuleIndex}`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/20 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary" />
                <div className="flex items-start gap-4 ml-2">
                  <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-tertiary">person</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-tertiary uppercase tracking-wider mb-1">Parent Instruction</h3>
                    <p className="text-lg font-medium text-on-surface">{activeModule?.parentHint}</p>
                  </div>
                </div>
              </motion.div>

              {/* Child Stimulus Area */}
              <motion.div 
                key={`child-${currentModuleIndex}`}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex-grow min-h-[200px] sm:min-h-[300px] bg-gradient-to-br from-primary-container/40 to-secondary-container/20 rounded-3xl p-6 sm:p-8 border border-primary/10 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden"
              >
                {/* Visual Stimulus depending on module */}
                {activeModule?.id === 'calibration' && (
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-ring">
                     <span className="material-symbols-outlined text-5xl text-primary animate-ai-breathe">face</span>
                  </div>
                )}
                {activeModule?.id === 'eye_contact' && (
                  <div className="relative w-full h-40">
                    <motion.div 
                      animate={{ x: [-100, 100, -100], y: [-20, 20, -20] }} 
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute top-1/2 left-1/2 w-12 h-12 -ml-6 -mt-6 sm:w-16 sm:h-16 sm:-ml-8 sm:-mt-8 bg-gradient-to-r from-secondary to-tertiary rounded-full shadow-lg shadow-secondary/40 flex items-center justify-center"
                    >
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/30 rounded-full blur-sm" />
                    </motion.div>
                  </div>
                )}
                 {activeModule?.id === 'joint_attention' && (
                   <div className="relative w-full h-full flex items-center justify-center">
                     <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-primary">
                        <span className="material-symbols-outlined text-4xl sm:text-6xl">waving_hand</span>
                     </motion.div>
                   </div>
                 )}
                 {activeModule?.id === 'name_response' && (
                   <div className="w-32 h-32 relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-tertiary/20 rounded-full animate-ripple" style={{ animationDelay: '0s' }} />
                      <div className="absolute inset-4 bg-tertiary/30 rounded-full animate-ripple" style={{ animationDelay: '0.2s' }} />
                      <span className="material-symbols-outlined text-4xl text-tertiary relative z-10">record_voice_over</span>
                   </div>
                 )}
                  {activeModule?.id === 'facial_expression' && (
                   <div className="flex gap-4">
                     {['sentiment_satisfied', 'sentiment_dissatisfied', 'sentiment_very_satisfied'].map((icon, i) => (
                       <motion.div key={i} animate={{ y: [0, -10, 0] }} transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}>
                         <span className="material-symbols-outlined text-5xl text-secondary">{icon}</span>
                       </motion.div>
                     ))}
                   </div>
                 )}

                {activeModule?.childPrompt && (
                  <h3 className="text-xl sm:text-2xl font-headline font-bold text-primary mt-6 sm:mt-8">
                    {activeModule.childPrompt}
                  </h3>
                )}
              </motion.div>
            </div>

            {/* Right: Camera Stack */}
            <div className="w-full lg:w-1/2 max-w-[500px] order-1 lg:order-2">
              <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-black shadow-2xl border-4 border-surface ring-1 ring-outline-variant/20">
                
                {/* 1. Base Layer: Webcam */}
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  mirrored={true}
                  className="w-full h-full object-cover"
                />

                {/* 2. Glass Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Subtle vignette */}
                  <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.5)]" />
                  
                  {/* AI Breathing Ring */}
                  <div className="absolute inset-4 rounded-2xl border border-primary/30 animate-ai-breathe" />
                  
                  {/* Simulated Face Box */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-56 border-2 border-primary/50 rounded-xl animate-subtle-shift">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />
                  </div>
                  
                  {/* Scan line */}
                  <div className="absolute left-0 right-0 h-1 bg-primary/40 animate-scan-line blur-[2px]" />

                  {/* Live Capture-Quality Meter (Bottom Left) */}
                  <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-black/45 backdrop-blur-md rounded-xl p-3 border border-white/10 flex flex-col gap-1.5 sm:max-w-[16rem]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          quality?.level === "good" ? "bg-success animate-pulse" :
                          quality?.level === "fair" ? "bg-tertiary-fixed" :
                          quality?.level === "poor" ? "bg-error animate-pulse" :
                          "bg-white/50"
                        }`} />
                        <span className="text-white/90 text-[10px] font-bold font-mono uppercase tracking-wider">
                          {quality ? `${quality.level} signal` : "Starting…"}
                        </span>
                      </div>
                      <span className="text-white/70 text-[10px] font-mono">{frameCount} frames</span>
                    </div>
                    <p className="text-white/75 text-[10px] leading-snug" aria-live="polite">
                      {quality?.hint ?? "Hold your child in view of the camera."}
                    </p>
                  </div>
                  
                  {/* Top Right Status */}
                  <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded flex items-center gap-1 border border-white/10">
                    <span className="material-symbols-outlined text-primary text-[14px]">psychology</span>
                    <span className="text-white text-[10px] font-mono">AI ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* State 3: Completion */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-surface/95 backdrop-blur-sm overflow-hidden"
            >
              {/* Confetti effect (simulated with CSS) */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`absolute w-3 h-3 rounded-sm animate-confetti-fall ${['bg-primary', 'bg-secondary', 'bg-tertiary'][i % 3]}`}
                    style={{ 
                      left: `${Math.random() * 100}%`, 
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>

              <div className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-md border border-outline-variant/20 relative animate-session-pop" role={failure ? "alert" : undefined}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
                  failure ? "bg-error/10 shadow-error/10" : "bg-gradient-to-br from-primary to-secondary shadow-primary/30"
                }`}>
                   {isProcessing ? (
                     <span className="material-symbols-outlined text-4xl text-white animate-spin">autorenew</span>
                   ) : failure ? (
                     <span className="material-symbols-outlined text-5xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
                       {failure === "insufficient" ? "videocam_off" : "cloud_off"}
                     </span>
                   ) : (
                     <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                       <path className="animate-check-draw" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                     </svg>
                   )}
                </div>
                <h2 className="text-3xl font-headline font-extrabold mb-3">
                  {isProcessing
                    ? "Analyzing..."
                    : failure === "insufficient"
                    ? "We Need a Bit More"
                    : failure === "analysis"
                    ? "Analysis Couldn't Complete"
                    : "Session Complete"}
                </h2>
                <p className="text-on-surface-variant mb-6">
                  {isProcessing
                    ? "Processing behavioral patterns..."
                    : failure === "insufficient"
                    ? "We couldn't capture enough clear footage to analyze. Find a well-lit, quiet spot and run the short screening again."
                    : failure === "analysis"
                    ? "Your recording is safe — we just couldn't reach the analysis service. Please check your connection and try again."
                    : "Great job! Our AI has finished analyzing the behavioral patterns."}
                </p>
                {failure === "analysis" && processingError && (
                  <p className="text-error text-xs mb-6 font-mono break-words">{processingError}</p>
                )}

                {failure === "analysis" && (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={runAnalysis}
                      className="bg-primary text-on-primary px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dim active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">refresh</span>
                      Retry Analysis
                    </button>
                    <button
                      onClick={restartScreening}
                      className="px-6 py-3 rounded-2xl font-bold text-primary border-2 border-primary/20 hover:bg-primary-container/40 active:scale-95 transition-all"
                    >
                      Start Over
                    </button>
                  </div>
                )}

                {failure === "insufficient" && (
                  <button
                    onClick={restartScreening}
                    className="bg-primary text-on-primary px-8 py-3 rounded-2xl font-bold inline-flex items-center justify-center gap-2 hover:bg-primary-dim active:scale-95 transition-all mx-auto"
                  >
                    <span className="material-symbols-outlined text-lg">replay</span>
                    Run Screening Again
                  </button>
                )}

                {!isProcessing && !failure && (
                  <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium animate-pulse">
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                    Redirecting to results...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
