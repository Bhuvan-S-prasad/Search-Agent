"use client";

import DisplaySummary from "@/app/(components)/display-summary";
import { ExternalLink, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { CitationEntry } from "@/inngest/deep-research/types";

interface ResearchReportProps {
    report: string;
    citations: CitationEntry[];
}

function ResearchReport({ report, citations }: ResearchReportProps) {
    const [showCitations, setShowCitations] = useState(false);

    // Convert CitationEntry[] to the format DisplaySummary expects
    const searchResultFormat = citations.map((c) => ({
        title: c.title,
        url: c.url,
        description: c.snippet,
        name: c.domain,
        img: c.favicon,
        thumbnail: c.favicon,
    }));

    return (
        <div>
            {/* Report Content — reuses the existing DisplaySummary with citation tooltips */}
            <div className="mb-8">
                <DisplaySummary
                    aiResponce={report}
                    searchResult={searchResultFormat}
                />
            </div>

            {/* Citations / Sources Section */}
            {citations.length > 0 && (
                <div className="border-t border-border pt-6 mt-8">
                    <button
                        onClick={() => setShowCitations(!showCitations)}
                        className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors mb-4"
                    >
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showCitations ? "rotate-90" : ""}`} />
                        <span>Sources ({citations.length})</span>
                    </button>

                    {showCitations && (
                        <div className="grid gap-3">
                            {citations.map((citation) => (
                                <a
                                    key={citation.index}
                                    href={citation.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                                >
                                    <span className="shrink-0 w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                        {citation.index}
                                    </span>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {citation.favicon && (
                                                <Image
                                                    src={citation.favicon}
                                                    alt={citation.domain}
                                                    width={14}
                                                    height={14}
                                                    className="rounded-sm"
                                                    unoptimized
                                                />
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {citation.domain}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                            {citation.title}
                                        </p>
                                        {citation.snippet && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                {citation.snippet}
                                            </p>
                                        )}
                                    </div>

                                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ResearchReport;
