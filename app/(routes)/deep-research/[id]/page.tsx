"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";

import ResearchProgress from "./(components)/research-progress";
import ResearchReport from "./(components)/research-report";
import ResearchFollowupInput from "./(components)/research-followup-input";
import ResearchChatResponse from "./(components)/research-chat-response";
import { UserButton } from "@clerk/nextjs";
import { Atom, ShareIcon, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
    DeepResearchSession,
    ActivityLogEntry,
} from "@/inngest/deep-research/types";

// Types for follow-up items displayed below the main report
interface ChatFollowUp {
    id: string;
    query: string;
    response: string;
    isStreaming: boolean;
}

interface ResearchFollowUp {
    id: string;
    sessionId: string;
    query: string;
    session: DeepResearchSession | null;
}

type FollowUpItem =
    | { type: "chat"; data: ChatFollowUp }
    | { type: "research"; data: ResearchFollowUp };

function DeepResearchPage() {
    const { id } = useParams();
    const router = useRouter();
    const [session, setSession] = useState<DeepResearchSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [followUpItems, setFollowUpItems] = useState<FollowUpItem[]>([]);
    const [isProcessingFollowUp, setIsProcessingFollowUp] = useState(false);
    const followUpEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

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

    // Fetch a follow-up research session by its ID
    const fetchFollowUpSession = useCallback(async (sessionId: string) => {
        try {
            const response = await axios.post("/api/deep-research/status", {
                sessionId
            });
            if (response.data.session) {
                return response.data.session as unknown as DeepResearchSession;
            }
        } catch (error) {
            console.error("Error fetching follow-up session:", error);
        }
        return null;
    }, []);

    // Initial fetch
    useEffect(() => {
        if (!id) return;
        fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Polling for the main session while in progress
    useEffect(() => {
        if (!session || session.status === "completed" || session.status === "failed") return;

        const interval = setInterval(fetchSession, 3000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.status, id]);

    // Polling for follow-up research sessions that are still in progress
    useEffect(() => {
        const activeResearchFollowUps = followUpItems.filter(
            (item) =>
                item.type === "research" &&
                (item.data.session === null ||
                !["completed", "failed"].includes(item.data.session.status))
        );

        if (activeResearchFollowUps.length === 0) return;

        const interval = setInterval(async () => {
            for (const item of activeResearchFollowUps) {
                if (item.type !== "research") continue;
                const updatedSession = await fetchFollowUpSession(item.data.sessionId);
                if (updatedSession) {
                    setFollowUpItems((prev) =>
                        prev.map((fi) =>
                            fi.type === "research" && fi.data.sessionId === item.data.sessionId
                                ? { ...fi, data: { ...fi.data, session: updatedSession } }
                                : fi
                        )
                    );
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [followUpItems, fetchFollowUpSession]);

    // Scroll to bottom when new follow-up items are added
    useEffect(() => {
        if (followUpItems.length > 0) {
            setTimeout(() => {
                followUpEndRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 200);
        }
    }, [followUpItems.length]);

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Handle follow-up query submission
    const handleFollowUp = async (query: string) => {
        if (!id || isProcessingFollowUp) return;
        setIsProcessingFollowUp(true);

        try {
            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            const response = await fetch("/api/deep-research/followup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: id, query }),
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const contentType = response.headers.get("Content-Type") || "";

            if (contentType.includes("application/json")) {
                // Research intent — new session created
                const data = await response.json();
                if (data.type === "research" && data.sessionId) {
                    const newFollowUp: FollowUpItem = {
                        type: "research",
                        data: {
                            id: `research-${Date.now()}`,
                            sessionId: data.sessionId,
                            query,
                            session: null,
                        },
                    };
                    setFollowUpItems((prev) => [...prev, newFollowUp]);
                    toast.success("Started follow-up research session");

                    // Start polling for the new session immediately
                    const initialSession = await fetchFollowUpSession(data.sessionId);
                    if (initialSession) {
                        setFollowUpItems((prev) =>
                            prev.map((fi) =>
                                fi.type === "research" && fi.data.sessionId === data.sessionId
                                    ? { ...fi, data: { ...fi.data, session: initialSession } }
                                    : fi
                            )
                        );
                    }
                }
                setIsProcessingFollowUp(false);
            } else if (contentType.includes("text/event-stream")) {
                // Chat intent — stream response
                const chatId = `chat-${Date.now()}`;
                const newChat: FollowUpItem = {
                    type: "chat",
                    data: {
                        id: chatId,
                        query,
                        response: "",
                        isStreaming: true,
                    },
                };
                setFollowUpItems((prev) => [...prev, newChat]);

                const reader = response.body?.getReader();
                if (!reader) throw new Error("No response body");

                const decoder = new TextDecoder();
                let buffer = "";
                let accumulated = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith("data: ")) continue;

                        try {
                            const data = JSON.parse(trimmed.slice(6));

                            if (data.done) break;

                            if (data.token) {
                                accumulated += data.token;
                                setFollowUpItems((prev) =>
                                    prev.map((fi) =>
                                        fi.type === "chat" && fi.data.id === chatId
                                            ? {
                                                  ...fi,
                                                  data: {
                                                      ...fi.data,
                                                      response: accumulated,
                                                  },
                                              }
                                            : fi
                                    )
                                );
                            }

                            if (data.error) {
                                console.error("Stream error:", data.error);
                                break;
                            }
                        } catch (parseErr) {
                            console.warn("SSE parse error:", trimmed, parseErr);
                        }
                    }
                }

                // Mark streaming as complete
                setFollowUpItems((prev) =>
                    prev.map((fi) =>
                        fi.type === "chat" && fi.data.id === chatId
                            ? { ...fi, data: { ...fi.data, isStreaming: false } }
                            : fi
                    )
                );
                setIsProcessingFollowUp(false);
            }
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                console.log("Follow-up request aborted");
            } else {
                console.error("Error processing follow-up:", error);
                toast.error("Failed to process follow-up request");
            }
            setIsProcessingFollowUp(false);
        } finally {
            abortControllerRef.current = null;
        }
    };

    // Derived state
    const isInProgress = session && !["completed", "failed"].includes(session.status);
    const isCompleted = session?.status === "completed";
    const isFailed = session?.status === "failed";

    // Check if any follow-up research is still in progress
    const hasActiveFollowUpResearch = followUpItems.some(
        (item) =>
            item.type === "research" &&
            (item.data.session === null ||
            !["completed", "failed"].includes(item.data.session.status))
    );

    // Check if any chat is streaming
    const hasActiveChat = followUpItems.some(
        (item) => item.type === "chat" && item.data.isStreaming
    );

    // Input is disabled while main session is in progress, or a follow-up is being processed
    const isInputDisabled =
        !!isInProgress || isProcessingFollowUp || hasActiveFollowUpResearch || hasActiveChat;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pl-0 md:pl-20 px-4">
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
            <div className="min-h-screen flex items-center justify-center pl-0 md:pl-20 px-4">
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
            <div className="fixed top-14 md:top-0 left-0 md:left-20 right-0 z-30 bg-background/85 backdrop-blur-md border-b border-border/40">
                <div className="flex items-center justify-between px-4 md:px-8 py-2.5 gap-2">
                    <div className="flex gap-3 items-center min-w-0">
                        <div className="hidden md:block shrink-0">
                            <UserButton />
                        </div>
                        <div className="flex items-center gap-2 text-primary shrink-0 min-w-0">
                            <Atom className="w-4 h-4 shrink-0" />
                            <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">Deep Research</span>
                        </div>
                    </div>

                    <div className="flex-1 flex justify-center max-w-2xl mx-2 min-w-0">
                        <h2 className="line-clamp-1 text-xs md:text-sm font-semibold text-foreground/80">
                            {session.query}
                        </h2>
                    </div>

                    <div className="flex gap-2 items-center shrink-0">
                        {isCompleted && (
                            <Button variant="outline" size="sm" className="h-8 text-xs max-sm:px-2" onClick={() => {
                                navigator.clipboard.writeText(session.final_report);
                                toast.success("Report copied to clipboard");
                            }}>
                                <ShareIcon className="h-3.5 w-3.5 sm:mr-2" />
                                <span className="hidden sm:inline">Copy Report</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-16 md:pt-16 max-md:pt-36 pl-0 md:pl-20">
                <div className="max-w-4xl mx-auto px-4 md:px-10 py-8 pb-32 max-md:pt-4">
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

                    {/* Follow-up Items — stacked below the main report */}
                    {followUpItems.map((item) => {
                        if (item.type === "chat") {
                            return (
                                <ResearchChatResponse
                                    key={item.data.id}
                                    chat={item.data}
                                />
                            );
                        }

                        if (item.type === "research") {
                            const followUpSession = item.data.session;
                            const isFollowUpInProgress = followUpSession && !["completed", "failed"].includes(followUpSession.status);
                            const isFollowUpCompleted = followUpSession?.status === "completed";
                            const isFollowUpFailed = followUpSession?.status === "failed";

                            return (
                                <div key={item.data.id} className="mt-8 border-t border-border pt-8">
                                    {/* Follow-up Query Title */}
                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 text-primary mb-3">
                                            <Atom className="w-5 h-5" />
                                            <span className="text-sm font-medium uppercase tracking-wider">Follow-up Research</span>
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                                            {item.data.query}
                                        </h2>
                                        {followUpSession?.report_plan && (
                                            <p className="mt-2 text-muted-foreground text-sm">
                                                {(followUpSession.report_plan as unknown as { title: string })?.title}
                                            </p>
                                        )}
                                    </div>

                                    {/* Loading state while session hasn't been fetched yet */}
                                    {!followUpSession && (
                                        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-primary/5">
                                            <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                            <p className="text-sm text-muted-foreground">Starting research...</p>
                                        </div>
                                    )}

                                    {/* Progress Timeline */}
                                    {(isFollowUpInProgress || isFollowUpFailed) && followUpSession && (
                                        <ResearchProgress
                                            activityLog={followUpSession.activity_log}
                                            status={followUpSession.status}
                                            reportPlan={followUpSession.report_plan}
                                        />
                                    )}

                                    {/* Completed Report */}
                                    {isFollowUpCompleted && followUpSession?.final_report && (
                                        <>
                                            <details className="mb-6 group">
                                                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                                                    <ChevronRight className="w-4 h-4 transition-transform duration-200 group-open:rotate-90" />
                                                    <span>View research progress ({followUpSession.activity_log?.length || 0} steps)</span>
                                                </summary>
                                                <div className="mt-4">
                                                    <ResearchProgress
                                                        activityLog={followUpSession.activity_log}
                                                        status={followUpSession.status}
                                                        reportPlan={followUpSession.report_plan}
                                                    />
                                                </div>
                                            </details>

                                            <ResearchReport
                                                report={followUpSession.final_report}
                                                citations={followUpSession.citations}
                                            />
                                        </>
                                    )}

                                    {/* Failed State */}
                                    {isFollowUpFailed && (
                                        <div className="mt-4 p-4 border border-destructive/30 rounded-xl bg-destructive/5">
                                            <h3 className="font-semibold text-destructive text-sm mb-1">Follow-up Research Failed</h3>
                                            <p className="text-xs text-muted-foreground">
                                                An error occurred. Try rephrasing your query.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return null;
                    })}

                    {/* Scroll anchor for new follow-ups */}
                    <div ref={followUpEndRef} />
                </div>
            </div>

            {/* Follow-up Input — always visible, disabled during processing */}
            {session && (
                <ResearchFollowupInput
                    disabled={isInputDisabled}
                    onSubmit={handleFollowUp}
                    isProcessing={isProcessingFollowUp}
                />
            )}
        </div>
    );
}

export default DeepResearchPage;
