"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ConfirmDialogProvider, useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { updateReportStatus } from "@/lib/actions/report";
import { toastSuccess, toastError } from "@/lib/toast";
import { AlertTriangle, CheckCircle, XCircle, User, MessageCircle, Flag, Eye, ExternalLink, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_BADGES = {
  PENDING: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30", label: "Pending Review" },
  REVIEWED: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30", label: "Reviewed" },
  DISMISSED: { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30", label: "Dismissed" },
};

const REASON_ICONS = {
  SPAM: "📧",
  HARASSMENT: "⚠️",
  HATE_SPEECH: "🚫",
  INAPPROPRIATE_CONTENT: "🔞",
  OTHER: "📝",
};

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: "PENDING" | "REVIEWED" | "DISMISSED";
  createdAt: Date | string;
  reporter: { username: string };
  reviewer: { username: string } | null;
  confession: {
    id: string;
    content: string;
    reply: string | null;
    isAnonymous: boolean;
    sender: { username: string } | null;
    receiver: { username: string };
  };
}

function ReportsDashboardContent({ initialReports, viewerRole }: { initialReports: Report[], viewerRole: string }) {
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "REVIEWED" | "DISMISSED">("ALL");
  const [reasonFilter, setReasonFilter] = useState<"ALL" | Report["reason"]>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const { confirm } = useConfirmDialog();

  // Apply multiple filters
  const filteredReports = reports.filter(r => {
    const matchesStatus = filter === "ALL" || r.status === filter;
    const matchesReason = reasonFilter === "ALL" || r.reason === reasonFilter;
    const matchesSearch = searchQuery === "" ||
      r.reporter.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.confession.receiver.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.confession.content?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesStatus && matchesReason && matchesSearch;
  });

  const pendingCount = reports.filter(r => r.status === "PENDING").length;

  const handleStatusUpdate = async (reportId: string, newStatus: "REVIEWED" | "DISMISSED") => {
    const confirmed = await confirm({
      title: newStatus === "REVIEWED" ? "Confirm Violation" : "Dismiss Report",
      message: newStatus === "REVIEWED"
        ? "Mark this report as reviewed? The content may need further action."
        : "Dismiss this report as invalid?",
      confirmText: newStatus === "REVIEWED" ? "Confirm" : "Dismiss",
      cancelText: "Cancel",
      variant: newStatus === "REVIEWED" ? "warning" : "info"
    });

    if (!confirmed) return;

    const res = await updateReportStatus(reportId, newStatus);
    if (res?.error) return toastError(res.error);

    setReports(prev => prev.map(r =>
      r.id === reportId ? { ...r, status: newStatus, reviewedBy: { username: "You" } } : r
    ));
    toastSuccess(newStatus === "REVIEWED" ? "Report confirmed" : "Report dismissed");
  };

  const toggleExpand = (reportId: string) => {
    setExpandedReport(expandedReport === reportId ? null : reportId);
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className={`px-4 py-2 rounded-lg border ${pendingCount > 0 ? 'bg-danger/20 border-danger/30' : 'bg-leather-800 border-leather-700'}`}>
          <span className="text-sm font-bold text-leather-accent flex items-center gap-2">
            <AlertTriangle size={16} className={pendingCount > 0 ? "text-danger" : "text-leather-500"} />
            {pendingCount} Pending {pendingCount === 1 ? "Report" : "Reports"}
          </span>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "PENDING", "REVIEWED", "DISMISSED"] as const).map((status) => {
            const count = status === "ALL" ? reports.length : reports.filter(r => r.status === status).length;
            const isActive = filter === status;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-leather-pop text-leather-900"
                    : "bg-leather-800 text-leather-500 hover:text-leather-accent"
                }`}
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Reason Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-leather-500" />
          <input
            type="text"
            placeholder="Search by reporter, content, or receiver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-leather-800 border border-leather-700 rounded-lg text-leather-accent placeholder:text-leather-500 focus:outline-none focus:ring-2 focus:ring-leather-pop/50"
          />
        </div>

        {/* Reason Filter */}
        <select
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value as typeof reasonFilter)}
          className="px-4 py-2.5 bg-leather-800 border border-leather-700 rounded-lg text-leather-accent focus:outline-none focus:ring-2 focus:ring-leather-pop/50"
        >
          <option value="ALL">All Reasons</option>
          <option value="SPAM">📧 Spam</option>
          <option value="HARASSMENT">⚠️ Harassment</option>
          <option value="HATE_SPEECH">🚫 Hate Speech</option>
          <option value="INAPPROPRIATE_CONTENT">🔞 Inappropriate</option>
          <option value="OTHER">📝 Other</option>
        </select>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card className="p-8 text-center bg-leather-800/50 border-leather-700">
          <Flag className="w-12 h-12 text-leather-600 mx-auto mb-4" />
          <p className="text-leather-accent font-bold mb-2">No reports found</p>
          <p className="text-sm text-leather-500">
            {searchQuery || filter !== "ALL" || reasonFilter !== "ALL"
              ? "Try adjusting your search or filters."
              : "No reports have been submitted yet."}
          </p>
        </Card>
      ) : (
        <>
          <p className="text-sm text-leather-500">
            Showing {filteredReports.length} of {reports.length} reports
          </p>
          <div className="space-y-4">
          {filteredReports.map((report, index) => {
            const statusStyle = STATUS_BADGES[report.status as keyof typeof STATUS_BADGES];
            const isExpanded = expandedReport === report.id;

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`bg-leather-800/50 border-leather-700 overflow-hidden ${isExpanded ? 'ring-2 ring-leather-pop/50' : ''}`}>
                  {/* Header */}
                  <div className="p-4 cursor-pointer hover:bg-leather-700/30 transition-colors" onClick={() => toggleExpand(report.id)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Reason Icon */}
                        <div className="w-10 h-10 rounded-lg bg-leather-900 flex items-center justify-center text-xl flex-shrink-0">
                          {REASON_ICONS[report.reason as keyof typeof REASON_ICONS] || "📝"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-leather-accent">{report.reason.replace('_', ' ')}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                              {statusStyle.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-leather-500">
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              Reported by @{report.reporter.username}
                            </span>
                            <span>•</span>
                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                            {report.reviewer && (
                              <>
                                <span>•</span>
                                <span className="text-green-400">Reviewed by @{report.reviewer.username}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expand Button */}
                      <button
                        className="text-leather-500 hover:text-leather-accent transition-colors flex-shrink-0"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                        aria-expanded={isExpanded}
                      >
                        <Eye size={20} className={isExpanded ? "rotate-180 transition-transform" : "transition-transform"} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="border-t border-leather-700/50 bg-leather-900/30"
                    >
                      <div className="p-4 space-y-4">
                        {/* Reported Message */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-leather-500 uppercase tracking-wide">Reported Message</p>
                            <a
                              href={`/u/${report.confession.receiver.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-leather-pop hover:text-leather-popHover flex items-center gap-1 transition-colors"
                            >
                              <ExternalLink size={12} />
                              View on Profile
                            </a>
                          </div>
                          <div className="bg-leather-800/50 rounded-lg p-3 border border-leather-700">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-leather-pop flex items-center justify-center text-xs text-leather-900 font-bold">
                                {report.confession.isAnonymous ? "?" : report.confession.sender?.username?.[0].toUpperCase() || "?"}
                              </div>
                              <span className="text-sm text-leather-500">
                                {report.confession.isAnonymous ? "Anonymous" : "@" + report.confession.sender?.username}
                                {" → "}
                                @{report.confession.receiver.username}
                              </span>
                            </div>
                            <p className="text-leather-accent">"{report.confession.content}"</p>
                            {report.confession.reply && (
                              <div className="mt-2 pt-2 border-t border-leather-700/50">
                                <p className="text-xs text-leather-500 mb-1">Reply:</p>
                                <p className="text-sm text-leather-400">"{report.confession.reply}"</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Report Details */}
                        <div>
                          <p className="text-xs font-bold text-leather-500 uppercase tracking-wide mb-2">Report Details</p>
                          <div className="bg-leather-800/50 rounded-lg p-3 border border-leather-700 space-y-2">
                            <div>
                              <span className="text-xs text-leather-500">Reason:</span>
                              <span className="ml-2 text-sm text-leather-accent">{report.reason.replace('_', ' ')}</span>
                            </div>
                            {report.description && (
                              <div>
                                <span className="text-xs text-leather-500">Additional Details:</span>
                                <p className="mt-1 text-sm text-leather-accent italic">"{report.description}"</p>
                              </div>
                            )}
                            <div className="text-xs text-leather-500">
                              Reported on {new Date(report.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {report.status === "PENDING" && (
                          <div className="flex items-center gap-3 pt-2">
                            <button
                              onClick={() => handleStatusUpdate(report.id, "REVIEWED")}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm transition-colors"
                            >
                              <AlertTriangle size={16} />
                              Confirm Violation
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(report.id, "DISMISSED")}
                              className="flex items-center gap-2 px-4 py-2 bg-leather-700 hover:bg-leather-600 text-leather-accent rounded-lg font-bold text-sm transition-colors"
                            >
                              <XCircle size={16} />
                              Dismiss Report
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}

// Wrapper component that provides the ConfirmDialog context
// NOTE: Since ConfirmDialogProvider is now in root layout, this wrapper is redundant
// but kept for backwards compatibility
export default function ReportsDashboard({ initialReports, viewerRole }: { initialReports: Report[], viewerRole: string }) {
  return (
    <ReportsDashboardContent initialReports={initialReports} viewerRole={viewerRole} />
  );
}
