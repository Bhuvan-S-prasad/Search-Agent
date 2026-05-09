import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { llmModel, chatModel } from "@/inngest/functions";
import { deepResearchOrchestrator } from "@/inngest/deep-research/orchestrator";

// Serve all Inngest functions (search, chat, and deep research)
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    llmModel,
    chatModel,
    deepResearchOrchestrator,
  ],
});