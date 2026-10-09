-- CreateEnum
CREATE TYPE "MentorApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MENTOR';

-- CreateTable
CREATE TABLE "MentorApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MentorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MentorApplication_userId_idx" ON "MentorApplication"("userId");

-- CreateIndex
CREATE INDEX "MentorApplication_status_idx" ON "MentorApplication"("status");

-- AddForeignKey
ALTER TABLE "MentorApplication" ADD CONSTRAINT "MentorApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
