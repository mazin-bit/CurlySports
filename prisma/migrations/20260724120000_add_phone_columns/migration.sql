-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firebaseUid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_firebaseUid_key" ON "users"("firebaseUid");
