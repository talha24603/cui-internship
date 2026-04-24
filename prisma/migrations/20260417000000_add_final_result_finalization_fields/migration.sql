-- Add faculty finalization metadata to FinalResult
ALTER TABLE "FinalResult"
ADD COLUMN "isFinalizedByFaculty" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "finalizedAt" TIMESTAMP(3),
ADD COLUMN "finalizedById" TEXT;
