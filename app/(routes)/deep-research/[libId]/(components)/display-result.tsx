"use client";

import { Button } from "@/components/ui/button";
import ImageDisplay from "@/app/(components)/images-display";
import SourceListTab from "@/app/(components)/source-list-tab";
import { supabase } from "@/services/supabase";
import axios from "axios";
import {
  LucideList,
  LucideImage,
  LucideSparkles,
  FileText,
  Loader2,
  Search as SearchIcon
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import DeepResearchDisplaySummary from "./DeepResearchDisplaySummary";

/* -----------------------------
   Chat Model (Deep Research)
------------------------------*/
interface Chat {
  id: number;
  libId: string;
  userSearchInput: string;
  searchResult?: any[];
  aiResponce?: string | null;
}

/* --------------------------------
   Library Model with Deep Research fields
---------------------------------*/
interface Library {
  searchInput?: string;
  libId?: string;
  userEmail?: string;
  deepResearchStatus?: "pending" | "researching" | "writing" | "completed";
  deepResearchProgress?: string | null;
  deepResearchReport?: string | null;
  chats?: Chat[];
}

/* --------------------------------
   Props from the server loader
---------------------------------*/
interface DisplayResultProps {
  searchInputRecord?: Library;
}

/* ------------------------------
   UI Tabs
-------------------------------*/
const tabs = [
  { label: "Report", icon: LucideSparkles },
  { label: "Progress", icon: FileText },
  { label: "Sources", icon: LucideList },
  { label: "Images", icon: LucideImage }
];

/* ------------------------------
   Component Starts Here
-------------------------------*/
export default function DisplayResult({ searchInputRecord }: DisplayResultProps) {
  const [activeTabs, setActiveTabs] = useState<Record<number, string>>({});
  const [searchResult, setSearchResult] = useState(searchInputRecord);
  const [userInput, setUserInput] = useState("");
  const [loadingState, setLoadingState] = useState<"idle" | "starting" | "processing">("idle");
  const [currentQuery, setCurrentQuery] = useState("");

  const params = useParams();
  const libId = params?.libId as string;

  const isProcessingRef = useRef(false);
  const latestChatRef = useRef<HTMLDivElement>(null);
  const loadingDivRef = useRef<HTMLDivElement>(null);
  const activeIntervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const previousChatCountRef = useRef(0);

  /* -------------------------------------
     Helper: Tab handling
  --------------------------------------*/
  const getActiveTab = (chatId: number) => activeTabs[chatId] || "Report";
  const setActiveTabForChat = (chatId: number, tab: string) =>
    setActiveTabs((prev) => ({ ...prev, [chatId]: tab }));

  /* -------------------------------------
     Scroll to bottom on new chat or loading
  --------------------------------------*/
  const scrollToLatest = useCallback(() => {
    const target = loadingState !== "idle" ? loadingDivRef : latestChatRef;
    target.current?.scrollIntoView({ behavior: "smooth" });
  }, [loadingState]);

  /* -------------------------------------
     Fetch Library + Chats (Like Search Feature)
  --------------------------------------*/
  const GetResearchRecords = useCallback(async () => {
    const { data: Library } = await supabase
      .from("Library")
      .select("*, chats(*, aiResponce, searchResult)")
      .eq("libId", libId)
      .order("id", { foreignTable: "chats", ascending: true });

    if (!Library?.length) return;

    const lib = Library[0];
    const newChatCount = lib.chats?.length || 0;

    const addedNewChat = newChatCount > previousChatCountRef.current;
    previousChatCountRef.current = newChatCount;

    setSearchResult(lib);

    if (addedNewChat) setTimeout(scrollToLatest, 50);
  }, [libId, scrollToLatest]);

  /* -------------------------------------
     Start Deep Research
     - Pass existing libId for follow-up queries
     - API creates new chat record
  --------------------------------------*/
  const StartDeepResearch = useCallback(
    async (customInput?: string) => {
      const query = customInput || userInput || searchInputRecord?.searchInput;
      if (!query || isProcessingRef.current) return;

      isProcessingRef.current = true;
      setLoadingState("starting");
      setCurrentQuery(query);
      setUserInput(""); // Clear input after submission
      setTimeout(scrollToLatest, 50);

      try {
        // Start backend job - pass libId if it exists (for follow-up queries)
        const resp = await axios.post("/api/deep-research/start", {
          query,
          libId: searchResult?.libId || libId, // Use existing libId for follow-ups
          userEmail: searchInputRecord?.userEmail || null
        });

        const chatId = resp.data?.chatId;

        if (!chatId) {
          isProcessingRef.current = false;
          setLoadingState("idle");
          return;
        }

        // Immediately fetch to show the new chat
        await GetResearchRecords();
        setLoadingState("processing");

        // Polling is now handled by the useEffect hook
      } catch (err) {
        console.error("Start deep research error:", err);
        setLoadingState("idle");
        isProcessingRef.current = false;
      }
    },
    [userInput, libId, searchInputRecord, searchResult, GetResearchRecords, scrollToLatest]
  );

  /* -------------------------------------
     UI Input Handling
  --------------------------------------*/
  const handleSearch = () => userInput.trim() && StartDeepResearch(userInput.trim());
  const handleKeyPress = (e: any) => e.key === "Enter" && !e.shiftKey && handleSearch();

  /* -------------------------------------
     Initial Mount
  --------------------------------------*/
  useEffect(() => {
    previousChatCountRef.current = searchInputRecord?.chats?.length || 0;
    GetResearchRecords();
  }, [GetResearchRecords]);

  /* -------------------------------------
     Realtime updates for Library table (status) and chats table (new queries)
  --------------------------------------*/
  useEffect(() => {
    const channel = supabase
      .channel(`deep-research-${libId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Library",
          filter: `libId=eq.${libId}`
        },
        () => GetResearchRecords()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chats",
          filter: `libId=eq.${libId}`
        },
        () => GetResearchRecords()
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chats",
          filter: `libId=eq.${libId}`
        },
        () => GetResearchRecords()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [libId, GetResearchRecords]);

  /* -------------------------------------
     Persistent Polling for Status
  --------------------------------------*/
  useEffect(() => {
    // Only poll if we have a libId and status is NOT completed
    const shouldPoll =
      libId &&
      searchResult?.deepResearchStatus &&
      searchResult.deepResearchStatus !== "completed";

    if (!shouldPoll) return;

    console.log("Starting persistent polling for:", libId);

    const interval = setInterval(async () => {
      try {
        console.log("Polling...");
        const { data: library } = await supabase
          .from("Library")
          .select("*")
          .eq("libId", libId)
          .single();

        console.log("Polling status:", library?.deepResearchStatus);

        if (library?.deepResearchStatus === "completed") {
          console.log("Research completed (polling), refreshing...");
          clearInterval(interval);
          await GetResearchRecords();
          setLoadingState("idle");
          isProcessingRef.current = false;
        } else {
          // Optional: Update local state if progress changed
          if (library?.deepResearchProgress !== searchResult?.deepResearchProgress) {
            setSearchResult(prev => prev ? ({ ...prev, deepResearchProgress: library.deepResearchProgress }) : prev);
          }
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [libId, searchResult?.deepResearchStatus, searchResult?.deepResearchProgress, GetResearchRecords]);

  /* -------------------------------------
     Clean up intervals
  --------------------------------------*/
  useEffect(() => {
    return () => activeIntervalsRef.current.forEach(clearInterval);
  }, []);

  /* -----------------------------
     Skeletons
  ------------------------------*/
  const ReportLoading = () => (
    <div className="mt-6 space-y-3">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-11/12" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-10/12" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-9/12" />
    </div>
  );

  /* -----------------------------
     RENDER
  ------------------------------*/
  const isJobRunning = loadingState !== "idle" || searchResult?.deepResearchStatus !== "completed";

  return (
    <div className="mt-20 ml-27 mr-10 md:pl-10 pb-32">
      {/* Overall status banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          {isJobRunning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900 capitalize">
                  {searchResult?.deepResearchStatus || "Processing"}
                </p>
                <p className="text-sm text-blue-700">
                  {searchResult?.deepResearchProgress || "Working on your research..."}
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="text-2xl">✓</span>
              <p className="font-semibold text-green-900">Research Complete</p>
            </>
          )}
        </div>
      </div>

      {/* Render chats (just like search feature) */}
      {searchResult?.chats?.map((chat: Chat, index: number) => {
        const isLatest = index === (searchResult.chats?.length || 0) - 1;
        const activeTab = getActiveTab(chat.id);

        return (
          <div key={chat.id} ref={isLatest ? latestChatRef : null} className="mt-7">
            <h2 className="font-bold text-3xl mb-2">{chat.userSearchInput}</h2>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b pt-4 pb-2">
              {tabs.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setActiveTabForChat(chat.id, label)}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors ${activeTab === label
                    ? "text-black font-semibold border-b-2 border-black pb-2"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="mt-4">
              {activeTab === "Report" && (
                isJobRunning && isLatest ? (
                  <ReportLoading />
                ) : chat.aiResponce ? (
                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <DeepResearchDisplaySummary
                      aiResponse={chat.aiResponce}
                      sources={chat.searchResult}
                    />
                  </div>
                ) : (
                  <div className="text-gray-600 p-6 bg-gray-50 rounded-lg">
                    No report available yet.
                  </div>
                )
              )}

              {activeTab === "Progress" && (
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <div className="flex items-start gap-3">
                    {isJobRunning && isLatest && <Loader2 className="w-5 h-5 animate-spin text-blue-600 mt-1" />}
                    <div>
                      <p className="text-gray-700 font-medium mb-2">Current Status:</p>
                      <p className="text-gray-600 capitalize">
                        {searchResult?.deepResearchStatus || "Initializing"}
                      </p>
                      <p className="text-gray-600 mt-2">
                        {searchResult?.deepResearchProgress || "Starting research..."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Sources" && <SourceListTab chat={chat as any} />}
              {activeTab === "Images" && <ImageDisplay chat={chat as any} />}
            </div>

            {index < (searchResult.chats?.length || 0) - 1 && <hr className="my-8" />}
          </div>
        );
      })}

      {/* Loading indicator for new query */}
      {loadingState !== "idle" && (
        <div ref={loadingDivRef} className="mt-7">
          <h2 className="font-bold text-3xl mb-4">{currentQuery}</h2>
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Starting deep research...</span>
          </div>
          <ReportLoading />
        </div>
      )}

      {/* Bottom Input (fixed position) */}
      <div className="bg-white w-full p-3 px-5 flex gap-3 items-center fixed bottom-5 left-1/2 transform -translate-x-1/2 rounded-xl shadow-lg max-w-3xl border">
        <input
          placeholder="Ask a follow-up question or start new research..."
          className="outline-none flex-1 text-sm"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loadingState !== "idle"}
        />
        <Button
          onClick={handleSearch}
          disabled={!userInput.trim() || loadingState !== "idle"}
          size="sm"
        >
          {loadingState !== "idle" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <SearchIcon className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}