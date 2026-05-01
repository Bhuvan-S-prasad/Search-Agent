import { Inngest, EventSchemas } from "inngest";
import type { LlmModelEvent, ChatModelEvent } from "./events";

// Define all event types for type safety
type Events = {
    "llm-model": LlmModelEvent;
    "chat-model": ChatModelEvent;
};

// Create a client to send and receive events
export const inngest = new Inngest({ 
    id: "nomi",
    schemas: new EventSchemas().fromRecord<Events>(),
    eventKey: process.env.INNGEST_EVENT_KEY,
    isDev: process.env.NODE_ENV === "development"
});