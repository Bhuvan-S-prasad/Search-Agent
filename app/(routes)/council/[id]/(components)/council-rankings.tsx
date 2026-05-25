"use client";

import { useState } from "react";
import { Trophy, ChevronDown, ChevronUp, Medal } from "lucide-react";
import { getModelDisplayInfo } from "@/lib/council/config";
import type { AggregateRanking, CouncilStage2Result, LabelToModelMap } from "@/lib/council/types";

interface CouncilRankingsProps {
  aggregateRankings: AggregateRanking[];
  stage2Results: CouncilStage2Result[];
  labelToModel: LabelToModelMap;
}

const RANK_STYLES = [
  { badge: "🥇", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-600" },
  { badge: "🥈", bg: "bg-slate-400/10", border: "border-slate-400/20", text: "text-slate-500" },
  { badge: "🥉", bg: "bg-orange-400/10", border: "border-orange-400/20", text: "text-orange-500" },
  { badge: "4", bg: "bg-muted/30", border: "border-border", text: "text-muted-foreground" },
];

function CouncilRankings({ aggregateRankings, stage2Results, labelToModel }: CouncilRankingsProps) {
  const [showEvaluations, setShowEvaluations] = useState(false);

  if (aggregateRankings.length === 0) return null;

  // Reverse the label map for display
  const modelToLabel: Record<string, string> = {};
  for (const [label, model] of Object.entries(labelToModel)) {
    modelToLabel[model] = label;
  }

  return (
    <div className="mb-8 space-y-4">
      {/* Leaderboard */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Council Rankings
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              Based on peer evaluations
            </span>
          </h3>
        </div>

        <div className="p-3 space-y-1.5">
          {aggregateRankings.map((ranking, index) => {
            const info = getModelDisplayInfo(ranking.model);
            const style = RANK_STYLES[index] || RANK_STYLES[3];
            const label = modelToLabel[ranking.model] || "";

            return (
              <div
                key={ranking.model}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${style.bg} border ${style.border} transition-all duration-300`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Rank Badge */}
                <div className="flex items-center justify-center w-8 h-8 shrink-0">
                  {index < 3 ? (
                    <span className="text-lg">{style.badge}</span>
                  ) : (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted">
                      <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
                    </div>
                  )}
                </div>

                {/* Model Info */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-md text-xs ${info.bgColor} ${info.accentColor}`}>
                    {info.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {info.name}
                    </p>
                    {label && (
                      <p className="text-[10px] text-muted-foreground/50">
                        {label}
                      </p>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold tabular-nums ${style.text}`}>
                    {ranking.average_rank.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">
                    avg rank
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Evaluations Toggle */}
      {stage2Results.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
            onClick={() => setShowEvaluations(!showEvaluations)}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Medal className="w-4 h-4 text-primary" />
              Individual Evaluations
              <span className="text-xs font-normal text-muted-foreground">
                ({stage2Results.length} reviews)
              </span>
            </span>
            {showEvaluations ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {showEvaluations && (
            <div className="border-t border-border divide-y divide-border/40">
              {stage2Results.map((result) => {
                const info = getModelDisplayInfo(result.model);
                return (
                  <div key={result.model} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`flex items-center justify-center w-5 h-5 rounded text-[10px] ${info.bgColor} ${info.accentColor}`}>
                        {info.emoji}
                      </div>
                      <span className={`text-xs font-semibold ${info.accentColor}`}>
                        {info.shortName}&apos;s Review
                      </span>
                    </div>
                    <div className="text-xs text-foreground/70 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {result.ranking}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CouncilRankings;
