"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

import ResearchProgress from "./(components)/research-progress";
import ResearchReport from "./(components)/research-report";
import { UserButton } from "@clerk/nextjs";
import { Atom, ShareIcon, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type {
    DeepResearchSession,
    ActivityLogEntry,
} from "@/inngest/deep-research/types";

function DeepResearchPage() {
    const { id } = useParams();
    const router = useRouter();
    const [session, setSession] = useState<DeepResearchSession | null>(null);
    const [loading, setLoading] = useState(true);

    // Plain function for polling (not wrapped in useCallback)
    // Secure fetch function using API
    const fetchSession = async () => {
        if (!id) return;
  
        try {
            const response = await axios.post("/api/deep-research/status", {
                sessionId: id
            });
            
            if (response.data.session) {
                setSession(response.data.session as unknown as DeepResearchSession);
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching session:", error);
            setLoading(false);
        }
    };


    // Initial fetch — inline to avoid synchronous setState warning
    // Initial fetch
    useEffect(() => {
        if (!id) return;
        fetchSession();
    }, [id]);


    // Note: Realtime subscription disabled for security (Clerk/Supabase RLS mismatch).
    // Secure polling is used as the primary update mechanism.


    // Fallback polling for environments where realtime might not work
    useEffect(() => {
        if (!session || session.status === "completed" || session.status === "failed") return;

        const interval = setInterval(fetchSession, 3000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.status, id]);

    const isInProgress = session && !["completed", "failed"].includes(session.status);
    const isCompleted = session?.status === "completed";
    const isFailed = session?.status === "failed";

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pl-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        <Atom className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading research session...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center pl-20">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
                    <p className="text-muted-foreground mb-4">This research session does not exist or has been removed.</p>
                    <Button onClick={() => router.push("/")} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Fixed Header */}
            <div className="fixed top-0 left-20 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
                <div className="flex items-center justify-between px-8 py-3">
                    <div className="flex gap-3 items-center">
                        <UserButton />
                        <div className="flex items-center gap-2 text-primary">
                            <Atom className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Deep Research</span>
                        </div>
                    </div>

                    <div className="flex-1 flex justify-center max-w-2xl mx-4">
                        <h2 className="line-clamp-1 text-sm font-medium text-foreground/80">
                            {session.query}
                        </h2>
                    </div>

                    <div className="flex gap-3 items-center">
                        {isCompleted && (
                            <Button variant="outline" size="sm" onClick={() => {
                                navigator.clipboard.writeText(session.final_report);
                            }}>
                                <ShareIcon className="h-4 w-4 mr-2" />
                                Copy Report
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-16 pl-20">
                <div className="max-w-4xl mx-auto px-6 md:px-10 py-8">
                    {/* Query Title */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-primary mb-3">
                            <Atom className="w-5 h-5" />
                            <span className="text-sm font-medium uppercase tracking-wider">Deep Research</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                            {session.query}
                        </h1>
                        {session.report_plan && (
                            <p className="mt-2 text-muted-foreground text-sm">
                                {(session.report_plan as unknown as { title: string })?.title}
                            </p>
                        )}
                    </div>

                    {/* Progress Timeline — shown during research or always if not completed */}
                    {(isInProgress || isFailed) && (
                        <ResearchProgress
                            activityLog={session.activity_log}
                            status={session.status}
                            reportPlan={session.report_plan}
                        />
                    )}

                    {/* Final Report — shown when completed */}
                    {isCompleted && session.final_report && (
                        <>
                            {/* Collapsible progress summary */}
                            <details className="mb-6 group">
                                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4 transition-transform duration-200 group-open:rotate-90" />
                                    <span>View research progress ({session.activity_log?.length || 0} steps)</span>
                                </summary>
                                <div className="mt-4">
                                    <ResearchProgress
                                        activityLog={session.activity_log}
                                        status={session.status}
                                        reportPlan={session.report_plan}
                                    />
                                </div>
                            </details>

                            <ResearchReport
                                report={session.final_report}
                                citations={session.citations}
                            />
                        </>
                    )}

                    {/* Failed State */}
                    {isFailed && (
                        <div className="mt-8 p-6 border border-destructive/30 rounded-xl bg-destructive/5">
                            <h3 className="font-semibold text-destructive mb-2">Research Failed</h3>
                            <p className="text-sm text-muted-foreground">
                                An error occurred during the research process. Please try again with a different query.
                            </p>
                            <Button onClick={() => router.push("/")} variant="outline" className="mt-4">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DeepResearchPage;
