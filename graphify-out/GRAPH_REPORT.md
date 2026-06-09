# Graph Report - D:\Projects\Autism_Screening_Platform  (2026-06-03)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 899 nodes · 1404 edges · 82 communities (58 shown, 24 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d63be1fa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 29 edges
2. `Navbar()` - 24 edges
3. `Footer()` - 23 edges
4. `compilerOptions` - 22 edges
5. `useAppStore` - 20 edges
6. `AppModule` - 20 edges
7. `Button()` - 19 edges
8. `Card()` - 19 edges
9. `AppConfigService` - 17 edges
10. `scripts` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Home Page Screenshot` --semantically_similar_to--> `The Gentle Navigator Design System`  [INFERRED] [semantically similar]
  docs/home_page/screen.png → docs/nurture_flow/DESIGN.md
- `AppModule` --references--> `Prisma ORM`  [INFERRED]
  backend/src/app.module.ts → .github/copilot-instructions.md
- `ParentDashboard()` --implements--> `The Gentle Navigator Design System`  [EXTRACTED]
  frontend/src/app/dashboard/parent/page.tsx → docs/nurture_flow/DESIGN.md
- `The Gentle Navigator` --semantically_similar_to--> `ManasSaathi`  [INFERRED] [semantically similar]
  docs/support/code.html → ml-service/README.md
- `AutiSense-AI Platform` --references--> `ML Service (FastAPI)`  [EXTRACTED]
  README.md → ml-service/app/main.py

## Import Cycles
- None detected.

## Communities (82 total, 24 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (24): Roles(), AIProcessingFailedException, AIServiceUnavailableException, ErrorCode, ErrorResponse, InvalidCredentialsException, TokenExpiredException, TokenInvalidException (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (33): _build_recommendations(), camera_to_aq10(), clamp(), decode_image(), extract_cv_adjustments(), FrameInput, generate_report(), get_session_data() (+25 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (5): ChatDto, IngestDto, RequestWithUser, CreateAnalysisDataDto, CreateScreeningSessionDto

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (37): dependencies, bcryptjs, bullmq, class-transformer, class-validator, cookie-parser, ioredis, joi (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (6): AppConfigService, IConfig, HttpLoggerMiddleware, LoggerModule, LoggerService, Main Entry Point

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (22): AnalyticsPage(), InsightMetric, ScreeningTrend, AppointmentsPage(), DoctorAppointmentsPage(), ArchivedRecord, ArchivePage(), mockArchives (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (19): SaveChildProfileResponse, ChildCaseRecord, EmergencyAlert, initialCases, ScreeningContextValue, ScreeningFeatureAverages, useScreening(), SessionRecord (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (10): features, steps, screeningSteps, Child, mockChildren, mockAppointments, Footer(), Navbar() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (28): devDependencies, eslint, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier, globals, @nestjs/cli (+20 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (14): lexend, metadata, plusJakartaSans, LandingPage(), useCountUp(), useFadeInOnScroll(), useHeroTimeline(), useMagneticHover() (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (23): dependencies, ai, @ai-sdk/react, framer-motion, gsap, lucide-react, next, react (+15 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (22): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+14 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.22
Nodes (9): StatCardProps, DoctorDashboard(), authApi, AuthResponse, AuthRole, Button(), ButtonProps, Card() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (16): heatmapValues, behaviorRadar, clinicianSessions, collaborationMessages, emotionTimeline, parentWeeklyReports, patientList, progressTimeline (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (12): useTheme(), LoginPage(), ResultsPage(), MODULES, ScreeningPage(), SignupPage(), AppState, MlResults (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (10): wait(), liveMetricSeed, CameraMlChildInfo, CameraMlResult, LiveCameraMlPayload, LiveCameraMlResult, runScreeningSession(), simulateBehaviorFrame() (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.20
Nodes (17): DataFrame, download_dataset(), engineer_features(), _generate_fallback_dataset(), main(), ndarray, object, str (+9 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (16): scripts, build, format, lint, prisma:migrate, prisma:seed, prisma:studio, start (+8 more)

### Community 19 - "Community 19"
Cohesion: 0.26
Nodes (14): _draw_metric_bar(), _draw_risk_gauge(), generate_pdf_report(), ManasSaathi — PDF Report Generator ==================================== Genera, Generates a PDF screening report and returns it as bytes.      session_data ke, Draws a labeled progress bar inside a ReportLab Drawing., Draws a semicircular risk gauge., _risk_color() (+6 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (9): CameraLiveMetrics, CameraPreviewProps, FaceBoundingBox, FaceDetectionResult, FaceDetectorCtor, FaceDetectorLike, pulse, ButtonProps (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (14): description, devDependencies, concurrently, name, private, scripts, build, dev (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.27
Nodes (4): AiModule, AppModule, MlModule, Prisma ORM

### Community 24 - "Community 24"
Cohesion: 0.19
Nodes (3): IngestionJobData, pdf, PdfParseResult

### Community 25 - "Community 25"
Cohesion: 0.21
Nodes (7): assistantApi, AssistantSearchResponse, fetchJson(), runCameraMlScreening(), runLiveCameraInference(), MlInferenceRequest, MlInferenceResponse

### Community 27 - "Community 27"
Cohesion: 0.35
Nodes (5): BehaviorAnalyzer, FaceState, Face + landmark + gaze/attention estimation using MediaPipe., float, int

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (7): analyze_frame(), analyze_single_frame(), process_video_file(), save_case(), upload_video(), object, str

### Community 31 - "Community 31"
Cohesion: 0.18
Nodes (6): compat, __dirname, __filename, __dirname, __filename, Path

### Community 32 - "Community 32"
Cohesion: 0.20
Nodes (6): clamp(), extractFrameSignals(), initialMetrics, metricTone, mediaConstraints, CameraMlFrame

### Community 33 - "Community 33"
Cohesion: 0.20
Nodes (10): AI Engine Requirements, ManasSaathi, ML Service README, ML Service Requirements, Parent Dashboard Desktop Screen, Support Page Code, Support Page Screen, The Gentle Navigator (+2 more)

### Community 34 - "Community 34"
Cohesion: 0.25
Nodes (4): Webcam frame reader for real-time inference., any, float, int

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (8): analyze_frame(), calculate_distance(), clamp(), Analyzes an OpenCV image using Google MediaPipe to extract behavioral features., Any, float, ndarray, str

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (9): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform (+1 more)

### Community 37 - "Community 37"
Cohesion: 0.22
Nodes (9): The Gentle Navigator Design System, Tactile Sanctuary, Dr. Julianne Smith, Leo Harrington, Home Page Screenshot, Patient Symptom Analysis Report HTML, Professional Connect HTML, Screening Results HTML (+1 more)

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (5): EmotionDetector, DeepFace wrapper with fallback if dependency/model is unavailable., float, object, str

### Community 39 - "Community 39"
Cohesion: 0.43
Nodes (7): compute_behavior_metrics(), _emotion_instability(), _risk_label(), float, int, object, str

### Community 40 - "Community 40"
Cohesion: 0.25
Nodes (8): devDependencies, eslint, @eslint/eslintrc, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, typescript

### Community 41 - "Community 41"
Cohesion: 0.29
Nodes (6): author, description, license, name, private, version

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (3): sections, storySteps, GlassCardProps

### Community 43 - "Community 43"
Cohesion: 0.29
Nodes (6): moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$

### Community 44 - "Community 44"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 50 - "Community 50"
Cohesion: 0.83
Nodes (3): buildSeededBaseline(), clamp(), hashSeed()

## Knowledge Gaps
- **311 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+306 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MlService` connect `Community 1` to `Community 0`, `Community 4`, `Community 30`, `Community 23`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `AppModule` connect `Community 23` to `Community 2`, `Community 4`, `Community 54`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `ForgotPasswordPage()` connect `Community 20` to `Community 13`, `Community 29`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `useAuth()` (e.g. with `AppointmentsPage()` and `DoctorAppointmentsPage()`) actually correct?**
  _`useAuth()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _334 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06892230576441102 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10336817653890824 - nodes in this community are weakly interconnected._