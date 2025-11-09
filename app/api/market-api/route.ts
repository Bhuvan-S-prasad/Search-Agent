import { NextRequest, NextResponse } from "next/server";

interface AlphaVantageQuote {
  "01. symbol": string;
  "05. price": string;
  "09. change": string;
  "10. change percent": string;
}

interface MarketQuote {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
}

interface ErrorResponse {
  error: string;
}

// Popular stock symbols to fetch
const SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"];

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" } as ErrorResponse,
        { status: 500 }
      );
    }

    // Fetch all symbols in parallel
    const promises = SYMBOLS.map(async (symbol) => {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Alpha Vantage API error for ${symbol}: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if we hit rate limit or error
        if (data.Note || data["Error Message"]) {
          console.warn(`Alpha Vantage warning for ${symbol}:`, data.Note || data["Error Message"]);
          return null;
        }
        
        const quote: AlphaVantageQuote = data["Global Quote"];
        
        if (!quote || !quote["01. symbol"]) {
          return null;
        }
        
        // Parse change percent (remove % sign)
        const changePercent = quote["10. change percent"].replace("%", "");
        
        return {
          symbol: quote["01. symbol"],
          price: parseFloat(quote["05. price"]).toFixed(2),
          change: parseFloat(quote["09. change"]).toFixed(2),
          changePercent: parseFloat(changePercent).toFixed(2),
        } as MarketQuote;
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    
    // Filter out null results
    const markets = results.filter((result): result is MarketQuote => result !== null);
    
    if (markets.length === 0) {
      return NextResponse.json(
        { error: "Failed to fetch market data" } as ErrorResponse,
        { status: 500 }
      );
    }
    
    return NextResponse.json({ markets }, { status: 200 });
  } catch (error) {
    console.error("Error in market-api route:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" } as ErrorResponse,
      { status: 500 }
    );
  }
}