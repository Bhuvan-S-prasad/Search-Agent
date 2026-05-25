"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { UserButton } from "@clerk/nextjs";
import { Crown, ShareIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import CouncilProgress from "./(components)/council-progress";
import CouncilModelCard from "./(components)/council-model-card";
import CouncilRankings from "./(components)/council-rankings";
import CouncilSynthesis from "./(components)/council-synthesis";

import type {
  CouncilSession,
  CouncilStatus,
  CouncilStage1Result,
  CouncilStage2Result,
  CouncilStage3Result,
  AggregateRanking,
  LabelToModelMap,
  CouncilSSEEvent,
} from "@/lib/council/types";
import { COUNCIL_MODELS, CHAIRMAN_MODEL } from "@/lib/council/config";

function CouncilPage() {
  const { id } = useParams();
  const router = useRouter();

  // Session state
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CouncilStatus>("collecting");
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);
  const [stageMessage, setStageMessage] = useState("Initializing council...");

  // Stage results
  const [stage1Results, setStage1Results] = useState<CouncilStage1Result[]>([]);
  const [stage2Results, setStage2Results] = useState<CouncilStage2Result[]>([]);
  const [stage3Result, setStage3Result] = useState<CouncilStage3Result | null>(null);
  const [aggregateRankings, setAggregateRankings] = useState<AggregateRanking[]>([]);
  const [labelToModel, setLabelToModel] = useState<LabelToModelMap>({});

  // Loading states for individual models (stage 1)
  const [loadingModels, setLoadingModels] = useState<Set<string>>(new Set());

  // Track whether SSE is running
  const sseStartedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch existing session (for page reloads)
  const fetchSession = useCallback(async () => {
    if (!id) return;

    try {
      const response = await axios.post("/api/council/status", { sessionId: id });
      const session = response.data.session as CouncilSession;

      setQuery(session.query);
      setStatus(session.status);

      if (session.stage1_results?.length) {
        setStage1Results(session.stage1_results);
      }
      if (session.stage2_results?.length) {
        setStage2Results(session.stage2_results);
      }
      if (session.stage3_result?.response) {
        setStage3Result(session.stage3_result);
      }
      if (session.aggregate_rankings?.length) {
        setAggregateRankings(session.aggregate_rankings);
      }
      if (session.label_to_model && Object.keys(session.label_to_model).length) {
        setLabelToModel(session.label_to_model);
      }

      // Set current stage based on status
      if (session.status === "completed" || session.status === "synthesizing") {
        setCurrentStage(3);
      } else if (session.status === "ranking") {
        setCurrentStage(2);
      } else {
        setCurrentStage(1);
      }

      setLoading(false);

      // If session is still "collecting", start SSE
      return session.status;
    } catch (error) {
      console.error("Error fetching council session:", error);
      setLoading(false);
      return null;
    }
  }, [id]);

  // Connect to SSE stream
  const startSSE = useCallback(async () => {
    if (!id || sseStartedRef.current) return;
    sseStartedRef.current = true;

    const abortController = new AbortController();
    abortRef.current = abortController;

    // Mark all council models as loading
    setLoadingModels(new Set(COUNCIL_MODELS));

    try {
      const response = await fetch("/api/council/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          // Session already processed — just fetch the latest state
          console.log("[Council] Session already processed, fetching state...");
          sseStartedRef.current = false;
          return;
        }
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

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
            const event: CouncilSSEEvent = JSON.parse(trimmed.slice(6));
            handleSSEEvent(event);
          } catch (parseErr) {
            console.warn("SSE parse error:", trimmed, parseErr);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("[Council] SSE connection aborted");
      } else {
        console.error("[Council] SSE error:", error);
        toast.error("Connection to council lost. Refreshing...");
        // Try to recover by fetching the latest state
        await fetchSession();
      }
    }
  }, [id, fetchSession]);

  // Handle individual SSE events
  const handleSSEEvent = (event: CouncilSSEEvent) => {
    switch (event.type) {
      case "stage_start":
        setCurrentStage(event.stage);
        setStageMessage(event.content || "");
        if (event.stage === 1) {
          setStatus("collecting");
        } else if (event.stage === 2) {
          setStatus("ranking");
          setLoadingModels(new Set(COUNCIL_MODELS));
        } else if (event.stage === 3) {
          setStatus("synthesizing");
          setLoadingModels(new Set());
        }
        break;

      case "model_response":
        if (event.stage === 1 && event.model && event.content) {
          setStage1Results((prev) => {
            // Avoid duplicates
            if (prev.some((r) => r.model === event.model)) return prev;
            return [...prev, { model: event.model!, response: event.content! }];
          });
          // Remove from loading set
          setLoadingModels((prev) => {
            const next = new Set(prev);
            next.delete(event.model!);
            return next;
          });
        }
        if (event.stage === 2 && event.model && event.content) {
          const parsed = (event.data as { parsed_ranking?: string[] })?.parsed_ranking || [];
          setStage2Results((prev) => {
            if (prev.some((r) => r.model === event.model)) return prev;
            return [...prev, {
              model: event.model!,
              ranking: event.content!,
              parsed_ranking: parsed,
            }];
          });
          setLoadingModels((prev) => {
            const next = new Set(prev);
            next.delete(event.model!);
            return next;
          });
        }
        break;

      case "rankings_ready":
        if (event.data) {
          const data = event.data as {
            aggregate_rankings: AggregateRanking[];
            label_to_model: LabelToModelMap;
          };
          setAggregateRankings(data.aggregate_rankings);
          setLabelToModel(data.label_to_model);
        }
        break;

      case "stage_complete":
        if (event.stage === 1) {
          setLoadingModels(new Set());
        }
        break;

      case "synthesis_chunk":
        if (event.model && event.content) {
          setStage3Result({
            model: event.model,
            response: event.content,
          });
        }
        break;

      case "council_complete":
        setStatus("completed");
        setLoadingModels(new Set());
        break;

      case "error":
        setStatus("failed");
        setLoadingModels(new Set());
        setStageMessage(event.content || "An error occurred.");
        toast.error(event.content || "Council process failed");
        break;
    }
  };

  // Initial load
  useEffect(() => {
    if (!id) return;

    const init = async () => {
      const sessionStatus = await fetchSession();

      if (sessionStatus === "collecting") {
        startSSE();
      }
    };

    init();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Derived state
  const isComplete = status === "completed";
  const isFailed = status === "failed";
  const isRunning = !isComplete && !isFailed;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pl-0 md:pl-20 px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
            <Crown className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground">Loading council session...</p>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="min-h-screen flex items-center justify-center pl-0 md:pl-20 px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
          <p className="text-muted-foreground mb-4">This council session does not exist or has been removed.</p>
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
            <div className="flex items-center gap-2 text-amber-600 shrink-0 min-w-0">
              <Crown className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">
                Council of NOMI
              </span>
            </div>
          </div>

          <div className="flex-1 flex justify-center max-w-2xl mx-2 min-w-0">
            <h2 className="line-clamp-1 text-xs md:text-sm font-semibold text-foreground/80">
              {query}
            </h2>
          </div>

          <div className="flex gap-2 items-center shrink-0">
            {isComplete && stage3Result && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs max-sm:px-2"
                onClick={() => {
                  navigator.clipboard.writeText(stage3Result.response);
                  toast.success("Synthesis copied to clipboard");
                }}
              >
                <ShareIcon className="h-3.5 w-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Copy Synthesis</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 md:pt-16 max-md:pt-36 pl-0 md:pl-20">
        <div className="max-w-4xl mx-auto px-4 md:px-10 py-8 pb-16 max-md:pt-4">
          {/* Query Title */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-amber-600 mb-3">
              <Crown className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">
                Council of NOMI
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {query}
            </h1>
          </div>

          {/* Stage Progress Stepper */}
          <CouncilProgress currentStage={currentStage} status={status} />

          {/* Stage Status Message */}
          {isRunning && stageMessage && (
            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
              </span>
              <span>{stageMessage}</span>
            </div>
          )}

          {/* Stage 1: Model Response Cards */}
          {(currentStage >= 1) && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</span>
                Individual Responses
                {stage1Results.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {stage1Results.length} of {COUNCIL_MODELS.length} models
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Show responded models */}
                {stage1Results.map((result, i) => (
                  <CouncilModelCard
                    key={result.model}
                    modelId={result.model}
                    response={result.response}
                    isLoading={false}
                    index={i}
                  />
                ))}
                {/* Show loading models (stage 1 only) */}
                {currentStage === 1 &&
                  Array.from(loadingModels)
                    .filter((m) => !stage1Results.some((r) => r.model === m))
                    .map((modelId, i) => (
                      <CouncilModelCard
                        key={modelId}
                        modelId={modelId}
                        response={null}
                        isLoading={true}
                        index={stage1Results.length + i}
                      />
                    ))}
              </div>
            </div>
          )}

          {/* Stage 2: Rankings */}
          {(currentStage >= 2 && (aggregateRankings.length > 0 || currentStage === 2)) && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</span>
                Peer Review
              </h3>
              {aggregateRankings.length > 0 ? (
                <CouncilRankings
                  aggregateRankings={aggregateRankings}
                  stage2Results={stage2Results}
                  labelToModel={labelToModel}
                />
              ) : (
                <div className="mb-8 flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/10">
                  <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Models are reviewing each other&apos;s responses...</p>
                </div>
              )}
            </div>
          )}

          {/* Stage 3: Chairman Synthesis */}
          {currentStage >= 3 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</span>
                Final Synthesis
              </h3>
              <CouncilSynthesis
                modelId={stage3Result?.model || CHAIRMAN_MODEL}
                response={stage3Result?.response || ""}
                isLoading={currentStage === 3 && !stage3Result}
              />
            </div>
          )}

          {/* Failed State */}
          {isFailed && (
            <div className="mt-8 p-6 border border-destructive/30 rounded-xl bg-destructive/5">
              <h3 className="font-semibold text-destructive mb-2">Council Failed</h3>
              <p className="text-sm text-muted-foreground">
                An error occurred during the council process. Please try again with a different query.
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

export default CouncilPage;
