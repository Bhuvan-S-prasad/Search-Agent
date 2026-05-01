import { inngest } from "@/inngest/client";
import { LLM_MODEL_EVENT } from "@/inngest/events";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { searchInput, searchResult, recordId } = await req.json();

    const inngestRunId = await inngest.send({
        name: LLM_MODEL_EVENT,
        data: {
            searchInput: searchInput,
            searchResult: searchResult,
            recordId: recordId
        }
    });

    return NextResponse.json(inngestRunId);
}