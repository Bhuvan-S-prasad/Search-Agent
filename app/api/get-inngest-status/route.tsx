import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { runId } = await req.json();
    try {
        const result = await axios.get(process.env.INNGEST_SERVER_HOST + '/v1/events/' + runId + '/runs', {
            headers: {
                Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY}`
            }
        });

        return NextResponse.json(result.data);
    } catch (error) {
        console.error("Error fetching Inngest runs:", error);
        return NextResponse.json(
            { error: "Failed to fetch Inngest runs" },
            { status: 500 }
        );
    }
}