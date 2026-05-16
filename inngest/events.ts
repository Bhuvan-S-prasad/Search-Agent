// ─── Shared Types (used by both Inngest deep-research and direct API routes) ──

export type SearchResultItem = {
    title?: string;
    link?: string;
    url?: string;
    snippet?: string;
    description?: string;
    content?: string;
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
export const DEEP_RESEARCH_EVENT = "deep-research" as const;
