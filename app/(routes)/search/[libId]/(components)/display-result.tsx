import AnswerDisplay from "@/app/(components)/answer-display";
import ImageDisplay from "@/app/(components)/images-display";
import SourceListTab from "@/app/(components)/source-list-tab";
import { Button } from "@/components/ui/button";
import axios from "axios";

import {
  LucideImage,
  LucideList,
  LucideSparkles,
  SendHorizonalIcon,
  Loader2,
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { AIModelsOptions, DEFAULT_MODEL } from "@/services/Shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Chat {
  id: number;
  libId: string;
  searchResult: FormattedSearchItem[];
  userSearchInput: string;
  aiResponce?: string;
  intent?: string;
}

interface DisplayResultProps {
  searchInputRecord?: {
    searchInput: string;
    type?: string;
    chats?: Chat[];
  };
}

interface SearchItem {
  title?: string;
  snippet?: string;
  displayLink?: string;
  link?: string;
  pagemap?: {
    cse_image?: Array<{ src?: string }>;
    cse_thumbnail?: Array<{ src?: string }>;
  };
}

interface FormattedSearchItem {
  title: string;
  description: string;
  displayLink: string;
  img: string;
  url: string;
  thumbnail: string;
}

interface Tab {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { label: "Answer", icon: LucideSparkles },
  { label: "Images", icon: LucideImage },
  { label: "Sources", icon: LucideList },
];

type LoadingState = "idle" | "planning" | "searching" | "generating";

function DisplayResult({ searchInputRecord }: DisplayResultProps) {
  const [activeTabs, setActiveTabs] = useState<Record<number, string>>({});
  const [searchResult, setSearchResult] = useState(searchInputRecord);
  const [userInput, setUserInput] = useState("");
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [currentQuery, setCurrentQuery] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [streamingChatId, setStreamingChatId] = useState<number | null>(null);
  const isSearchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestChatRef = useRef<HTMLDivElement>(null);
  const loadingDivRef = useRef<HTMLDivElement>(null);
  const previousChatCountRef = useRef(0);

  const params = useParams();
  const searchParams = useSearchParams();
  const initialModel = searchParams?.get("model") || DEFAULT_MODEL;
  const [selectedModel, setSelectedModel] = useState<string>(initialModel);
  const libId = params?.libId as string;

  // Helper function to get active tab for a specific chat
  const getActiveTab = (chatId: number) => {
    return activeTabs[chatId] || "Answer";
  };

  // Helper function to set active tab for a specific chat
  const setActiveTabForChat = (chatId: number, tab: string) => {
    setActiveTabs(prev => ({
      ...prev,
      [chatId]: tab
    }));
  };

  // Scroll to latest chat or loading div
  const scrollToLatest = useCallback(() => {
    const targetRef = loadingState !== "idle" ? loadingDivRef : latestChatRef;
    if (targetRef.current) {
      targetRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest"
      });
    }
  }, [loadingState]);

  // Fetch the latest search records from Supabase
  const GetSearchRecords = useCallback(async () => {
    try {
      const response = await axios.get(`/api/search/record?libId=${libId}`);
      const LibraryData = response.data;

      if (LibraryData) {
        console.log("Updated library data:", LibraryData);

        // Check if new chat was added
        const newChatCount = LibraryData.chats?.length || 0;
        const hadNewChat = newChatCount > previousChatCountRef.current;

        setSearchResult(LibraryData);
        previousChatCountRef.current = newChatCount;

        // Scroll to new chat when it arrives
        if (hadNewChat) {
          setTimeout(() => scrollToLatest(), 100);
        }
      }
    } catch (error) {
      console.error("Error in GetSearchRecords:", error);
    }
  }, [libId, scrollToLatest]);

  /**
   * Stream the AI response from /api/llm-model via SSE.
   * Replaces the old Inngest fire-and-forget + polling approach.
   */
  const streamAIResponse = async (
    formattedSearchResp: FormattedSearchItem[],
    recordId: number,
    searchQuery: string,
    intent: string,
  ) => {
    setStreamingChatId(recordId);
    setStreamingText("");

    // Create an AbortController so we can cancel if the component unmounts
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/llm-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchInput: searchQuery,
          searchResult: formattedSearchResp,
          recordId,
          libId,
          intent,
          model: selectedModel,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));

            if (data.done) {
              // Stream complete — refresh from DB to get the saved version
              await GetSearchRecords();
              break;
            }

            if (data.token) {
              accumulated += data.token;
              setStreamingText(accumulated);
            }

            if (data.error) {
              console.error("Stream error:", data.error);
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Stream aborted");
      } else {
        console.error("Error streaming AI response:", error);
        // Try to fetch whatever was saved
        await GetSearchRecords();
      }
    } finally {
      setStreamingChatId(null);
      setStreamingText("");
      setLoadingState("idle");
      setCurrentQuery("");
      abortControllerRef.current = null;
    }
  };


  // Main function to get search results and trigger AI response
  const GetSearchApiResult = async (customInput?: string) => {
      // Determine which search query to use
      const searchQuery = customInput || userInput || searchInputRecord?.searchInput;

      if (!searchQuery || isSearchingRef.current) {
        console.log("Skipping search - already in progress or no input");
        return;
      }

      isSearchingRef.current = true;
      setLoadingState("planning");
      setCurrentQuery(searchQuery);
      console.log("Starting plan for:", searchQuery);

      // Scroll to loading div immediately
      setTimeout(() => scrollToLatest(), 100);

      try {
        // Step 1: Combined triage + query planning (single LLM call)
        const planRes = await axios.post("/api/plan", { 
          query: searchQuery, 
          model: selectedModel,
          libId: libId
        });
        const { intent, queries: rawQueries } = planRes.data;
        // Fallback to original query if plan returned no queries
        const searchQueries = (rawQueries && rawQueries.length > 0) ? rawQueries : [searchQuery];
        console.log("Plan result — intent:", intent, "queries:", searchQueries);

        if (intent === "chat") {
          // Chat Flow: Skip search, insert empty results via API
          const chatRes = await axios.post("/api/search/chat", {
            libId: libId,
            searchResult: [],
            userSearchInput: searchQuery,
            intent: "chat"
          });

          if (chatRes.status !== 200) {
            console.error("Error inserting chat");
            isSearchingRef.current = false;
            setLoadingState("idle");
            return;
          }

          const data = chatRes.data;

          setUserInput("");
          setLoadingState("generating");
          await GetSearchRecords();

          if (data && data[0]?.id) {
            await streamAIResponse([], data[0].id, searchQuery, "chat");
          }
        } else {
          // Search Flow: Execute planned queries
          setLoadingState("searching");
          // Get search results from Google API (parallel)
          const result = await axios.post("/api/google-search-api", {
            searchInputs: searchQueries,
            searchType: searchInputRecord?.type ?? "Search",
          });

          const searchResp = result.data;

          // Format the search results
          const formattedSearchResp: FormattedSearchItem[] =
            searchResp?.items?.map((item: SearchItem) => ({
              title: item?.title || "",
              description: item?.snippet || "",
              displayLink: item?.displayLink || "",
              img:
                item?.pagemap?.cse_image?.[0]?.src ||
                item?.pagemap?.cse_thumbnail?.[0]?.src ||
                `https://www.google.com/s2/favicons?domain=${item?.displayLink}&sz=64`,
              url: item?.link || "",
              thumbnail:
                item?.pagemap?.cse_thumbnail?.[0]?.src ||
                `https://www.google.com/s2/favicons?domain=${item?.displayLink}&sz=64`,
            })) || [];

          // Insert search results into Supabase via API
          const chatRes = await axios.post("/api/search/chat", {
            libId: libId,
            searchResult: formattedSearchResp,
            userSearchInput: searchQuery,
            intent: "search"
          });

          if (chatRes.status !== 200) {
            console.error("Error inserting chat");
            isSearchingRef.current = false;
            setLoadingState("idle");
            return;
          }

          const data = chatRes.data;

          // Clear user input after successful search
          setUserInput("");

          // Change state to generating — users can now see search results!
          setLoadingState("generating");

          // Refresh the UI with the new chat record (shows Sources/Images tabs)
          await GetSearchRecords();

          // Stream AI response directly (no Inngest, no polling!)
          if (data && data[0]?.id) {
            await streamAIResponse(formattedSearchResp, data[0].id, searchQuery, "search");
          }
        }
      } catch (error) {
        console.error("Error in GetSearchApiResult:", error);
        setLoadingState("idle");
      } finally {
        isSearchingRef.current = false;
      }
    };

  // Handle search button click
  const handleSearch = () => {
    if (userInput.trim()) {
      GetSearchApiResult(userInput.trim());
    }
  };


  // Initialize component — fetch results or trigger new search
  useEffect(() => {
    // Initialize previous chat count
    previousChatCountRef.current = searchInputRecord?.chats?.length || 0;

    if (searchInputRecord?.chats?.length === 0) {
      GetSearchApiResult();
    } else {
      GetSearchRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInputRecord?.searchInput]);

  // Cleanup on unmount — abort any active stream
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Pulsating loader for Answer tab only
  const AnswerLoadingPlaceholder = () => (
    <div className="mt-6 space-y-4">
      {/* Animated text generation effect */}
      <div className="space-y-3">
        <div className="h-4 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-full bg-size-[200%_100%]"></div>
        <div className="h-4 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-11/12 bg-size-[200%_100%]" style={{ animationDelay: '0.1s' }}></div>
        <div className="h-4 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-10/12 bg-size-[200%_100%]" style={{ animationDelay: '0.2s' }}></div>
      </div>

      <div className="space-y-3 mt-6">
        <div className="h-4 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-full bg-size-[200%_100%]" style={{ animationDelay: '0.3s' }}></div>
        <div className="h-4 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-9/12 bg-size-[200%_100%]" style={{ animationDelay: '0.4s' }}></div>
      </div>

      <div className="space-y-3 mt-6">
        <div className="h-4 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-full bg-size-[200%_100%]" style={{ animationDelay: '0.5s' }}></div>
        <div className="h-4 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-10/12 bg-size-[200%_100%]" style={{ animationDelay: '0.6s' }}></div>
        <div className="h-4 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-8/12 bg-size-[200%_100%]" style={{ animationDelay: '0.7s' }}></div>
      </div>

      {/* Source cards skeleton */}
      <div className="mt-8 space-y-3">
        <div className="h-6 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-32 bg-size-[200%_100%]"></div>
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2 bg-white">
              <div className="h-5 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-3/4 bg-size-[200%_100%]" style={{ animationDelay: `${0.8 + i * 0.1}s` }}></div>
              <div className="h-3 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-full bg-size-[200%_100%]" style={{ animationDelay: `${0.9 + i * 0.1}s` }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Full page loader only for initial search
  const SearchingLoader = () => (
    <div className="mt-7" ref={loadingDivRef}>
      <div className="flex items-center gap-2 mb-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
        <h2 className="font-bold text-3xl line-clamp-2">{currentQuery}</h2>
      </div>

      <div className="flex items-center space-x-6 border-b pt-4 pb-2">
        {tabs.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-1 relative text-sm font-medium text-gray-400"
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </div>
        ))}
        <div className="ml-auto text-sm text-gray-600 font-medium flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingState === "planning" && "Planning search..."}
          {loadingState === "searching" && "Searching the web..."}
          {loadingState === "generating" && "Generating answer..."}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-3">
          <div className="h-4 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-full bg-size-[200%_100%]"></div>
          <div className="h-4 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-11/12 bg-size-[200%_100%]"></div>
          <div className="h-4 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse w-10/12 bg-size-[200%_100%]"></div>
        </div>
      </div>
      <hr className="my-5" />
    </div>
  );

  // Check if the latest chat is actively streaming
  const isLatestChatStreaming = streamingChatId !== null &&
    searchResult?.chats &&
    (searchResult.chats?.length ?? 0) > 0 &&
    searchResult.chats[(searchResult.chats.length ?? 0) - 1]?.id === streamingChatId;

  // Check if the latest chat is still generating (waiting for stream to start or no response yet)
  const isLatestChatGenerating = loadingState === "generating" &&
    searchResult?.chats &&
    (searchResult.chats?.length ?? 0) > 0 &&
    !searchResult.chats?.[(searchResult.chats?.length ?? 0) - 1]?.aiResponce &&
    !isLatestChatStreaming;

  return (
    <div className="mt-20 mx-auto max-w-2xl xl:max-w-3xl px-6 md:px-10 pb-32">
      {/* Render existing chats */}
      {searchResult?.chats?.map((chat, index) => {
        const isLatestChat = index === (searchResult.chats?.length ?? 0) - 1;
        const isThisChatStreaming = isLatestChat && isLatestChatStreaming;
        const showGeneratingState = isLatestChat && isLatestChatGenerating;
        const chatActiveTab = getActiveTab(chat.id);

        // For the streaming chat, override the aiResponce with streaming text
        const displayChat = isThisChatStreaming
          ? { ...chat, aiResponce: streamingText }
          : chat;

        return (
          <div
            key={chat.id || index}
            className="mt-7"
            ref={isLatestChat ? latestChatRef : null}
          >
            <h2 className="font-bold text-3xl line-clamp-2">
              {chat.userSearchInput || searchResult?.searchInput}
            </h2>
            <div className="flex items-center space-x-6 border-b pt-4 pb-2">
              {chat.intent !== "chat" && tabs.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setActiveTabForChat(chat.id, label)}
                  className={`flex items-center gap-1 relative text-sm font-medium ${chatActiveTab === label
                    ? "text-black font-semibold"
                    : "text-gray-500"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                  {chatActiveTab === label && (
                    <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-black rounded"></span>
                  )}
                </button>
              ))}
              
              {chat.intent === "chat" && (
                <div className="flex items-center gap-1 relative text-sm text-black font-semibold">
                  <LucideSparkles className="w-5 h-5" />
                  <span>Chat</span>
                  <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-black rounded"></span>
                </div>
              )}

              {(showGeneratingState || isThisChatStreaming) && (
                <div className="ml-auto text-sm text-blue-600 font-medium flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isThisChatStreaming ? "Streaming response..." : "Generating response..."}
                </div>
              )}
              {!showGeneratingState && !isThisChatStreaming && chat.intent !== "chat" && (
                <div className="ml-auto text-sm text-gray-500">
                  {/* 1 task <span className="ml-1"> -- </span> */}
                </div>
              )}
            </div>

            <div>
              {chatActiveTab === "Answer" && (
                <>
                  {showGeneratingState ? (
                    <AnswerLoadingPlaceholder />
                  ) : (
                    <AnswerDisplay chat={displayChat} />
                  )}
                </>
              )}
              {chatActiveTab === "Images" && <ImageDisplay chat={chat} />}
              {chatActiveTab === "Sources" && <SourceListTab chat={chat} />}
            </div>
            <hr className="my-5" />
          </div>
        );
      })}

      {/* Show full page loader only during initial search */}
      {["planning", "searching"].includes(loadingState) && <SearchingLoader />}

      <div className="bg-white w-full shadow-lg border border-gray-200/60 fixed bottom-6 left-1/2 -translate-x-1/2 rounded-2xl max-w-md lg:max-w-xl xl:max-w-2xl z-50 flex flex-col overflow-hidden">
        <textarea
          placeholder="Ask follow-up..."
          className="outline-none w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] text-gray-800 placeholder:text-gray-400 leading-relaxed"
          value={userInput}
          onChange={(e) => {
            setUserInput(e.target.value);
            // Auto-resize: reset height then set to scrollHeight
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (userInput.trim() && loadingState === "idle") {
                handleSearch();
              }
            }
          }}
          disabled={loadingState !== "idle"}
          rows={1}
          style={{ minHeight: "40px", maxHeight: "160px" }}
        />
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="h-8 w-auto gap-1.5 border-0 shadow-none bg-gray-100/80 hover:bg-gray-200/80 rounded-lg px-3 text-xs font-medium text-gray-600 focus:ring-0 transition-colors">
              <SelectValue placeholder="Model" />
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
            onClick={handleSearch}
            disabled={!userInput.trim() || loadingState !== "idle"}
            size="sm"
            className="rounded-xl h-8 w-8 p-0 bg-black hover:bg-gray-800 text-white transition-all disabled:opacity-30"
          >
            {loadingState !== "idle" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SendHorizonalIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DisplayResult;