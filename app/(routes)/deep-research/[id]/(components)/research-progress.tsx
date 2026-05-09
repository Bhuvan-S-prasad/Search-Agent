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

const agentConfig: Record<string, { icon: typeof Atom; color: string; label: string }> = {
    orchestrator: { icon: Atom, color: "text-indigo-500", label: "Orchestrator" },
    "sub-agent": { icon: Search, color: "text-emerald-500", label: "Research Agent" },
    "citation-agent": { icon: Quote, color: "text-amber-500", label: "Citation Agent" },
    "synthesis-agent": { icon: FileText, color: "text-rose-500", label: "Synthesis Agent" },
    "review-agent": { icon: Star, color: "text-violet-500", label: "Review Agent" },
    system: { icon: BookOpen, color: "text-gray-500", label: "System" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
    planning: { label: "Planning Report Structure", color: "text-indigo-500" },
    researching: { label: "Researching Sections", color: "text-emerald-500" },
    synthesizing: { label: "Synthesizing Report", color: "text-rose-500" },
    reviewing: { label: "Quality Review", color: "text-violet-500" },
    completed: { label: "Research Complete", color: "text-green-600" },
    failed: { label: "Research Failed", color: "text-destructive" },
};

function ResearchProgress({ activityLog, status, reportPlan }: ResearchProgressProps) {
    const currentStatus = statusConfig[status] || statusConfig.planning;
    const isActive = !["completed", "failed"].includes(status);

    return (
        <div className="mb-8">
            {/* Current Status Banner */}
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-muted/50 border border-border">
                {isActive ? (
                    <div className="relative">
                        <Loader2 className={`w-5 h-5 animate-spin ${currentStatus.color}`} />
                    </div>
                ) : status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                    <AlertCircle className="w-5 h-5 text-destructive" />
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
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
                    </div>
                )}
            </div>

            {/* Report Plan Preview */}
            {reportPlan && (
                <div className="mb-6 p-4 rounded-xl border border-border bg-card">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Report Structure
                    </h3>
                    <div className="grid gap-2">
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
                                    className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30"
                                >
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        ) : isFailed ? (
                                            <AlertCircle className="w-4 h-4 text-destructive" />
                                        ) : isResearching ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {section.heading}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {section.search_queries.length} search queries
                                        </p>
                                    </div>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        §{i + 1}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Activity Log Timeline */}
            <div className="space-y-0">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Activity Log
                </h3>
                <div className="relative pl-6 border-l-2 border-border space-y-4">
                    {activityLog.map((entry, i) => {
                        const config = agentConfig[entry.agent] || agentConfig.system;
                        const Icon = config.icon;
                        const isLatest = i === activityLog.length - 1 && isActive;

                        return (
                            <div key={i} className="relative group">
                                {/* Timeline dot */}
                                <div className={`absolute -left-[25px] w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center ${
                                    isLatest
                                        ? "border-primary"
                                        : "border-muted-foreground/30"
                                }`}>
                                    {isLatest && (
                                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    )}
                                </div>

                                <div className="pb-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                                        <span className={`text-xs font-semibold ${config.color}`}>
                                            {config.label}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(entry.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground/80 ml-5">
                                        {entry.detail}
                                    </p>
                                </div>
                            </div>
                        );
                    })}

                    {/* Active indicator at the end */}
                    {isActive && (
                        <div className="relative">
                            <div className="absolute -left-[25px] w-4 h-4 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                                <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground italic">Processing...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ResearchProgress;
