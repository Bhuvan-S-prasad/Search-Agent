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

function ImageDisplay({ chat }: AnswerDisplayProps) {
  if (!chat?.searchResult?.length) {
    return (
      <div className="text-gray-500 text-sm italic">
        No image results available.
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Masonry-style layout */}
      <div
        className="
          columns-2 sm:columns-3 lg:columns-4
          gap-3
          [column-fill:_balance]
        "
      >
        {chat.searchResult.map((item, index) => {
          const imageSrc =
            item.thumbnail ||
            (item.url.includes("googleusercontent") ? item.url : item.img) ||
            "/placeholder.png";

          return (
            <div
              key={index}
              className="mb-3 break-inside-avoid cursor-pointer transition-transform hover:scale-[1.02]"
              onClick={() => window.open(item.url, "_blank")}
            >
              <div className="relative w-full rounded-xl overflow-hidden shadow-sm">
                <Image
                  src={imageSrc}
                  alt={item.title || "image"}
                  width={400}
                  height={300}
                  className="rounded-lg object-cover w-full h-auto"
                  unoptimized
                />
              </div>
              <div className="mt-2 px-1">
                <h3 className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                  {item.title}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {item.displayLink.replace(/^www\./, "")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ImageDisplay;
