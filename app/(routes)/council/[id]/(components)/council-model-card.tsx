"use client";

import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { getModelDisplayInfo } from "@/lib/council/config";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CouncilModelCardProps {
  modelId: string;
  response: string | null;
  isLoading: boolean;
  index: number;
}

function CouncilModelCard({ modelId, response, isLoading, index }: CouncilModelCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const info = getModelDisplayInfo(modelId);

  // Stagger entrance animation
  const animationDelay = `${index * 100}ms`;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-500 ${
        isLoading
          ? `${info.borderColor} border-2 shadow-sm`
          : response
            ? `border-border shadow-sm hover:shadow-md`
            : "border-border/50"
      }`}
      style={{ animationDelay }}
    >
      {/* Card Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
          isLoading ? `${info.bgColor}` : "hover:bg-muted/30"
        }`}
        onClick={() => response && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Model Avatar */}
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-lg text-sm font-semibold ${info.bgColor} ${info.accentColor}`}
          >
            {info.emoji}
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold truncate ${info.accentColor}`}>
              {info.shortName}
            </p>
            <p className="text-[10px] text-muted-foreground/60 truncate hidden sm:block">
              {info.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isLoading && (
            <div className="flex items-center gap-1.5">
              <Loader2 className={`w-3.5 h-3.5 animate-spin ${info.accentColor}`} />
              <span className="text-[10px] text-muted-foreground">Thinking...</span>
            </div>
          )}
          {response && !isLoading && (
            <button className="p-1 hover:bg-muted/50 rounded-md transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && !response && (
        <div className="px-4 pb-4 space-y-2.5">
          <div className="h-3 bg-muted/60 rounded-full w-full animate-pulse" />
          <div className="h-3 bg-muted/40 rounded-full w-5/6 animate-pulse" style={{ animationDelay: "100ms" }} />
          <div className="h-3 bg-muted/30 rounded-full w-4/6 animate-pulse" style={{ animationDelay: "200ms" }} />
        </div>
      )}

      {/* Response Content */}
      {response && isExpanded && (
        <div className="px-4 pb-4 border-t border-border/40">
          <div className="mt-3 text-sm text-foreground/85 leading-relaxed max-h-80 overflow-y-auto council-model-response">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                h2: ({ children }) => <h2 className="text-base font-semibold mt-4 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1.5">{children}</h3>,
                ul: ({ children }) => <ul className="mb-2 space-y-1 list-none pl-0">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 space-y-1 list-decimal pl-5">{children}</ol>,
                li: ({ children }) => (
                  <li className="relative pl-4 text-sm">
                    <span className="absolute left-0 top-[0.5em] w-1 h-1 rounded-full bg-muted-foreground/30" />
                    {children}
                  </li>
                ),
                code: ({ children }) => (
                  <code className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                ),
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              }}
            >
              {response}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Collapsed indicator */}
      {response && !isExpanded && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground/50 line-clamp-1">
            {response.substring(0, 120)}...
          </p>
        </div>
      )}
    </div>
  );
}

export default CouncilModelCard;
