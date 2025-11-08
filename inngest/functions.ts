import { inngest } from "./client";
import { supabase } from "@/services/supabase";



export const llmModel = inngest.createFunction(
  {
    id: "llm-model",
  },
  {
    event: "llm-model",
  },
  async ({ event, step }) => {
    const systemPrompt = `
You are a search agent that takes a user's search query and the raw JSON results from a Google Search API response. 
Your task is to synthesize the most relevant and useful information into a clear, well-organized markdown text output similar to Perplexity AI's style.

- Provide a focused summary using headings and bullet points where appropriate.
- Include source references from the JSON results inline or at the end.
- Use concise, readable language designed to directly answer the user's question or provide key insights on the topic.
- Do not simply list results; synthesize and integrate the content into a coherent response.
- Format the output in markdown.

Input:
Search query: ${event.data.searchInput}

Search results (JSON):
${JSON.stringify(event.data.searchResult, null, 2)}
    `;

    const aiResp = await step.run("generate-ai-llm-call", async () => {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" +
          process.env.GEMINI_API_KEY,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: systemPrompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      return await response.json();
    });

    // response to Supabase
    const saveToDb = await step.run("saveToDb", async () => {
      const firstPart = aiResp?.candidates?.[0]?.content?.parts?.[0];
      const aiText = firstPart && "text" in firstPart ? firstPart.text : undefined;

      const { data, error } = await supabase
        .from("chats")
        .update({ aiResponce: aiText })
        .eq("id", event.data.recordId)
        .select();

      if (error) throw error;

      return data;
    });

    return { success: true, data: saveToDb };
  }
);
