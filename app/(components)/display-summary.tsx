"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";
import { Image } from "lucide-react";

interface DisplaySummaryProps {
  aiResponse?: string;
}

function DisplaySummary({ aiResponse }: DisplaySummaryProps) {
  if (!aiResponse) {
    return (
      <div className="p-4 text-sm text-gray-500 italic">
        No summary available yet.
      </div>
    );
  }

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none text-[15px] leading-relaxed">
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
          code: ({ inline, className, children, ...props }) => (
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
        }}
      >
        {aiResponse}
      </ReactMarkdown>
    </div>
  );
}

export default DisplaySummary;