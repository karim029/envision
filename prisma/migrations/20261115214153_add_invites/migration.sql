-- CreateTable
CREATE TABLE "Invite" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByTenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_tokenHash_key" ON "Invite"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_usedByTenantId_key" ON "Invite"("usedByTenantId");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_usedByTenantId_fkey" FOREIGN KEY ("usedByTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Row Level Security (hand-written; Prisma does not model RLS). Same reason as the init
-- migration: deny Supabase's REST API; Prisma connects as the owner and bypasses RLS.
ALTER TABLE "Invite" ENABLE ROW LEVEL SECURITY;
