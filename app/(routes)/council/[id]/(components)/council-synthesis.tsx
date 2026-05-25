"use client";

import { Crown } from "lucide-react";
import { getModelDisplayInfo } from "@/lib/council/config";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CouncilSynthesisProps {
  modelId: string;
  response: string;
  isLoading: boolean;
}

function CouncilSynthesis({ modelId, response, isLoading }: CouncilSynthesisProps) {
  const info = getModelDisplayInfo(modelId);

  return (
    <div className="mb-8">
      {/* Chairman Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-br from-amber-500/15 to-rose-500/15 border border-amber-500/20">
          <Crown className="w-4.5 h-4.5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Chairman&apos;s Verdict
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Synthesized by {info.name}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[10px] font-medium text-primary">Council Consensus</span>
        </div>
      </div>

      {/* Synthesis Content */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Decorative top accent */}
        <div className="h-1 bg-linear-to-r from-amber-500/40 via-primary/40 to-rose-500/40" />

        <div className="p-5 md:p-6">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-muted/60 rounded-full w-full animate-pulse" />
              <div className="h-4 bg-muted/50 rounded-full w-11/12 animate-pulse" style={{ animationDelay: "100ms" }} />
              <div className="h-4 bg-muted/40 rounded-full w-5/6 animate-pulse" style={{ animationDelay: "200ms" }} />
              <div className="h-4 bg-muted/30 rounded-full w-4/6 animate-pulse" style={{ animationDelay: "300ms" }} />
              <div className="h-4 bg-muted/40 rounded-full w-9/12 animate-pulse" style={{ animationDelay: "400ms" }} />
            </div>
          ) : (
            <div className="text-[15px] text-foreground/90 leading-[1.7] tracking-[-0.01em]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="mb-4 last:mb-0">{children}</p>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground tracking-tight flex items-center gap-2">
                      <span className="w-1 h-5 bg-primary/20 rounded-full" />
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium mt-6 mb-3 text-foreground tracking-tight">
                      {children}
                    </h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-4 space-y-1.5 list-none pl-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-4 space-y-1.5 list-decimal pl-6">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="relative pl-5">
                      <span className="absolute left-0 top-[0.6em] w-1.5 h-1.5 rounded-full bg-primary/25" />
                      {children}
                    </li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-6 pl-5 border-l-2 border-primary/20 italic text-foreground/75 bg-primary/3 py-3 pr-4 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  code: ({ children }) => (
                    <code className="bg-muted/50 px-1.5 py-0.5 rounded text-[0.85em] font-mono">
                      {children}
                    </code>
                  ),
                  table: ({ children }) => (
                    <div className="my-6 overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-muted/30 border-b border-border">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2.5 border-b border-border/30 text-foreground/80">{children}</td>
                  ),
                }}
              >
                {response}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CouncilSynthesis;
