import { serve } from "inngest/next";
// Force rebuild
import { inngest } from "../../../inngest/client";
import { deepResearchFunction, llmModel } from "@/inngest/functions";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    llmModel,
    deepResearchFunction
  ],
});