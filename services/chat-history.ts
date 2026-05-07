import { supabaseAdmin as supabase } from "./supabaseAdmin";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Fetches recent chat history for a given libId from Supabase.
 */
export async function getRecentHistory(libId: string, limit: number = 15): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from("chats")
      .select("userSearchInput, aiResponce, created_at")
      .eq("libId", libId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching chat history:", error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Reverse to get chronological order (oldest to newest)
    const history = data.reverse().flatMap((chat) => {
      const messages: ChatMessage[] = [];
      if (chat.userSearchInput) {
        messages.push({ role: "user", content: chat.userSearchInput });
      }
      if (chat.aiResponce) {
        messages.push({ role: "assistant", content: chat.aiResponce });
      }
      return messages;
    });

    return history;
  } catch (error) {
    console.error("Unexpected error in getRecentHistory:", error);
    return [];
  }
}

/**
 * Formats chat history into a string for inclusion in a system prompt.
 */
export function formatHistoryForPrompt(history: ChatMessage[]): string {
  if (history.length === 0) return "";
  
  return history
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n");
}
