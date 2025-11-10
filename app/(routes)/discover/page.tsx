"use client";

import axios from "axios";
import { DollarSign, Globe, Palette, Star, Tv, Cloud, TrendingUp, TrendingDown, Volleyball, TvIcon, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

interface NewsArticle {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  image: string;
  publishedAt: string;
}

interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
  };
  current: {
    temp_c: number;
    feelslike_c: number;
    humidity: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
  };
}

interface MarketQuote {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
}

interface Option {
  title: string;
  icon: any;
  query: string;
}

const options: Option[] = [
  { title: "For You", icon: Star, query: "breaking" },
  { title: "Finance", icon: DollarSign, query: "business finance" },
  { title: "Technology", icon: Cpu, query: "technology" },
  { title: "Sports", icon: Volleyball, query: "sports" },
  { title: "Entertainment", icon: TvIcon, query: "entertainment"},
  { title: "Politics", icon: Globe, query: "politics" },
];

// Company names mapping for better display
const COMPANY_NAMES: { [key: string]: string } = {
  "AAPL": "Apple Inc.",
  "MSFT": "Microsoft Corporation",
  "GOOGL": "Alphabet Inc.",
  "AMZN": "Amazon.com Inc.",
  "TSLA": "Tesla Inc.",
};

function Discover() {
  const [selectedOption, setSelectedOption] = useState<string>("For You");
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [markets, setMarkets] = useState<MarketQuote[]>([]);
  const [marketsLoading, setMarketsLoading] = useState<boolean>(true);

  const GetSearchResult = async () => {
    setLoading(true);
    try {
      const currentOption = options.find(opt => opt.title === selectedOption);
      
      const result = await axios.post("/api/gnews-api", {
        query: currentOption?.query,
        category: selectedOption.toLowerCase()
      });

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

  const fetchWeather = async () => {
    try {
      const result = await axios.get("/api/weather-api?city=Mysuru");
      setWeather(result.data);
    } catch (err) {
      console.error("Error fetching weather:", err);
    }
  };

  const fetchMarkets = async () => {
    setMarketsLoading(true);
    try {
      const result = await axios.get("/api/market-api");
      setMarkets(result.data.markets);
    } catch (err) {
      console.error("Error fetching markets:", err);
    } finally {
      setMarketsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOption) {
      GetSearchResult();
    }
  }, [selectedOption]);

  useEffect(() => {
    fetchWeather();
    fetchMarkets();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground ml-25 mt-10">
      {/* HEADER */}
      <div className="border-b border-border">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-16 xl:px-24 py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 lg:mb-8 gap-4">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8" />
              <h1 className="font-bold text-3xl lg:text-4xl">Discover</h1>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {weather && (
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{Math.round(weather.current.temp_c)}°C</span>
                  <span className="text-muted-foreground">{weather.location.name}</span>
                </div>
              )}
              <span className="text-muted-foreground">Now available</span>
            </div>
          </div>

          <div className="flex gap-2 lg:gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(option.title)}
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full hover:bg-sidebar-accent hover:text-slate-600 whitespace-nowrap ${
                  selectedOption === option.title 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background text-foreground border-border hover:border-foreground/50"
                }`}
              >
                <option.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{option.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN GRID LAYOUT */}
      <div className="max-w-[1600px] mx-auto px-8 lg:px-16 xl:px-24 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* LEFT COLUMN - MAIN CONTENT */}
          <div className="lg:col-span-9">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : latestNews.length > 0 ? (
              <div className="space-y-8">
                {/* FEATURED ARTICLE WITH IMAGE */}
                <article className="group cursor-pointer">
                  <a href={latestNews[0].link} target="_blank" rel="noopener noreferrer">
                    <div className="relative h-64 lg:h-80 mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={latestNews[0].image}
                        alt={latestNews[0].title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {latestNews[0].title}
                    </h2>
                    <p className="text-muted-foreground mb-2 line-clamp-2">
                      {latestNews[0].snippet}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{latestNews[0].displayLink}</span>
                    </div>
                  </a>
                </article>

                {/* GRID OF 3 ARTICLES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {latestNews.slice(1, 4).map((news, i) => (
                    <article key={i} className="group cursor-pointer">
                      <a href={news.link} target="_blank" rel="noopener noreferrer">
                        <div className="relative h-40 mb-3 rounded-lg overflow-hidden">
                          <Image
                            src={news.image}
                            alt={news.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h3 className="text-sm font-bold mb-2 line-clamp-3 group-hover:text-primary transition-colors">
                          {news.title}
                        </h3>
                        <div className="text-xs text-muted-foreground">
                          {news.displayLink}
                        </div>
                      </a>
                    </article>
                  ))}
                </div>

                {/* FIRST FULL WIDTH ARTICLE */}
                {latestNews[4] && (
                  <article className="group cursor-pointer border-t border-border pt-6">
                    <a href={latestNews[4].link} target="_blank" rel="noopener noreferrer" className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                      <div className="relative w-full sm:w-48 h-48 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={latestNews[4].image}
                          alt={latestNews[4].title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                          {latestNews[4].title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                          {latestNews[4].snippet}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{latestNews[4].displayLink}</span>
                        </div>
                      </div>
                    </a>
                  </article>
                )}

                {/* ALTERNATING GRID OF 2 AND FULL WIDTH ARTICLES */}
                {latestNews.slice(5).reduce((acc, news, i) => {
                  const position = Math.floor(i / 3);
                  const indexInGroup = i % 3;

                  if (indexInGroup < 2) {
                    // Grid of 2 articles
                    if (indexInGroup === 0) {
                      acc.push(
                        <div key={`grid-${i}`} className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-border pt-6">
                          <article className="group cursor-pointer">
                            <a href={news.link} target="_blank" rel="noopener noreferrer">
                              <div className="relative h-40 mb-3 rounded-lg overflow-hidden">
                                <Image
                                  src={news.image}
                                  alt={news.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <h3 className="text-sm font-bold mb-2 line-clamp-3 group-hover:text-primary transition-colors">
                                {news.title}
                              </h3>
                              <div className="text-xs text-muted-foreground">
                                {news.displayLink}
                              </div>
                            </a>
                          </article>
                          {latestNews[5 + i + 1] && (
                            <article className="group cursor-pointer">
                              <a href={latestNews[5 + i + 1].link} target="_blank" rel="noopener noreferrer">
                                <div className="relative h-40 mb-3 rounded-lg overflow-hidden">
                                  <Image
                                    src={latestNews[5 + i + 1].image}
                                    alt={latestNews[5 + i + 1].title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                                <h3 className="text-sm font-bold mb-2 line-clamp-3 group-hover:text-primary transition-colors">
                                  {latestNews[5 + i + 1].title}
                                </h3>
                                <div className="text-xs text-muted-foreground">
                                  {latestNews[5 + i + 1].displayLink}
                                </div>
                              </a>
                            </article>
                          )}
                        </div>
                      );
                    }
                  } else {
                    // Full width article with alternating image position
                    const imageOnRight = position % 2 === 1;
                    acc.push(
                      <article key={`full-${i}`} className="group cursor-pointer border-t border-border pt-6">
                        <a href={news.link} target="_blank" rel="noopener noreferrer" className={`flex flex-col sm:flex-row gap-4 sm:gap-6 ${imageOnRight ? 'sm:flex-row-reverse' : ''}`}>
                          <div className="relative w-full sm:w-48 h-48 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                              src={news.image}
                              alt={news.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                              {news.title}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                              {news.snippet}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{news.displayLink}</span>
                            </div>
                          </div>
                        </a>
                      </article>
                    );
                  }

                  return acc;
                }, [] as JSX.Element[])}
              </div>
            ) : (
              <div className="text-center py-20">
                <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No articles found</p>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR - COMPACT MARKET SECTION */}
          <div className="lg:col-span-3 space-y-6">
            {/* MARKET OUTLOOK - COMPACT */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-base font-bold mb-3">Market Outlook</h3>
              {marketsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : markets.length > 0 ? (
                <div className="space-y-2">
                  {markets.slice(0, 4).map((market, i) => (
                    <div key={i} className="pb-2 border-b border-border last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium">{market.symbol}</span>
                        <div className="text-right">
                          <div className="text-sm font-bold">${market.price}</div>
                          <div className={`text-xs ${parseFloat(market.change) >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                            {parseFloat(market.change) >= 0 ? '+' : ''}{market.changePercent}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Unable to load market data</p>
              )}
            </div>

            {/* TRENDING COMPANIES - COMPACT */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-base font-bold mb-3">Trending</h3>
              {marketsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : markets.length > 0 ? (
                <div className="space-y-1">
                  {markets.slice(0, 5).map((company, i) => {
                    const isPositive = parseFloat(company.change) >= 0;
                    return (
                      <div key={i} className="flex items-center gap-2 py-1.5 hover:bg-accent/50 transition-colors cursor-pointer rounded px-1">
                        <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {company.symbol.slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {company.symbol}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-xs font-medium flex items-center gap-1 ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                            {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {isPositive ? '+' : ''}{company.changePercent}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Unable to load market data</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Discover;