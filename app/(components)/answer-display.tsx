import Image from "next/image";

interface SearchItem {
  displayLink?: string;
  link: string;
  title: string;
  snippet: string;
}

interface SearchResult {
  items?: SearchItem[];
}

interface AnswerDisplayProps {
  searchResult?: SearchResult;
}

function AnswerDisplay({ searchResult }: AnswerDisplayProps) {
  const webResults = searchResult?.items;

  if (!webResults || webResults.length === 0) {
    return null; 
  }

  return (
    <div>
      <div className="flex gap-2 flex-wrap mt-5">
        {webResults.map((item, index) => {
          const domain = item?.displayLink?.replace(/^www\./, "") || "unknown.com";
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

          return (
            <div 
              key={item.link || index} 
              className="p-3 bg-accent rounded-lg w-[200px] cursor-pointer hover:bg-sidebar-ring" 
              onClick={() => window.open(item?.link, "_blank")}
            >
              <div className="flex gap-2 items-center">
                <Image
                  src={faviconUrl}
                  alt={domain}
                  width={20}
                  height={20}
                />
                <h2 className="text-xs font-bold">{item?.title}</h2>
              </div>
              <h2 className="line-clamp-2 text-black text-xs">{item?.snippet}</h2>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AnswerDisplay;