-- CreateEnum
CREATE TYPE "InternshipApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Normalize legacy free-form status strings before casting
UPDATE "InternshipApproval"
SET "status" = CASE
  WHEN LOWER(TRIM("status")) = 'pending' THEN 'PENDING'
  WHEN LOWER(TRIM("status")) = 'approved' THEN 'APPROVED'
  WHEN LOWER(TRIM("status")) = 'rejected' THEN 'REJECTED'
  WHEN TRIM("status") = 'PENDING' THEN 'PENDING'
  WHEN TRIM("status") = 'APPROVED' THEN 'APPROVED'
  WHEN TRIM("status") = 'REJECTED' THEN 'REJECTED'
  ELSE 'PENDING'
END;

-- AlterTable
ALTER TABLE "InternshipApproval" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "InternshipApproval" ALTER COLUMN "status" TYPE "InternshipApprovalStatus" USING "status"::"InternshipApprovalStatus";
ALTER TABLE "InternshipApproval" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"InternshipApprovalStatus";
