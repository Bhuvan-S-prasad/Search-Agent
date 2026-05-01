import { NextResponse } from "next/server";
import axios from "axios";

interface SearchRequestBody {
  searchInput?: string;
  searchInputs?: string[];
  searchType?: string;
}

export interface SearchResultItem {
  title?: string;
  snippet?: string;
  displayLink?: string;
  link?: string;
  pagemap?: {
    cse_image?: Array<{ src?: string }>;
    cse_thumbnail?: Array<{ src?: string }>;
  };
  [key: string]: unknown;
}

export async function POST(req: Request) {
  try {
    const body: SearchRequestBody = await req.json();

    // Support both single input and multiple inputs
    const queries =
      body.searchInputs || (body.searchInput ? [body.searchInput] : []);

    if (queries.length === 0) {
      return NextResponse.json(
        { error: "Search input(s) are required" },
        { status: 400 },
      );
    }

    if (!process.env.GOOGLE_SEARCH_API_KEY || !process.env.CSE_ID) {
      return NextResponse.json(
        { error: "Search API is not configured" },
        { status: 500 },
      );
    }

    // Execute all search queries in parallel
    const searchPromises = queries.map((query) => {
      const endpoint = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.CSE_ID}&q=${encodeURIComponent(query)}`;
      return axios.get(endpoint).catch((err) => {
        console.error(`Error searching for query "${query}":`, err.message);
        return { data: { items: [] } };
      });
    });

    const results = await Promise.all(searchPromises);

    // Merge and deduplicate results based on URL
    const allItems: SearchResultItem[] = [];
    const seenUrls = new Set<string>();

    for (const result of results) {
      const items = result.data?.items || [];
      for (const item of items) {
        if (item.link && !seenUrls.has(item.link)) {
          seenUrls.add(item.link);
          allItems.push(item);
        }
      }
    }

    return NextResponse.json({ items: allItems });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data);
    }
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
