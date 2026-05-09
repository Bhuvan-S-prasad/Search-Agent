export type SearchResultItem = {
    title?: string;
    link?: string;
    url?: string;
    snippet?: string;
    description?: string;
    content?: string;
};

// Event data payload type for "llm-model" event
export type LlmModelEventData = {
    searchInput: string;
    searchResult: SearchResultItem[];
    recordId: number;
    libId: string;
    model?: string;
};

// Full event type for Inngest v3 EventSchemas
export type LlmModelEvent = {
    name: "llm-model";
    data: LlmModelEventData;
};

// Event data payload type for "chat-model" event
export type ChatModelEventData = {
    searchInput: string;
    recordId: number;
    libId: string;
    model?: string;
};

// Full event type for Inngest v3 EventSchemas
export type ChatModelEvent = {
    name: "chat-model";
    data: ChatModelEventData;
};

// ─── Deep Research Event ────────────────────────────────────

// Event data payload type for "deep-research" event
export type DeepResearchEventData = {
    sessionId: string;
    query: string;
    userEmail: string;
    userId: string;
};

// Full event type for Inngest v3 EventSchemas
export type DeepResearchEvent = {
    name: "deep-research";
    data: DeepResearchEventData;
};

// Event name constants
export const LLM_MODEL_EVENT = "llm-model" as const;
export const CHAT_MODEL_EVENT = "chat-model" as const;
export const DEEP_RESEARCH_EVENT = "deep-research" as const;
