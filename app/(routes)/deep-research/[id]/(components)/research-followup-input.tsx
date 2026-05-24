"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Loader2, Atom } from "lucide-react";

interface ResearchFollowupInputProps {
    disabled: boolean;
    onSubmit: (query: string) => Promise<void>;
    isProcessing: boolean;
}

export default function ResearchFollowupInput({
    disabled,
    onSubmit,
    isProcessing,
}: ResearchFollowupInputProps) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
        }
    }, [input]);

    const handleSubmit = async () => {
        if (!input.trim() || disabled || isProcessing) return;
        const query = input.trim();
        setInput("");
        await onSubmit(query);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const isDisabled = disabled || isProcessing;

    return (
        <div className="bg-white w-[calc(100%-2rem)] md:w-full shadow-lg border border-gray-200/60 fixed bottom-6 left-1/2 -translate-x-1/2 rounded-2xl max-w-md lg:max-w-xl xl:max-w-2xl z-50 flex flex-col overflow-hidden">
            <textarea
                ref={textareaRef}
                placeholder={
                    isDisabled
                        ? "Waiting for research to complete..."
                        : "Ask a follow-up or start new research..."
                }
                className="outline-none w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] text-gray-800 placeholder:text-gray-400 leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isDisabled}
                rows={1}
                style={{ minHeight: "40px", maxHeight: "160px" }}
            />
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
                <div className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gray-100/80 text-xs font-medium text-gray-600">
                    <Atom className="w-3.5 h-3.5" />
                    <span>Deep Research</span>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={!input.trim() || isDisabled}
                    size="sm"
                    className="rounded-xl h-8 w-8 p-0 bg-black hover:bg-gray-800 text-white transition-all disabled:opacity-30"
                >
                    {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <SendHorizonal className="w-4 h-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
