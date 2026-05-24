"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Atom, SearchCheck, Sparkles, Loader2 } from "lucide-react";
import Image from "next/image";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AIModelsOptions, DEFAULT_MODEL } from "@/services/Shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InputBox() {
  const [userSearchInput, setUserSearchInput] = useState<string>("");
  const { user } = useUser();
  const [searchType, setSearchType] = useState<"Search" | "DeepSearch">(
    "Search",
  );
  const [loading, setLoading] = useState(false);
  const [triageState, setTriageState] = useState<"idle" | "triaging" | "chat_detected">("idle");
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [userSearchInput]);

  const onSearchQuery = async () => {
    if (loading || triageState === "triaging") return;
    setLoading(true);
    setTriageState("idle");

    try {
      if (searchType === "DeepSearch") {
        // Step 1: Classify intent via deep research triage
        setTriageState("triaging");
        let intent = "research";
        try {
          const triageRes = await axios.post("/api/deep-research/triage", {
            query: userSearchInput,
          });
          intent = triageRes.data.intent;
        } catch (triageError) {
          // If triage fails, default to research (safer to over-research)
          console.warn("Triage failed, defaulting to research:", triageError);
          toast.error("Analysis failed. Defaulting to full research.");
        }
        setTriageState("idle");

        if (intent === "chat") {
          // Not a research query — show message and reset
          setTriageState("chat_detected");
          setLoading(false);
          toast.info("Doesn't look like a research query", {
            description: "Try a more specific topic like 'compare renewable energy sources'.",
          });
          // Auto-clear the message after 4 seconds
          setTimeout(() => setTriageState("idle"), 4000);
          return;
        }

        // Step 2: Intent is "research" — start deep research pipeline
        const response = await axios.post("/api/deep-research/start", {
          query: userSearchInput,
        });

        if (response.data.chatId) {
          router.push(`/deep-research/${response.data.chatId}`);
        } else {
          console.error("Failed to start deep research: No chatId in response");
          setLoading(false);
        }
      } else {
        // Regular search flow via secure API
        const response = await axios.post("/api/search/create", {
          searchInput: userSearchInput,
          type: searchType,
        });

        if (response.data) {
          router.push(`/search/${response.data.libId}?model=${encodeURIComponent(selectedModel)}`);
        }
      }
    } catch (error) {
      console.error("Error during search query:", error);
      setTriageState("idle");
      setLoading(false);
    }
  };


  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (userSearchInput.trim()) {
        onSearchQuery();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserSearchInput(e.target.value);
  };

  const placeholder =
    searchType === "Search" ? "Search with NOMI" : "Deep Research Agent";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full pl-0 md:pl-20 px-4 md:px-0 py-8 max-md:pt-20">
      <div className="mb-8 relative group cursor-default">
        <div className="absolute inset-0 bg-linear-to-r from-gray-200 to-gray-100 rounded-full blur-md opacity-50 group-hover:opacity-100 transition duration-500"></div>
        <div className="relative inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 backdrop-blur-xl border border-gray-200 shadow-sm text-sm font-medium transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-md group-hover:bg-white/90">
          <Sparkles className="h-4 w-4 text-gray-700" />
          <span className="bg-linear-to-br from-gray-900 to-gray-500 bg-clip-text text-transparent font-semibold tracking-wide">
            LLM Council Coming Soon
          </span>
        </div>
      </div>
      <Image src={"/logo.png"} alt="logo" width={250} height={250} />

      <div className="w-full max-w-2xl mt-8 border rounded-2xl p-5 bg-white shadow-xs">
        <div className="w-full">
          <textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={userSearchInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full outline-none resize-none overflow-y-auto min-h-7 bg-transparent text-base"
            rows={1}
            disabled={triageState === "triaging"}
          />
        </div>

        {/* Triage status messages */}
        {triageState === "triaging" && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Analyzing your query...</span>
          </div>
        )}
        {triageState === "chat_detected" && (
          <div className="mt-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            This doesn&apos;t look like a research query. Try a more specific topic like &quot;explain how transformer models work&quot; or &quot;compare renewable energy sources&quot;.
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-none gap-4">
          <div className="flex items-center gap-2 max-sm:justify-center">
            <button
              onClick={() => setSearchType("Search")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                searchType === "Search"
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <SearchCheck className="h-4 w-4" />
              Search
            </button>
            <button
              onClick={() => setSearchType("DeepSearch")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                searchType === "DeepSearch"
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <Atom className="h-4 w-4" />
              DeepSearch
            </button>
          </div>

          <div className="flex gap-2 items-center max-sm:justify-between w-full sm:w-auto">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px] max-sm:flex-1 h-9 border-none shadow-none hover:bg-gray-100 transition-colors focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                {AIModelsOptions.map((model) => (
                  <SelectItem key={model.ModelApi} value={model.ModelApi}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                if (userSearchInput.trim()) {
                  onSearchQuery();
                }
              }}
              disabled={loading || !userSearchInput.trim() || triageState === "triaging"}
              size="icon"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
