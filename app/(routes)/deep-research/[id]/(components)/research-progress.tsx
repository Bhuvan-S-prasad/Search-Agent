"use client";

import {
    Atom,
    Search,
    FileText,
    CheckCircle2,
    Loader2,
    AlertCircle,
    BookOpen,
    Quote,
    Star,
    Clock,
} from "lucide-react";
import type {
    ActivityLogEntry,
    ReportPlan,
    ResearchStatus,
} from "@/inngest/deep-research/types";

interface ResearchProgressProps {
    activityLog: ActivityLogEntry[];
    status: ResearchStatus;
    reportPlan: ReportPlan | null;
}

const agentConfig: Record<string, { icon: typeof Atom; color: string; bg: string; border: string; label: string }> = {
    orchestrator: { icon: Atom, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/30", label: "Orchestrator" },
    "sub-agent": { icon: Search, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Research Agent" },
    "citation-agent": { icon: Quote, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Citation Agent" },
    "synthesis-agent": { icon: FileText, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/30", label: "Synthesis Agent" },
    "review-agent": { icon: Star, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/30", label: "Review Agent" },
    system: { icon: BookOpen, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30", label: "System" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    planning: { label: "Planning Report Structure", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    researching: { label: "Researching Sections", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    synthesizing: { label: "Synthesizing Report", color: "text-rose-500", bg: "bg-rose-500/10" },
    reviewing: { label: "Quality Review", color: "text-violet-500", bg: "bg-violet-500/10" },
    completed: { label: "Research Complete", color: "text-green-600", bg: "bg-green-500/10" },
    failed: { label: "Research Failed", color: "text-destructive", bg: "bg-destructive/10" },
};

function ResearchProgress({ activityLog, status, reportPlan }: ResearchProgressProps) {
    const currentStatus = statusConfig[status] || statusConfig.planning;
    const isActive = !["completed", "failed"].includes(status);

    return (
        <div className="mb-8 space-y-6">
            {/* Current Status Banner */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border border-border ${currentStatus.bg}`}>
                {isActive ? (
                    <div className="relative flex items-center justify-center w-8 h-8">
                        <span className={`absolute inset-0 rounded-full ${currentStatus.bg} animate-ping opacity-30`} />
                        <Loader2 className={`w-5 h-5 animate-spin ${currentStatus.color} relative z-10`} />
                    </div>
                ) : status === "completed" ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/15">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/15">
                        <AlertCircle className="w-5 h-5 text-destructive" />
                    </div>
                )}
                <div className="flex-1">
                    <p className={`text-sm font-semibold ${currentStatus.color}`}>
                        {currentStatus.label}
                    </p>
                    {reportPlan && isActive && status === "researching" && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Researching {reportPlan.sections.length} sections in parallel
                        </p>
                    )}
                </div>
                {isActive && (
                    <div className="flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ color: "var(--color-primary)" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ color: "var(--color-primary)", animationDelay: "0.2s" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ color: "var(--color-primary)", animationDelay: "0.4s" }} />
                    </div>
                )}
            </div>

            {/* Report Plan Preview */}
            {reportPlan && (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Report Structure
                            <span className="text-xs font-normal text-muted-foreground ml-auto">
                                {reportPlan.sections.length} sections
                            </span>
                        </h3>
                    </div>
                    <div className="p-3 grid gap-1.5">
                        {reportPlan.sections.map((section, i) => {
                            const sectionLogs = activityLog.filter(
                                log => log.section_id === section.id
                            );
                            const isCompleted = sectionLogs.some(
                                log => log.action === "section_research_completed"
                            );
                            const isFailed = sectionLogs.some(
                                log => log.action === "section_research_failed"
                            );
                            const isResearching = sectionLogs.some(
                                log => log.action === "section_research_started"
                            ) && !isCompleted && !isFailed;

                            return (
                                <div
                                    key={section.id}
                                    className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${
                                        isCompleted
                                            ? "bg-green-500/5"
                                            : isFailed
                                              ? "bg-destructive/5"
                                              : isResearching
                                                ? "bg-emerald-500/5"
                                                : "bg-muted/30"
                                    }`}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        ) : isFailed ? (
                                            <AlertCircle className="w-4 h-4 text-destructive" />
                                        ) : isResearching ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${
                                            isCompleted ? "text-foreground" : isResearching ? "text-foreground" : "text-foreground/70"
                                        }`}>
                                            {section.heading}
                                        </p>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground/60 font-mono shrink-0 tabular-nums">
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Activity Log Timeline */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Activity Log
                        <span className="text-xs font-normal text-muted-foreground ml-auto">
                            {activityLog.length} events
                        </span>
                    </h3>
                </div>

                <div className="p-4">
                    <div className="relative ml-3">
                        {/* Vertical timeline line */}
                        <div className="absolute left-0 top-2 bottom-2 w-px bg-border" />

                        <div className="space-y-1">
                            {activityLog.map((entry, i) => {
                                const config = agentConfig[entry.agent] || agentConfig.system;
                                const Icon = config.icon;
                                const isLatest = i === activityLog.length - 1 && isActive;

                                return (
                                    <div key={i} className="relative pl-7 group">
                                        {/* Timeline dot */}
                                        <div className={`absolute left-0 top-3 -translate-x-1/2 z-10 flex items-center justify-center ${
                                            isLatest ? "w-3.5 h-3.5" : "w-2.5 h-2.5"
                                        }`}>
                                            {isLatest ? (
                                                <>
                                                    <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                                                    <span className="relative w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-background" />
                                                </>
                                            ) : (
                                                <span className={`w-2 h-2 rounded-full ring-2 ring-background ${
                                                    entry.action.includes("completed") || entry.action.includes("created")
                                                        ? "bg-green-500"
                                                        : entry.action.includes("failed")
                                                          ? "bg-destructive"
                                                          : entry.action.includes("started")
                                                            ? "bg-blue-400"
                                                            : "bg-muted-foreground/40"
                                                }`} />
                                            )}
                                        </div>

                                        {/* Entry card */}
                                        <div className={`rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40 ${
                                            isLatest ? "bg-muted/30" : ""
                                        }`}>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${config.bg} ${config.color}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {config.label}
                                                </div>
                                                <span className="text-[11px] text-muted-foreground/60 font-mono tabular-nums">
                                                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                                </span>
                                            </div>
                                            <p className={`text-[13px] mt-1.5 leading-relaxed ${
                                                isLatest ? "text-foreground" : "text-foreground/70"
                                            }`}>
                                                {entry.detail}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Active processing indicator */}
                            {isActive && (
                                <div className="relative pl-7">
                                    <div className="absolute left-0 top-3 -translate-x-1/2 z-10">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                    </div>
                                    <div className="rounded-lg px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Awaiting next step</span>
                                            <span className="inline-flex gap-0.5">
                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResearchProgress;
