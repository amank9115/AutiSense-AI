-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'reviewed');

-- CreateTable
CREATE TABLE "ReportShare" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "doctorNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportShare_doctorId_idx" ON "ReportShare"("doctorId");

-- CreateIndex
CREATE INDEX "ReportShare_sharedById_idx" ON "ReportShare"("sharedById");

-- CreateIndex
CREATE INDEX "ReportShare_status_idx" ON "ReportShare"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReportShare_sessionId_doctorId_key" ON "ReportShare"("sessionId", "doctorId");

-- AddForeignKey
ALTER TABLE "ReportShare" ADD CONSTRAINT "ReportShare_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScreeningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportShare" ADD CONSTRAINT "ReportShare_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportShare" ADD CONSTRAINT "ReportShare_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
