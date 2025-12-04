-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BOOKER', 'SALES', 'ADMIN');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('BOOKED', 'COMPLETED', 'NO_SHOW', 'CANCELED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "StatusReason" AS ENUM ('MET_WITH_DECISION_MAKER', 'MET_WITH_STAKEHOLDER', 'PRODUCTIVE_MEETING', 'CLIENT_NO_SHOW', 'CLIENT_FORGOT', 'NOT_INTERESTED', 'WRONG_CONTACT', 'TIMING_NOT_RIGHT', 'BUDGET_CONSTRAINTS', 'RESCHEDULED_BY_CLIENT', 'RESCHEDULED_BY_US', 'TECHNICAL_ISSUE', 'CONFLICT_IN_CALENDAR', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "outlookEventId" TEXT,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "subject" TEXT,
    "organizerEmail" TEXT NOT NULL,
    "attendees" TEXT,
    "joinUrl" TEXT,
    "bodyPreview" TEXT,
    "bookerId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'BOOKED',
    "statusReason" "StatusReason",
    "qualityScore" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserToken_userId_idx" ON "UserToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_outlookEventId_key" ON "Meeting"("outlookEventId");

-- CreateIndex
CREATE INDEX "Meeting_bookerId_idx" ON "Meeting"("bookerId");

-- CreateIndex
CREATE INDEX "Meeting_ownerId_idx" ON "Meeting"("ownerId");

-- CreateIndex
CREATE INDEX "Meeting_status_idx" ON "Meeting"("status");

-- CreateIndex
CREATE INDEX "Meeting_startTime_idx" ON "Meeting"("startTime");

-- CreateIndex
CREATE INDEX "Meeting_bookingDate_idx" ON "Meeting"("bookingDate");

-- AddForeignKey
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_bookerId_fkey" FOREIGN KEY ("bookerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
