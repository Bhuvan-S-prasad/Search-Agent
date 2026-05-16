import { Inngest, EventSchemas } from "inngest";
import type { DeepResearchEvent } from "./events";

// Define event types — only deep research uses Inngest now
type Events = {
    "deep-research": DeepResearchEvent;
};

// Create a client to send and receive events
export const inngest = new Inngest({ 
    id: "nomi",
    schemas: new EventSchemas().fromRecord<Events>(),
    eventKey: process.env.INNGEST_EVENT_KEY,
    isDev: process.env.NODE_ENV === "development"
});