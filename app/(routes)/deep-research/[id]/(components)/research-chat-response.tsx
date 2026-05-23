"use client";

import DisplaySummary from "@/app/(components)/display-summary";
import { Loader2, MessageSquare } from "lucide-react";

interface ChatFollowUp {
    query: string;
    response: string;
    isStreaming: boolean;
}

interface ResearchChatResponseProps {
    chat: ChatFollowUp;
}

export default function ResearchChatResponse({ chat }: ResearchChatResponseProps) {
    return (
        <div className="mt-8 border-t border-border pt-8">
            {/* User query */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Follow-up</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                    {chat.query}
                </h2>
            </div>

            {/* AI response */}
            {chat.isStreaming && !chat.response && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating response...</span>
                </div>
            )}

            {chat.response && (
                <div className="mb-4">
                    <DisplaySummary
                        aiResponce={chat.response}
                        searchResult={[]}
                    />
                </div>
            )}

            {chat.isStreaming && chat.response && (
                <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.15s" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.3s" }} />
                </div>
            )}
        </div>
    );
}
