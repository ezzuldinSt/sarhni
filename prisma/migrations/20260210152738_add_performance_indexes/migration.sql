-- DropIndex
DROP INDEX "Confession_receiverId_isPinned_createdAt_idx";

-- DropIndex
DROP INDEX "Confession_senderId_createdAt_idx";

-- CreateIndex
CREATE INDEX "Confession_receiverId_createdAt_idx" ON "Confession"("receiverId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Confession_senderId_createdAt_idx" ON "Confession"("senderId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Confession_receiverId_isPinned_createdAt_idx" ON "Confession"("receiverId", "isPinned", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Confession_receiverId_reply_idx" ON "Confession"("receiverId", "reply");

-- CreateIndex
CREATE INDEX "Confession_createdAt_idx" ON "Confession"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "User_role_isBanned_idx" ON "User"("role", "isBanned");
