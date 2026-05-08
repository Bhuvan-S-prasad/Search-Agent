import AnswerDisplay from "@/app/(components)/answer-display";
import ImageDisplay from "@/app/(components)/images-display";
import SourceListTab from "@/app/(components)/source-list-tab";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabase";
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

type LoadingState = "idle" | "triaging" | "planning" | "searching" | "generating";

function DisplayResult({ searchInputRecord }: DisplayResultProps) {
  const [activeTabs, setActiveTabs] = useState<Record<number, string>>({});
  const [searchResult, setSearchResult] = useState(searchInputRecord);
  const [userInput, setUserInput] = useState("");
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [currentQuery, setCurrentQuery] = useState("");
  const isSearchingRef = useRef(false);
  const activeIntervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
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
      const { data: Library, error } = await supabase
        .from("Library")
        .select("*,chats(*)")
        .eq("libId", libId)
        .order('id', { foreignTable: 'chats', ascending: true })

      if (error) {
        console.error("Error fetching library:", JSON.stringify(error, null, 2));
        return;
      }

      if (Library && Library.length > 0) {
        const libval = Library[0];
        console.log("Updated library data:", libval);

        // Check if new chat was added
        const newChatCount = libval.chats?.length || 0;
        const hadNewChat = newChatCount > previousChatCountRef.current;

        setSearchResult(libval);
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

  // Main function to get search results and trigger AI response
  const GetSearchApiResult = async (customInput?: string) => {
      // Determine which search query to use
      const searchQuery = customInput || userInput || searchInputRecord?.searchInput;

      if (!searchQuery || isSearchingRef.current) {
        console.log("Skipping search - already in progress or no input");
        return;
      }

      isSearchingRef.current = true;
      setLoadingState("triaging");
      setCurrentQuery(searchQuery);
      console.log("Starting triage for:", searchQuery);

      // Scroll to loading div immediately
      setTimeout(() => scrollToLatest(), 100);

      try {
        // Step 1: Triage the query intent
        const triageRes = await axios.post("/api/triage", { 
          query: searchQuery, 
          model: selectedModel,
          libId: libId
        });
        const intent = triageRes.data?.intent || "search";
        console.log("Intent classified as:", intent);

        if (intent === "chat") {
          // Chat Flow: Skip search, insert empty results
          const { data, error } = await supabase
            .from("chats")
            .insert([
              {
                libId: libId,
                searchResult: [],
                userSearchInput: searchQuery,
                intent: "chat"
              },
            ])
            .select();

          if (error) {
            console.error("Error inserting chat:", error);
            isSearchingRef.current = false;
            setLoadingState("idle");
            return;
          }

          setUserInput("");
          setLoadingState("generating");
          await GetSearchRecords();

          if (data && data[0]?.id) {
            await GenerateAIResp([], data[0].id, searchQuery, "chat");
          }
        } else {
          // Search Flow: Plan queries and search
          setLoadingState("planning");
          const plannerRes = await axios.post("/api/query-planner", { query: searchQuery, model: selectedModel });
          const searchQueries = plannerRes.data?.queries || [searchQuery];
          console.log("Planned queries:", searchQueries);

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

          // Insert search results into Supabase chats table
          const { data, error } = await supabase
            .from("chats")
            .insert([
              {
                libId: libId,
                searchResult: formattedSearchResp,
                userSearchInput: searchQuery,
                intent: "search"
              },
            ])
            .select();

          if (error) {
            console.error("Error inserting chat:", error);
            isSearchingRef.current = false;
            setLoadingState("idle");
            return;
          }

          // Clear user input after successful search
          setUserInput("");

          // Change state to generating - users can now see search results!
          setLoadingState("generating");

          // Refresh the UI with the new chat record (this shows Sources/Images/Videos tabs)
          await GetSearchRecords();

          // Generate AI response asynchronously (Answer tab will show loading)
          if (data && data[0]?.id) {
            await GenerateAIResp(formattedSearchResp, data[0].id, searchQuery, "search");
          }
        }
      } catch (error) {
        console.error("Error in GetSearchApiResult:", error);
        setLoadingState("idle");
      } finally {
        isSearchingRef.current = false;
      }
    };

  // Generate AI response and poll for completion
  const GenerateAIResp = async (
    formattedSearchResp: FormattedSearchItem[],
    recordId: number,
    searchQuery: string,
    intent: string
  ) => {
    try {
      const result = await axios.post("/api/llm-model", {
        searchInput: searchQuery,
        searchResult: formattedSearchResp,
        recordId: recordId,
        libId: libId,
        intent: intent,
        model: selectedModel
      });

      const runId = result.data;
      console.log("Started AI job with runId:", runId.ids[0]);

      // Poll for AI response completion
      const interval = setInterval(async () => {
        try {
          const runResp = await axios.post("/api/get-inngest-status", {
            runId: runId.ids[0],
          });

          console.log("Job status:", runResp.data);

          if (runResp.data.data[0]?.status === "Completed") {
            console.log("AI response completed");
            activeIntervalsRef.current.delete(interval);
            clearInterval(interval);
            // Update the UI with the new AI response
            await GetSearchRecords();
            setLoadingState("idle");
            setCurrentQuery("");
          }
        } catch (error) {
          console.error("Error checking status:", error);
          activeIntervalsRef.current.delete(interval);
          clearInterval(interval);
          setLoadingState("idle");
          setCurrentQuery("");
        }
      }, 1000);

      // Track the interval
      activeIntervalsRef.current.add(interval);
    } catch (error) {
      console.error("Error in GenerateAIResp:", error);
      setLoadingState("idle");
      setCurrentQuery("");
    }
  };

  // Handle search button click
  const handleSearch = () => {
    if (userInput.trim()) {
      GetSearchApiResult(userInput.trim());
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  // Initialize component - fetch results or trigger new search
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

  // Cleanup intervals on unmount
  useEffect(() => {
    const activeIntervals = activeIntervalsRef.current;
    return () => {
      // Clear all active intervals when component unmounts
      activeIntervals.forEach((interval) => {
        clearInterval(interval);
      });
      activeIntervals.clear();
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
          {loadingState === "triaging" && "Understanding intent..."}
          {loadingState === "planning" && "Planning search queries..."}
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

  // Check if the latest chat is still generating
  const isLatestChatGenerating = loadingState === "generating" &&
    searchResult?.chats &&
    (searchResult.chats?.length ?? 0) > 0 &&
    !searchResult.chats?.[(searchResult.chats?.length ?? 0) - 1]?.aiResponce;

  return (
    <div className="mt-20 mx-auto max-w-2xl xl:max-w-3xl px-6 md:px-10 pb-32">
      {/* Render existing chats */}
      {searchResult?.chats?.map((chat, index) => {
        const isLatestChat = index === (searchResult.chats?.length ?? 0) - 1;
        const showGeneratingState = isLatestChat && isLatestChatGenerating;
        const chatActiveTab = getActiveTab(chat.id);

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

              {showGeneratingState && (
                <div className="ml-auto text-sm text-blue-600 font-medium flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating response...
                </div>
              )}
              {!showGeneratingState && chat.intent !== "chat" && (
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
                    <AnswerDisplay chat={chat} />
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
      {["triaging", "planning", "searching"].includes(loadingState) && <SearchingLoader />}

      <div className="bg-white w-full border-lg shadow-md p-3 px-5 flex justify-between fixed bottom-10 left-1/2 -translate-x-1/2 rounded-2xl max-w-md lg:max-w-xl xl:max-w-2xl z-50">
        <input
          placeholder="ask anything"
          className="outline-none flex-1"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loadingState !== "idle"}
        />
        <div className="flex gap-2 items-center">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[140px] h-9 md:w-[180px]">
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
            onClick={handleSearch}
            disabled={!userInput.trim() || loadingState !== "idle"}
          >
            {loadingState !== "idle" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <SendHorizonalIcon />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DisplayResult;