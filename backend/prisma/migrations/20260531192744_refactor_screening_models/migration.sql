/*
  Warnings:

  - You are about to drop the column `age` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the column `lastSession` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the column `riskLevel` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the column `metrics` on the `ScreeningSession` table. All the data in the column will be lost.
  - You are about to drop the column `modelVersion` on the `ScreeningSession` table. All the data in the column will be lost.
  - You are about to drop the column `recommendations` on the `ScreeningSession` table. All the data in the column will be lost.
  - You are about to drop the column `riskLabel` on the `ScreeningSession` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `ScreeningSession` table. All the data in the column will be lost.
  - Added the required column `dateOfBirth` to the `Child` table without a default value. This is not possible if the table is not empty.
  - Made the column `parentId` on table `Child` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `childId` to the `ScreeningSession` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `ScreeningSession` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ScreeningStatus" AS ENUM ('pending', 'in_progress', 'completed', 'archived', 'failed');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high', 'very_high');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('pdf', 'csv', 'json');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'clinician';

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Child" DROP CONSTRAINT "Child_parentId_fkey";

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "Child" DROP COLUMN "age",
DROP COLUMN "lastSession",
DROP COLUMN "riskLevel",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "medicalNotes" TEXT,
ALTER COLUMN "parentId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ScreeningSession" DROP COLUMN "metrics",
DROP COLUMN "modelVersion",
DROP COLUMN "recommendations",
DROP COLUMN "riskLabel",
DROP COLUMN "source",
ADD COLUMN     "childId" TEXT NOT NULL,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "frameCount" INTEGER,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "riskLevel" "RiskLevel",
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ScreeningStatus" NOT NULL DEFAULT 'pending',
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "riskScore" DROP NOT NULL,
ALTER COLUMN "summary" DROP NOT NULL,
ALTER COLUMN "summary" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetPasswordExpiresAt" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;

-- CreateTable
CREATE TABLE "ScreeningResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "behaviors" JSONB NOT NULL,
    "emotionalPatterns" JSONB,
    "summary" TEXT,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScreeningResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisData" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "frameCount" INTEGER NOT NULL,
    "averageConfidence" DOUBLE PRECISION,
    "behaviors" JSONB NOT NULL,
    "emotions" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "format" "ReportFormat" NOT NULL DEFAULT 'pdf',
    "filePath" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScreeningResult_sessionId_key" ON "ScreeningResult"("sessionId");

-- CreateIndex
CREATE INDEX "ScreeningResult_sessionId_idx" ON "ScreeningResult"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisData_sessionId_key" ON "AnalysisData"("sessionId");

-- CreateIndex
CREATE INDEX "AnalysisData_sessionId_idx" ON "AnalysisData"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_sessionId_key" ON "Report"("sessionId");

-- CreateIndex
CREATE INDEX "Report_sessionId_idx" ON "Report"("sessionId");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- CreateIndex
CREATE INDEX "ChatSession_userId_idx" ON "ChatSession"("userId");

-- CreateIndex
CREATE INDEX "Child_parentId_idx" ON "Child"("parentId");

-- CreateIndex
CREATE INDEX "ScreeningSession_userId_idx" ON "ScreeningSession"("userId");

-- CreateIndex
CREATE INDEX "ScreeningSession_childId_idx" ON "ScreeningSession"("childId");

-- CreateIndex
CREATE INDEX "ScreeningSession_status_idx" ON "ScreeningSession"("status");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningSession" ADD CONSTRAINT "ScreeningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningSession" ADD CONSTRAINT "ScreeningSession_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningResult" ADD CONSTRAINT "ScreeningResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScreeningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisData" ADD CONSTRAINT "AnalysisData_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScreeningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScreeningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
