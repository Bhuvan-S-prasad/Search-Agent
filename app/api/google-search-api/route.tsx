import { NextResponse } from "next/server";
import axios from "axios";

interface SearchRequestBody {
  searchInput: string;
  searchType?: string;
}

export async function POST(req: Request) {
  try {
    const { searchInput }: SearchRequestBody = await req.json();

    const endpoint = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.CSE_ID}&q=${encodeURIComponent(searchInput)}`;

    const result = await axios.get(endpoint);

    return NextResponse.json(result.data); 
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
