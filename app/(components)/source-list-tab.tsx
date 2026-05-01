"use client";

import Image from "next/image";

interface FormattedSearchItem {
  title: string;
  description: string;
  displayLink: string;
  img: string;
  url: string;
  thumbnail: string;
}

interface Chat {
  id: number;
  libId: string;
  searchResult?: FormattedSearchItem[];
  userSearchInput: string;
  aiResponce?: string | null;
}

interface AnswerDisplayProps {
  chat?: Chat;
}

function SourceListTab({ chat }: AnswerDisplayProps) {
  if (!chat?.searchResult?.length) {
    return (
      <div className="text-gray-500 text-sm italic">
        No sources found for this query.
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {chat.searchResult.map((item, index) => {
        const domain =
          item.displayLink?.replace(/^www\./, "") || "Unknown source";
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        return (
          <div
            key={index}
            onClick={() => window.open(item.url, "_blank")}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition cursor-pointer border border-gray-100 dark:border-zinc-700"
          >
            <div className="shrink-0 mt-1">
              <Image
                src={faviconUrl}
                alt={domain}
                width={18}
                height={18}
                className="rounded-sm"
              />
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                {item.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {item.description}
              </p>

              <p className="text-xs text-gray-400 mt-1">{domain}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SourceListTab;
