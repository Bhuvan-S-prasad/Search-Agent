"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Atom, SearchCheck, Crown, Loader2 } from "lucide-react";
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

type SearchMode = "Search" | "DeepSearch" | "Council";

const SEARCH_MODES: { value: SearchMode; label: string; shortLabel: string; icon: typeof SearchCheck }[] = [
  { value: "Search", label: "Search", shortLabel: "Search", icon: SearchCheck },
  { value: "DeepSearch", label: "Deep Research", shortLabel: "Deep", icon: Atom },
  { value: "Council", label: "Council of NOMI", shortLabel: "Council", icon: Crown },
];

export default function InputBox() {
  const [userSearchInput, setUserSearchInput] = useState<string>("");
  const { user } = useUser();
  const [searchType, setSearchType] = useState<SearchMode>("Search");
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
    if (!user) {
      toast.error("Please sign in to use this feature");
      return;
    }
    if (loading || triageState === "triaging") return;
    setLoading(true);
    setTriageState("idle");

    try {
      if (searchType === "Council") {
        // Step 1: Classify intent via council triage
        setTriageState("triaging");
        let intent = "deliberation";
        try {
          const triageRes = await axios.post("/api/council/triage", {
            query: userSearchInput,
          });
          intent = triageRes.data.intent;
        } catch (triageError) {
          // If triage fails, default to deliberation (safer to deliberate)
          console.warn("Council triage failed, defaulting to deliberation:", triageError);
          toast.error("Analysis failed. Defaulting to full council deliberation.");
        }
        setTriageState("idle");

        if (intent === "chat") {
          // Not a deliberative query — show message and reset
          setTriageState("chat_detected");
          setLoading(false);
          toast.info("Doesn't look like a deliberative query", {
            description: "The Council of NOMI works best with complex questions, debates, comparisons, or analysis.",
          });
          // Auto-clear the message after 4 seconds
          setTimeout(() => setTriageState("idle"), 4000);
          return;
        }

        // Step 2: Intent is "deliberation" — create session and redirect
        const response = await axios.post("/api/council/start", {
          query: userSearchInput,
        });

        if (response.data.sessionId) {
          router.push(`/council/${response.data.sessionId}`);
        } else {
          console.error("Failed to start council: No sessionId in response");
          toast.error("Failed to initiate Council session. Please try again.");
          setTriageState("idle");
          setLoading(false);
        }
      } else if (searchType === "DeepSearch") {
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
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        toast.error("Please sign in to use this feature");
      } else {
        toast.error("An error occurred during search");
      }
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

  const currentMode = SEARCH_MODES.find((m) => m.value === searchType)!;

  const placeholder =
    searchType === "Search"
      ? "Search with NOMI"
      : searchType === "DeepSearch"
        ? "Deep Research Agent"
        : "Ask the Council of NOMI";

  return (
    <div className="flex flex-col items-center justify-center md:justify-center max-md:justify-end min-h-[calc(100vh-3.5rem)] md:min-h-screen w-full px-4 md:px-0 md:pl-20 py-8 max-md:pb-10">
      <div className="hidden md:block mb-4">
        <Image src={"/logo.png"} alt="logo" width={250} height={250} />
      </div>

      <div className="w-full max-w-2xl mt-8 md:mt-8 max-md:mt-0 border rounded-2xl p-4 md:p-5 bg-white shadow-md">
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

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100/60 gap-2">
          {/* Mode Selector Dropdown */}
          <Select value={searchType} onValueChange={(val) => setSearchType(val as SearchMode)}>
            <SelectTrigger className="w-auto h-8 border-none shadow-none hover:bg-gray-100 transition-colors focus:ring-0 focus:ring-offset-0 px-2.5 text-xs shrink-0 flex items-center gap-1.5 rounded-xl bg-primary/5">
              <currentMode.icon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="hidden sm:inline font-medium text-primary">{currentMode.label}</span>
              <span className="inline sm:hidden font-medium text-primary">{currentMode.shortLabel}</span>
            </SelectTrigger>
            <SelectContent align="start">
              {SEARCH_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value} className="text-xs">
                  <div className="flex items-center gap-2">
                    <mode.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{mode.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Model Selector (only for Search mode) & Send */}
          <div className="flex gap-1.5 items-center min-w-0">
            {searchType === "Search" && (
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[105px] sm:w-[150px] h-8 border-none shadow-none hover:bg-gray-100 transition-colors focus:ring-0 focus:ring-offset-0 px-2 text-xs truncate shrink-0 flex items-center justify-between gap-1">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  {AIModelsOptions.map((model) => (
                    <SelectItem key={model.ModelApi} value={model.ModelApi} className="text-xs">
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={() => {
                if (userSearchInput.trim()) {
                  onSearchQuery();
                }
              }}
              disabled={loading || !userSearchInput.trim() || triageState === "triaging"}
              size="icon"
              className="h-8 w-8 rounded-xl shrink-0 flex items-center justify-center"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
