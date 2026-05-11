"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Atom, SearchCheck, Sparkles } from "lucide-react";
import Image from "next/image";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/services/supabase";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
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
    setLoading(true);

    if (searchType === "DeepSearch") {
      // For DeepSearch, create a library entry and start research
      try {
        const response = await fetch("/api/deep-research/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: userSearchInput,
            userId: user?.id || "",
            userEmail: user?.primaryEmailAddress?.emailAddress || "",
          }),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          console.error(
            "Failed to start deep research:",
            errorData.error || "Unknown error",
          );
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data.chatId) {
          // Route to deep-research page with chatId (which is the libId)
          router.push(`/deep-research/${data.chatId}`);
        } else {
          console.error(
            "Failed to start deep research: No chatId in response",
            data,
          );
          setLoading(false);
        }
      } catch (error) {
        console.error("Error starting deep research:", error);
        setLoading(false);
      }
    } else {
      // Regular search flow
      const libid = uuidv4();

      const { error } = await supabase
        .from("Library")
        .insert([
          {
            searchInput: userSearchInput,
            userEmail: user?.primaryEmailAddress?.emailAddress,
            type: searchType,
            libId: libid,
          },
        ])
        .select();
      setLoading(false);

      if (error) {
        console.error("Error creating library entry:", error);
        return;
      }

      router.push(`/search/${libid}?model=${encodeURIComponent(selectedModel)}`);
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
    <div className="flex flex-col items-center justify-center min-h-screen w-full pl-20 py-8">
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

      <div className="w-full max-w-2xl mt-8 border rounded-2xl p-5 bg-white">
        <div className="w-full">
          <textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={userSearchInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full outline-none resize-none overflow-y-auto min-h-7 bg-transparent text-base"
            rows={1}
          />
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-none">
          <div className="flex items-center gap-2">
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

          <div className="flex gap-2 items-center">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px] h-9 border-none shadow-none hover:bg-gray-100 transition-colors focus:ring-0 focus:ring-offset-0">
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
              disabled={loading || !userSearchInput.trim()}
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
