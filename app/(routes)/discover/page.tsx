"use client";

import axios from "axios";
import { Cpu, DollarSign, Globe, Palette, Star, Tv, ExternalLink, LucideIcon, LucideNewspaper, Volleyball } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image"; // ✅ proper import


interface NewsArticle {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  image: string;
  publishedAt: string;
}

interface Option {
  title: string;
  icon: LucideIcon;
  query: string;
}

const options: Option[] = [
  { title: "Top", icon: Star, query: "breaking" },
  { title: "Tech & Science", icon: Cpu, query: "technology science" },
  { title: "Finance", icon: DollarSign, query: "business finance" },
  { title: "Arts", icon: Palette, query: "entertainment arts" },
  { title: "Sports", icon: Volleyball, query: "sports" },
  { title: "Entertainment", icon: Tv, query: "entertainment" },
];

function Discover() {
  const [selectedOption, setSelectedOption] = useState<string>("Top");
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const GetSearchResult = async () => {
    setLoading(true);
    try {
      const currentOption = options.find(opt => opt.title === selectedOption);
      
      const result = await axios.post("/api/gnews-api", {
        query: currentOption?.query,
        category: selectedOption.toLowerCase()
      });

      console.log(result.data);


      const articles: NewsArticle[] = result.data.articles?.map((item: any) => ({
        title: item.title,
        link: item.url,
        snippet: item.description,
        displayLink: item.source.name,
        image: item.image, 
        publishedAt: item.publishedAt,
      })) || [];

      setLatestNews(articles);
    } catch (err) {
      console.error("Error fetching news:", err);
      setLatestNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOption) {
      GetSearchResult();
    }
  }, [selectedOption]);

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mt-15 mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 mb-6">
            <LucideNewspaper width={40} height={40}/>
            <div>
              <h1 className="font-bold text-6xl text-gray-900">Discover</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(option.title)}
                className={`flex items-center justify-center gap-2 px-5 py-1 hover:text-gray-700 rounded-full ${
                  selectedOption === option.title && "bg-black text-white hover:text-white"
                    
                }`}
              >
                <option.icon className="w-4 h-4" />
                <span className="text-sm">{option.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="ml-30 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
          </div>
        ) : latestNews.length > 0 ? (
          <>
            {/* FEATURED ARTICLE */}
            <div className="overflow-hidden mb-12 mr-10">
              <div className="grid md:grid-cols-5 gap-0">
                <div className="md:col-span-3 relative h-96 md:h-auto">
                  <Image
                    src={latestNews[0].image}
                    alt={latestNews[0].title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wide">
                      Featured
                    </span>
                  </div>
                </div>  
                <div className="md:col-span-2 p-8 flex flex-col justify-center">
                  <div className="text-xs text-accent-foreground font-semibold uppercase tracking-wider mb-3">
                    {latestNews[0].displayLink}
                  </div>
                  <a
                    href={latestNews[0].link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <h2 className="text-3xl font-bold text-gray-900 leading-tight mb-4 group-hover:text-gray-600 transition-colors duration-200">
                      {latestNews[0].title}
                    </h2>
                  </a>
                  <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                    {latestNews[0].snippet}
                  </p>
                  <a
                    href={latestNews[0].link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all duration-200"
                  >
                    Read Full Story
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* SECONDARY STORIES - 2 COLUMN GRID */}
            {latestNews.length > 3 && (
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {latestNews.slice(1, 3).map((news, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="relative h-64">
                      <Image
                        src={news.image}
                        alt={news.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-2">
                        {news.displayLink}
                      </div>
                      <a
                        href={news.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                      >
                        <h3 className="text-xl font-bold text-gray-900 leading-tight mb-3 group-hover:text-blue-600 transition-colors duration-200">
                          {news.title}
                        </h3>
                      </a>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                        {news.snippet}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ADDITIONAL STORIES - 3 COLUMN GRID */}
            {latestNews.length > 3 && (
              <>
                <div className="border-t border-gray-300 mb-8"></div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">More Stories</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {latestNews.slice(3).map((news, i) => (
                    <article
                      key={i}
                      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100"
                    >
                      <div className="relative h-48">
                        <Image
                          src={news.image}
                          alt={news.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-5">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                          {news.displayLink}
                        </div>
                        <a
                          href={news.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group"
                        >
                          <h4 className="text-base font-bold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                            {news.title}
                          </h4>
                        </a>
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                          {news.snippet}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No news articles found. Try selecting a different category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Discover;