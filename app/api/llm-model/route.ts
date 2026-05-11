import { inngest } from "@/inngest/client";
import { LLM_MODEL_EVENT, CHAT_MODEL_EVENT } from "@/inngest/events";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const { searchInput, searchResult, recordId, libId, intent, model } = await req.json();

    if (intent === "chat") {
        const inngestRunId = await inngest.send({
            name: CHAT_MODEL_EVENT,
            data: {
                searchInput: searchInput,
                recordId: recordId,
                libId: libId,
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
                libId: libId,
                model: model
            }
        });
        return NextResponse.json(inngestRunId);
    }
}

