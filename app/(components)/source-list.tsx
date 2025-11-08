import Image from "next/image";

interface WebResult {
  img: string;
  url: string;
  title: string;
  description: string;
  thumbnail?: string;
}

function SourceList({ webResults = [] }: { webResults?: WebResult[] }) {
  return (
    <div className="flex gap-2 flex-wrap mt-5">
      {webResults.map((item, index) => {
        const faviconUrl = item?.img || item?.thumbnail;
        const domain = item?.url
          ? new URL(item.url).hostname.replace(/^www\./, "")
          : "unknown.com";

        return (
          <div
            key={item.url || index}
            className="p-3 bg-accent rounded-lg w-[200px] cursor-pointer hover:bg-sidebar-ring transition"
            onClick={() => window.open(item.url, "_blank")}
          >
            <div className="flex gap-2 items-center mb-1">
              <Image
                src={faviconUrl}
                alt={domain}
                width={20}
                height={20}
                className="rounded-sm"
              />
              <h2 className="text-xs font-semibold truncate">{domain}</h2>
            </div>
            <h2 className="text-xs font-bold line-clamp-2 mb-1">{item.title}</h2>
            <p className="text-xs text-black line-clamp-2">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
}

export default SourceList;
