import { NextResponse } from "next/server";
import axios from "axios";

interface SearchRequestBody {
  searchInput: string;
  searchType?: string;
}

export async function POST(req: Request) {
  try {
    const { searchInput }: SearchRequestBody = await req.json();

    if (!searchInput) {
      return NextResponse.json(
        { error: "Search input is required" },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_SEARCH_API_KEY || !process.env.CSE_ID) {
      return NextResponse.json(
        { error: "Search API is not configured" },
        { status: 500 }
      );
    }

    const endpoint = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.CSE_ID}&q=${encodeURIComponent(
      searchInput
    )}`;

    const result = await axios.get(endpoint);

    return NextResponse.json(result.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data);
    }
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}