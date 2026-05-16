import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { deepResearchOrchestrator } from "@/inngest/deep-research/orchestrator";

// Serve only deep research via Inngest
// Search and chat flows now use direct streaming API routes
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    deepResearchOrchestrator,
  ],
});