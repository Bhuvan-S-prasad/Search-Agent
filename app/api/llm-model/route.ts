import { inngest } from "@/inngest/client";
import { LLM_MODEL_EVENT, CHAT_MODEL_EVENT } from "@/inngest/events";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { searchInput, searchResult, recordId, intent, model } = await req.json();

    if (intent === "chat") {
        const inngestRunId = await inngest.send({
            name: CHAT_MODEL_EVENT,
            data: {
                searchInput: searchInput,
                recordId: recordId,
                model: model
            }
        });
        return NextResponse.json(inngestRunId);
    } else {
        const inngestRunId = await inngest.send({
            name: LLM_MODEL_EVENT,
            data: {
                searchInput: searchInput,
                searchResult: searchResult,
                recordId: recordId,
                model: model
            }
        });
        return NextResponse.json(inngestRunId);
    }
}