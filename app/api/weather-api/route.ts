import { NextRequest, NextResponse } from "next/server";

interface WeatherResponse {
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

interface ErrorResponse {
  error: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city') || 'Mysuru';
    
    const apiKey = process.env.WEATHER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" } as ErrorResponse,
        { status: 500 }
      );
    }

    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&aqi=no`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data: WeatherResponse = await response.json();
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in weather-api route:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" } as ErrorResponse,
      { status: 500 }
    );
  }
}