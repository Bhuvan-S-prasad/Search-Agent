"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ExternalLink } from "lucide-react";
import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  type CSSProperties,
} from "react";
import Image from "next/image";

/* ─── Types ────────────────────────────────────────────────── */

interface SearchItem {
  title?: string;
  url?: string;
  description?: string;
  name?: string;
  img?: string;
  thumbnail?: string;
}

interface DisplaySummaryProps {
  aiResponce?: string;
  searchResult?: SearchItem[];
}

interface TooltipState {
  nums: number[];
  anchorRect: DOMRect;
}

interface CiteProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  "data-citations"?: string;
}

/* ─── Constants ────────────────────────────────────────────── */

const TOOLTIP_WIDTH = 360;
const TOOLTIP_GAP = 10;
const VIEWPORT_PADDING = 16;
const HIDE_DELAY = 200;

/* ─── Component ────────────────────────────────────────────── */

function DisplaySummary({
  aiResponce,
  searchResult = [],
}: DisplaySummaryProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const [isVisible, setIsVisible] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Helpers ─────────────────────────────────────────────── */

  const getDomain = useCallback((url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return "source";
    }
  }, []);

  const getFavicon = useCallback((url: string) => {
    try {
      const origin = new URL(url).origin;
      return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
    } catch {
      return "";
    }
  }, []);

  const formatLabel = useCallback(
    (nums: number[]): string => {
      const first = searchResult[nums[0] - 1];
      return first?.name || getDomain(first?.url || "");
    },
    [searchResult, getDomain],
  );

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  /* ── Markdown pre-processing: [1], [2,3] → <cite> ──────── */

  const processedContent = useMemo(() => {
    return (aiResponce || "").replace(
      /\[(\d+(?:\s*,\s*\d+)*)\]/g,
      (_, numsRaw) => {
        const nums = numsRaw
          .split(",")
          .map((n: string) => parseInt(n.trim(), 10))
          .filter((n: number) => !Number.isNaN(n));

        const label = escapeHtml(formatLabel(nums));

        return `<cite data-citations="${nums.join(",")}">${label}</cite>`;
      },
    );
  }, [aiResponce, formatLabel]);

  /* ── Tooltip positioning (computed in useEffect) ────────── */

  useEffect(() => {
    if (!tooltip || !tooltipRef.current || !wrapperRef.current) return;

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const tipEl = tooltipRef.current;
    const tipHeight = tipEl.scrollHeight;
    const anchor = tooltip.anchorRect;

    // Horizontal: center-align under the citation badge, clamp to viewport
    let left = anchor.left - wrapperRect.left + anchor.width / 2 - TOOLTIP_WIDTH / 2;
    const minLeft = VIEWPORT_PADDING - wrapperRect.left;
    const maxLeft = window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING - wrapperRect.left;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    // Vertical: prefer below, flip above if insufficient space
    let top = anchor.bottom - wrapperRect.top + TOOLTIP_GAP;
    let placement: "below" | "above" = "below";

    if (anchor.bottom + tipHeight + TOOLTIP_GAP > window.innerHeight - VIEWPORT_PADDING) {
      top = anchor.top - wrapperRect.top - tipHeight - TOOLTIP_GAP;
      placement = "above";
    }

    setTooltipStyle({
      left,
      top,
      width: TOOLTIP_WIDTH,
      transformOrigin: placement === "below" ? "top center" : "bottom center",
    });

    // Trigger entrance animation on next frame
    requestAnimationFrame(() => setIsVisible(true));
  }, [tooltip]);

  /* ── Show / hide logic ─────────────────────────────────── */

  const clearHideTimer = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
  };

  const showTooltip = (e: React.MouseEvent<HTMLSpanElement>, nums: number[]) => {
    clearHideTimer();
    const anchorRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setIsVisible(false);
    setTooltip({ nums, anchorRect });
  };

  const hideTooltip = () => {
    clearHideTimer();
    hideTimeout.current = setTimeout(() => {
      setIsVisible(false);
      // Wait for exit animation before unmounting
      setTimeout(() => setTooltip(null), 150);
    }, HIDE_DELAY);
  };

  const keepTooltip = () => clearHideTimer();

  /* ── Render ─────────────────────────────────────────────── */

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
          a: (props) => (
            <a className="text-primary underline" target="_blank" {...props} />
          ),

          cite: ({ children, ...props }: CiteProps) => {
            const raw = props["data-citations"];
            if (!raw) return <cite>{children}</cite>;

            const nums = raw
              .split(",")
              .map((n: string) => parseInt(n.trim(), 10))
              .filter((n: number) => !Number.isNaN(n));

            return (
              <span
                className="citation-trigger"
                onMouseEnter={(e) => showTooltip(e, nums)}
                onMouseLeave={hideTooltip}
              >
                <span className="citation-badge">
                  {children}
                </span>
              </span>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>

      {/* ── Citation Tooltip Card ──────────────────────────── */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className={`citation-tooltip ${isVisible ? "citation-tooltip--visible" : ""}`}
          style={tooltipStyle}
          onMouseEnter={keepTooltip}
          onMouseLeave={hideTooltip}
          role="tooltip"
        >
          {/* Arrow indicator */}
          <div className="citation-tooltip__arrow" />

          {tooltip.nums.map((num, idx) => {
            const src = searchResult[num - 1];
            if (!src) return null;

            const domain = getDomain(src.url || "");
            const favicon = src.img || src.thumbnail || getFavicon(src.url || "");

            return (
              <a
                key={num}
                href={src.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`citation-card ${idx > 0 ? "citation-card--separated" : ""}`}
              >
                {/* Header: favicon + domain + index badge */}
                <div className="citation-card__header">
                  <div className="citation-card__site">
                    {favicon && (
                      <Image
                        src={favicon}
                        alt={domain}
                        width={16}
                        height={16}
                        className="citation-card__favicon"
                        unoptimized
                      />
                    )}
                    <span className="citation-card__domain">{domain}</span>
                  </div>
                  <span className="citation-card__index">{num}</span>
                </div>

                {/* Title */}
                <div className="citation-card__title">
                  {src.title || "Untitled source"}
                </div>

                {/* Description snippet */}
                {src.description && (
                  <div className="citation-card__snippet">
                    {src.description}
                  </div>
                )}

                {/* Visit link indicator */}
                <div className="citation-card__visit">
                  <ExternalLink className="citation-card__visit-icon" />
                  <span>Visit source</span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* ── Scoped Styles ─────────────────────────────────── */}
      <style jsx>{`
        /* ── Citation Badge (inline) ───────────────────────── */
        .citation-trigger {
          position: relative;
          display: inline;
        }

        .citation-badge {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          font-weight: 600;
          font-style: normal;
          line-height: 1;
          padding: 2px 6px;
          border-radius: 4px;
          cursor: pointer;
          vertical-align: baseline;
          transition: all 0.15s ease;
          color: var(--primary);
          background: color-mix(in oklch, var(--primary) 8%, transparent);
          border: 1px solid color-mix(in oklch, var(--primary) 15%, transparent);
        }

        .citation-trigger:hover .citation-badge {
          background: color-mix(in oklch, var(--primary) 16%, transparent);
          border-color: color-mix(in oklch, var(--primary) 30%, transparent);
          box-shadow: 0 0 0 2px color-mix(in oklch, var(--primary) 8%, transparent);
        }

        /* ── Tooltip Container ─────────────────────────────── */
        .citation-tooltip {
          position: absolute;
          z-index: 9999;
          border-radius: 12px;
          overflow: hidden;
          background: var(--popover);
          border: 1px solid var(--border);
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.07),
            0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.03);

          /* Entry animation */
          opacity: 0;
          transform: scale(0.96) translateY(4px);
          transition:
            opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
        }

        .citation-tooltip--visible {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: auto;
        }

        /* ── Individual Source Card ─────────────────────────── */
        .citation-card {
          display: block;
          padding: 14px 16px;
          text-decoration: none;
          color: inherit;
          transition: background 0.12s ease;
          cursor: pointer;
        }

        .citation-card:hover {
          background: var(--accent);
        }

        .citation-card--separated {
          border-top: 1px solid var(--border);
        }

        /* Header row: favicon, domain, index */
        .citation-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .citation-card__site {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .citation-card__favicon {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          flex-shrink: 0;
          object-fit: contain;
        }

        .citation-card__domain {
          font-size: 12px;
          font-weight: 500;
          color: var(--muted-foreground);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .citation-card__index {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 700;
          color: var(--primary);
          background: color-mix(in oklch, var(--primary) 10%, transparent);
        }

        /* Title */
        .citation-card__title {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.4;
          color: var(--foreground);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 4px;
        }

        /* Description snippet */
        .citation-card__snippet {
          font-size: 12px;
          line-height: 1.5;
          color: var(--muted-foreground);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 8px;
        }

        /* Visit link */
        .citation-card__visit {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 500;
          color: var(--primary);
          opacity: 0;
          transform: translateX(-4px);
          transition:
            opacity 0.15s ease,
            transform 0.15s ease;
        }

        .citation-card:hover .citation-card__visit {
          opacity: 1;
          transform: translateX(0);
        }

        .citation-card__visit-icon {
          width: 12px;
          height: 12px;
        }

        /* ── Dark mode shadow refinement ───────────────────── */
        :global(.dark) .citation-tooltip {
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.25),
            0 10px 25px -5px rgba(0, 0, 0, 0.35),
            0 0 0 1px rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </div>
  );
}

export default DisplaySummary;
