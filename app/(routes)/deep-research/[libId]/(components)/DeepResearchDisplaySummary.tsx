"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ExternalLink } from "lucide-react";
import { useState, useMemo, useCallback, useRef } from "react";

// Matches items from Deep Research "sources" array
interface ResearchSource {
    id: string; // "1.1", "2.1" etc
    title?: string;
    url?: string;
    description?: string;
    snippet?: string;
    displayLink?: string;
}

interface DeepResearchDisplaySummaryProps {
    aiResponse?: string;
    sources?: ResearchSource[];
}

interface TooltipInfo {
    ids: string[];
    left: number;
    top: number;
}

function DeepResearchDisplaySummary({ aiResponse, sources = [] }: DeepResearchDisplaySummaryProps) {
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
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

    /* Find source by ID */
    const findSource = useCallback((id: string) => {
        return sources.find(s => s.id === id);
    }, [sources]);

    /* Format citation label */
    const formatLabel = useCallback(
        (ids: string[]): string => {
            const first = findSource(ids[0]);
            return first?.displayLink || getDomain(first?.url || "") || `Source ${ids[0]}`;
        },
        [findSource]
    );

    /* Escape HTML */
    const escapeHtml = (value: string) =>
        value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    /* Replace [1.1], [2.1, 2.3] with <cite> */
    const processedContent = useMemo(() => {
        if (!aiResponse) return "";

        // Regex for deep research style: [1.1], [2.1], [1.1, 2.3]
        return aiResponse.replace(/\[(\d+\.\d+(?:\s*,\s*\d+\.\d+)*)\]/g, (_, idsRaw) => {
            const ids = idsRaw
                .split(",")
                .map((s: string) => s.trim())
                .filter((s: string) => s);

            const label = escapeHtml(formatLabel(ids));

            return `<cite data-citations="${ids.join(",")}">${label}</cite>`;
        });
    }, [aiResponse, formatLabel]);

    /* Show tooltip with smart positioning */
    const showTooltip = (e: React.MouseEvent<HTMLSpanElement>, ids: string[]) => {
        if (hideTimeout.current) clearTimeout(hideTimeout.current);

        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const wrapperRect = wrapperRef.current?.getBoundingClientRect();
        if (!wrapperRect) return;

        const left = rect.left - wrapperRect.left;
        const top = rect.bottom - wrapperRect.top + 8;

        // Temporarily place tooltip to measure its size
        setActiveTooltip(ids[0]);
        setTooltipInfo({ ids, left, top });

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
                ids,
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

    if (!aiResponse) return null;

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

                        const ids = raw.split(",").map((s: string) => s.trim());

                        return (
                            <span
                                className="relative inline-block"
                                onMouseEnter={(e) => showTooltip(e, ids)}
                                onMouseLeave={hideTooltip}
                            >
                                <span className="text-blue-600 bg-blue-50 border border-blue-100 text-[11px] px-1.5 py-0.5 rounded-full cursor-pointer font-semibold align-super ml-0.5">
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
                    className="absolute z-[9999] bg-white border border-gray-200 shadow-xl rounded-xl p-4 max-w-sm w-80"
                    style={{
                        left: tooltipInfo.left,
                        top: tooltipInfo.top,
                    }}
                    onMouseEnter={() => hideTimeout.current && clearTimeout(hideTimeout.current)}
                    onMouseLeave={hideTooltip}
                >
                    {/* Heading */}
                    <div className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                        Citations
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-4">
                        {tooltipInfo.ids.map((id) => {
                            const src = findSource(id);
                            if (!src) return null;

                            return (
                                <div key={id} className="flex gap-3 items-start group">
                                    <div className="mt-0.5 min-w-[20px] h-[20px] flex items-center justify-center bg-gray-100 rounded-full text-[10px] font-mono text-gray-500">
                                        {id}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <a href={src.url} target="_blank" rel="noreferrer" className="block font-medium text-sm text-blue-600 hover:underline trunacte mb-0.5">
                                            {src.title || "Source"}
                                        </a>

                                        {/* Domain tag */}
                                        <div className="flex items-center gap-1 mb-1.5">
                                            {src.displayLink && (
                                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                    {src.displayLink}
                                                </span>
                                            )}
                                        </div>

                                        {src.snippet && (
                                            <div className="text-xs text-gray-500 leading-snug line-clamp-3">
                                                {src.snippet}
                                            </div>
                                        )}
                                    </div>

                                    <a href={src.url} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ExternalLink className="w-3.5 h-3.5 text-gray-400 hover:text-blue-600" />
                                    </a>

                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default DeepResearchDisplaySummary;
