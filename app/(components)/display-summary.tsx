"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { useState, useMemo, useCallback, useRef } from "react";

interface SearchItem {
  title?: string;
  url?: string;
  description?: string;
  name?: string;
}

interface DisplaySummaryProps {
  aiResponce?: string;
  searchResult?: SearchItem[];
}

interface TooltipInfo {
  nums: number[];
  left: number;
  top: number;
}

function DisplaySummary({ aiResponce, searchResult = [] }: DisplaySummaryProps) {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  /* Utility: Get domain from URL */
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      return domain.split(".")[0];
    } catch {
      return "source";
    }
  };

  /* Format citation label */
  const formatLabel = useCallback(
    (nums: number[]): string => {
      const first = searchResult[nums[0] - 1];
      return first?.name || getDomain(first?.url || "");
    },
    [searchResult]
  );

  /* Escape HTML */
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  /* Replace [1], [2], [1,3] with <cite> */
  const processedContent = useMemo(() => {
    return (aiResponce || "").replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (_, numsRaw) => {
      const nums = numsRaw
        .split(",")
        .map((n: string) => parseInt(n.trim(), 10))
        .filter((n: number) => !Number.isNaN(n));

      const label = escapeHtml(formatLabel(nums));

      return `<cite data-citations="${nums.join(",")}">${label}</cite>`;
    });
  }, [aiResponce, formatLabel]);

  /* Show tooltip with smart positioning */
  const showTooltip = (e: React.MouseEvent<HTMLSpanElement>, nums: number[]) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const wrapperRect = wrapperRef.current?.getBoundingClientRect();
    if (!wrapperRect) return;

    const left = rect.left - wrapperRect.left;
    const top = rect.bottom - wrapperRect.top + 8;

    // Temporarily place tooltip to measure its size
    setActiveTooltip(nums[0]);
    setTooltipInfo({ nums, left, top });

    setTimeout(() => {
      const tooltipEl = tooltipRef.current;
      if (!tooltipEl) return;

      const tipRect = tooltipEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let finalLeft = left;
      let finalTop = top;

      // If overflowing right → shift left
      if (rect.right + tipRect.width > viewportWidth - 20) {
        finalLeft = rect.left - wrapperRect.left - tipRect.width - 12;
      }

      // If overflowing bottom → show above
      if (rect.bottom + tipRect.height > viewportHeight - 20) {
        finalTop = rect.top - wrapperRect.top - tipRect.height - 12;
      }

      // Apply final corrected position
      setTooltipInfo({
        nums,
        left: finalLeft,
        top: finalTop,
      });
    }, 10);
  };

  /* Hide tooltip */
  const hideTooltip = () => {
    hideTimeout.current = setTimeout(() => {
      setActiveTooltip(null);
      setTooltipInfo(null);
    }, 120);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative prose prose-neutral dark:prose-invert max-w-none text-[16px] leading-[1.9]"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: (props) => <p className="mb-4" {...props} />,
          a: (props) => <a className="text-primary underline" target="_blank" {...props} />,

          cite: ({ children, ...props }) => {
            const raw = (props as any)["data-citations"];
            if (!raw) return <cite>{children}</cite>;

            const nums = raw
              .split(",")
              .map((n: string) => parseInt(n.trim(), 10))
              .filter((n: number) => !Number.isNaN(n));

            return (
              <span
                className="relative inline-block"
                onMouseEnter={(e) => showTooltip(e, nums)}
                onMouseLeave={hideTooltip}
              >
                <span className="text-primary bg-primary/10 border border-primary/20 text-[11px] px-1 py-0.5 rounded cursor-pointer font-semibold">
                  {children}
                </span>
              </span>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>

      {/* Smart Tooltip */}
      {activeTooltip && tooltipInfo && (
        <div
          ref={tooltipRef}
          className="absolute z-[9999] bg-background border border-border shadow-xl rounded-xl p-4 max-w-xs"
          style={{
            left: tooltipInfo.left,
            top: tooltipInfo.top,
          }}
          onMouseEnter={() => hideTimeout.current && clearTimeout(hideTimeout.current)}
          onMouseLeave={hideTooltip}
        >
          {/* Heading */}
          <div className="text-xs font-semibold text-foreground mb-3">
            {formatLabel(tooltipInfo.nums)}
          </div>

          {tooltipInfo.nums.map((num) => {
            const src = searchResult[num - 1];
            if (!src) return null;

            return (
              <div key={num} className="flex gap-2 mb-3 last:mb-0">
                <ExternalLink className="w-4 h-4 mt-1 text-primary" />

                <div>
                  <div className="font-medium text-sm text-foreground">
                    {src.title || "Source"}
                  </div>

                  {src.url && (
                    <div className="text-[11px] text-primary break-all">
                      {src.url}
                    </div>
                  )}

                  {src.description && (
                    <div className="text-[11px] text-muted-foreground mt-1 line-clamp-3">
                      {src.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DisplaySummary;
