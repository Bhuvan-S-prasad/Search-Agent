"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";
import { Image, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";

interface DisplaySummaryProps {
  aiResponce?: string;
  searchResult?: Array<{
    title?: string;
    url?: string;
    description?: string;
    name?: string;
  }>;
}

function DisplaySummary({ aiResponce, searchResult = [] }: DisplaySummaryProps) {
  const [hoveredCitation, setHoveredCitation] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  if (!aiResponce) {
    return (
      <div>
        <div>no summary</div>
      </div>
    );
  }

  // Extract domain name from URL for display
  const getDomainName = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      // Capitalize first letter
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return 'Source';
    }
  };

  // Pre-process the markdown to replace [1], [2] etc with custom citation components
  const processedContent = useMemo(() => {
    return aiResponce.replace(/\[(\d+(?:,\s*\d+)*)\]/g, (match, nums) => {
      const citationNums = nums.split(',').map((n: string) => parseInt(n.trim()));
      const sourceNames = citationNums.map((num: number) => {
        const source = searchResult[num - 1];
        return source?.name || getDomainName(source?.url || '');
      }).join(', ');
      
      // Return a custom marker that we'll replace with React components
      return `<cite data-citations="${nums}">${sourceNames}</cite>`;
    });
  }, [aiResponce, searchResult]);

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none text-[15px] leading-relaxed text-justify">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ ...props }) => (
            <h1
              className="text-2xl font-bold border-b pb-1 mb-3 mt-6 text-gray-900 dark:text-gray-100"
              {...props}
            />
          ),
          h2: ({ ...props }) => (
            <h2
              className="text-xl font-semibold border-l-4 border-blue-500 pl-3 mt-5 mb-2 text-gray-800 dark:text-gray-100"
              {...props}
            />
          ),
          h3: ({ ...props }) => (
            <h3
              className="text-lg font-medium mt-3 mb-2 text-gray-800 dark:text-gray-200"
              {...props}
            />
          ),
          p: ({ ...props }) => (
            <p className="mb-3 text-gray-700 dark:text-gray-300" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul
              className="list-disc list-inside space-y-1 ml-2 text-gray-700 dark:text-gray-300"
              {...props}
            />
          ),
          ol: ({ ...props }) => (
            <ol
              className="list-decimal list-inside space-y-1 ml-2 text-gray-700 dark:text-gray-300"
              {...props}
            />
          ),
          li: ({ ...props }) => (
            <li className="ml-4 leading-snug" {...props} />
          ),
          a: ({ ...props }) => (
            <a
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              className="border-l-4 border-gray-400 pl-4 italic text-gray-600 dark:text-gray-400 my-3"
              {...props}
            />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-4">
              <table
                className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm"
                {...props}
              />
            </div>
          ),
          thead: ({ ...props }) => (
            <thead className="bg-gray-100 dark:bg-gray-800" {...props} />
          ),
          th: ({ ...props }) => (
            <th
              className="border border-gray-300 dark:border-gray-600 px-3 py-1 text-left font-semibold"
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <td
              className="border border-gray-300 dark:border-gray-600 px-3 py-1"
              {...props}
            />
          ),
          img: ({ ...props }) => (
            <Image
              className="rounded-lg shadow-sm my-3 max-w-full"
              alt={props.alt || ""}
              {...props}
            />
          ),
          code: ({ inline, className, children, ...props }: any) => (
            <code
              className={cn(
                "rounded-md px-1.5 py-0.5 text-sm font-mono bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                !inline && "block p-3 my-2 whitespace-pre overflow-x-auto"
              )}
              {...props}
            >
              {children}
            </code>
          ),
          cite: ({ children, ...props }: any) => {
            const dataCitations = props['data-citations'];
            if (!dataCitations) return <cite {...props}>{children}</cite>;
            
            const citationNums = dataCitations.split(',').map((n: string) => parseInt(n.trim()));
            const firstCitation = citationNums[0];
            
            return (
              <span
                className="relative inline-block mx-0.5"
                onMouseEnter={(e) => {
                  setHoveredCitation(firstCitation);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipPosition({ 
                    x: rect.left + window.scrollX, 
                    y: rect.bottom + window.scrollY + 5 
                  });
                }}
                onMouseLeave={() => setHoveredCitation(null)}
              >
                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer text-xs font-medium px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700 transition-colors">
                  {children}
                </span>
                
                {hoveredCitation === firstCitation && searchResult[firstCitation - 1] && (
                  <div
                    className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-3 max-w-sm pointer-events-none animate-in fade-in duration-200"
                    style={{
                      left: `${tooltipPosition.x}px`,
                      top: `${tooltipPosition.y}px`,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <ExternalLink className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                          {searchResult[firstCitation - 1]?.title || "Source"}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 break-all">
                          {searchResult[firstCitation - 1]?.url}
                        </div>
                        {searchResult[firstCitation - 1]?.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-3">
                            {searchResult[firstCitation - 1]?.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </span>
            );
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

export default DisplaySummary;