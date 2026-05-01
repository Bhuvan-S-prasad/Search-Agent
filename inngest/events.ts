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

// Event name constant
export const LLM_MODEL_EVENT = "llm-model" as const;
