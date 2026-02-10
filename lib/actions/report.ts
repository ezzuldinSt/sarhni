"use server";

import { getCachedSession } from "@/lib/auth-cached";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ReportReason, ReportStatus } from "@prisma/client";

export async function createReport(confessionId: string, reason: string, description?: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user?.id) return { error: "You must be logged in to report content." };

    // Check if confession exists
    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
      select: { id: true }
    });

    if (!confession) {
      return { error: "Message not found." };
    }

    // Check if user already reported this confession
    // Only prevent duplicate PENDING reports - allow re-report if previous was DISMISSED
    const existingReport = await prisma.report.findFirst({
      where: {
        confessionId,
        reporterId: session.user.id
      }
    });

    if (existingReport && existingReport.status === "PENDING") {
      return { error: "You have already reported this message." };
    }
    // Allow new report if previous report was DISMISSED, REVIEWED, or had different status

    // Create the report
    await prisma.report.create({
      data: {
        confessionId,
        reporterId: session.user.id,
        reason: reason.toUpperCase() as ReportReason,
        description: description || null
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Create report error:", error);
    return { error: "Failed to create report. Please try again." };
  }
}

export async function getReports() {
  try {
    const session = await getCachedSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    // Check if user is admin or owner
    if (session.user.role === "USER") {
      return { error: "Forbidden: Admin access required" };
    }

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        confession: {
          include: {
            sender: { select: { username: true } },
            receiver: { select: { username: true } }
          }
        },
        reporter: { select: { username: true } },
        reviewer: { select: { username: true } }
      }
    });

    return reports;
  } catch (error) {
    console.error("Get reports error:", error);
    return { error: "Failed to fetch reports. Please try again." };
  }
}

export async function updateReportStatus(reportId: string, status: string) {
  try {
    const session = await getCachedSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    // Only admins and owners can update reports
    if (session.user.role === "USER") {
      return { error: "Forbidden: Admin access required" };
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { status: true }
    });

    if (!report) {
      return { error: "Report not found." };
    }

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: status.toUpperCase() as ReportStatus,
        reviewedBy: session.user.id,
        reviewedAt: new Date()
      }
    });

    revalidatePath("/admin/reports");

    return { success: true };
  } catch (error) {
    console.error("Update report status error:", error);
    return { error: "Failed to update report. Please try again." };
  }
}
