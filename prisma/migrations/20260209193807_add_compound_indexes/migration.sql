-- DropIndex
DROP INDEX "Confession_createdAt_idx";

-- DropIndex
DROP INDEX "Report_createdAt_idx";

-- CreateIndex
CREATE INDEX "Confession_senderId_createdAt_idx" ON "Confession"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_reporterId_status_idx" ON "Report"("reporterId", "status");

-- CreateIndex
CREATE INDEX "Report_confessionId_status_idx" ON "Report"("confessionId", "status");
