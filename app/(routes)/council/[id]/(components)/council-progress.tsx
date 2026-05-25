"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import type { CouncilStatus } from "@/lib/council/types";

interface CouncilProgressProps {
  currentStage: 1 | 2 | 3;
  status: CouncilStatus;
}

const stages = [
  { id: 1, label: "Deliberation", description: "Models respond" },
  { id: 2, label: "Peer Review", description: "Anonymous ranking" },
  { id: 3, label: "Synthesis", description: "Chairman's verdict" },
];

function CouncilProgress({ currentStage, status }: CouncilProgressProps) {
  const isFailed = status === "failed";
  const isComplete = status === "completed";

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between gap-0">
        {stages.map((stage, index) => {
          const isActive = stage.id === currentStage && !isComplete && !isFailed;
          const isDone = stage.id < currentStage || isComplete;

          return (
            <div key={stage.id} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`relative flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-500 ${
                    isDone
                      ? "border-primary bg-primary/10"
                      : isActive
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/30"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-primary" />
                  ) : isActive ? (
                    <>
                      <span className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {stage.id}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={`text-xs font-semibold ${
                      isDone || isActive ? "text-foreground" : "text-muted-foreground/60"
                    }`}
                  >
                    {stage.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 hidden sm:block">
                    {stage.description}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {index < stages.length - 1 && (
                <div className="flex-1 mx-3 -mt-5">
                  <div className="h-[2px] w-full rounded-full bg-border relative overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
                        isDone ? "w-full bg-primary" : isActive ? "w-1/2 bg-primary/50" : "w-0"
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CouncilProgress;
