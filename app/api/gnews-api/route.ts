import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  query: string;
  category: string;
}

interface GNewsArticle {
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

interface ErrorResponse {
  error: string;
  articles?: never[];
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { query, category } = body;
    
    const apiKey = process.env.GNEWS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured", articles: [] } as ErrorResponse,
        { status: 500 }
      );
    }

    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=10&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`GNews API error: ${response.status}`);
    }
    
    const data: GNewsResponse = await response.json();
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in gnews-api route:", error);
    return NextResponse.json(
      { error: "Failed to fetch news", articles: [] } as ErrorResponse,
      { status: 500 }
    );
  }
}