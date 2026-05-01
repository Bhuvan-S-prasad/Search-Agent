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
};

// Full event type for Inngest v3 EventSchemas
export type ChatModelEvent = {
    name: "chat-model";
    data: ChatModelEventData;
};

// Event name constants
export const LLM_MODEL_EVENT = "llm-model" as const;
export const CHAT_MODEL_EVENT = "chat-model" as const;
