-- AlterTable
ALTER TABLE "users" ADD COLUMN "allowed_modules" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
