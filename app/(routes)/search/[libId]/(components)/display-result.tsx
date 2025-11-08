import AnswerDisplay from "@/app/(components)/answer-display";
import ImageDisplay from "@/app/(components)/images-display";
import SourceListTab from "@/app/(components)/source-list-tab";
import { supabase } from "@/services/supabase";
import axios from "axios";
import {
  LucideImage,
  LucideList,
  LucideSparkles,
  LucideVideo,
  LucideLoader2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";

interface Chat {
  id: number;
  libId: string;
  searchResult: FormattedSearchItem[];
  userSearchInput: string;
  aiResponce?: string;
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
  { label: "Videos", icon: LucideVideo },
  { label: "Sources", icon: LucideList },
];

function DisplayResult({ searchInputRecord }: DisplayResultProps) {
  const [activeTab, setActiveTab] = useState("Answer");
  const [searchResult, setSearchResult] = useState(searchInputRecord);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<
    "searching" | "generating" | null
  >(null);
  const isSearchingRef = useRef(false);
  const activeIntervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  const params = useParams();
  const libId = params?.libId as string;

  // Fetch the latest search records from Supabase
  const GetSearchRecords = useCallback(async () => {
    try {
      const { data: Library, error } = await supabase
        .from("Library")
        .select("*,chats(*)")
        .eq("libId", libId);

      if (error) {
        console.error("Error fetching library:", error);
        return;
      }

      if (Library && Library.length > 0) {
        const libval = Library[0];
        console.log("Updated library data:", libval);
        setSearchResult(libval);
      }
    } catch (error) {
      console.error("Error in GetSearchRecords:", error);
    }
  }, [libId]);

  // Main function to get search results and trigger AI response
  const GetSearchApiResult = useCallback(async () => {
    if (!searchInputRecord?.searchInput || isSearchingRef.current) {
      console.log("Skipping search - already in progress or no input");
      return;
    }

    isSearchingRef.current = true;
    setIsLoading(true);
    setLoadingStage("searching");
    console.log("Starting search for:", searchInputRecord?.searchInput);

    try {
      // Get search results from Google API
      const result = await axios.post("/api/google-search-api", {
        searchInput: searchInputRecord?.searchInput,
        searchType: searchInputRecord?.type,
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
            userSearchInput: searchInputRecord?.searchInput,
          },
        ])
        .select();

      if (error) {
        console.error("Error inserting chat:", error);
        isSearchingRef.current = false;
        setIsLoading(false);
        setLoadingStage(null);
        return;
      }

      // Refresh the UI with the new chat record
      await GetSearchRecords();

      // Change loading stage to generating AI response
      setLoadingStage("generating");

      // Generate AI response asynchronously
      if (data && data[0]?.id) {
        await GenerateAIResp(formattedSearchResp, data[0].id);
      }
    } catch (error) {
      console.error("Error in GetSearchApiResult:", error);
      setIsLoading(false);
      setLoadingStage(null);
    } finally {
      isSearchingRef.current = false;
    }
  }, [searchInputRecord, libId, GetSearchRecords]);

  // Generate AI response and poll for completion
  const GenerateAIResp = async (
    formattedSearchResp: FormattedSearchItem[],
    recordId: number
  ) => {
    try {
      const result = await axios.post("/api/llm-model", {
        searchInput: searchInputRecord?.searchInput,
        searchResult: formattedSearchResp,
        recordId: recordId,
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
            // Remove loading state when AI response is complete
            setIsLoading(false);
            setLoadingStage(null);
          }
        } catch (error) {
          console.error("Error checking status:", error);
          activeIntervalsRef.current.delete(interval);
          clearInterval(interval);
          setIsLoading(false);
          setLoadingStage(null);
        }
      }, 1000);

      // Track the interval
      activeIntervalsRef.current.add(interval);
    } catch (error) {
      console.error("Error in GenerateAIResp:", error);
      setIsLoading(false);
      setLoadingStage(null);
    }
  };

  // Initialize component - fetch results or trigger new search
  useEffect(() => {
    if (searchInputRecord?.chats?.length === 0) {
      GetSearchApiResult();
    } else {
      GetSearchRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInputRecord?.searchInput]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      // Clear all active intervals when component unmounts
      activeIntervalsRef.current.forEach((interval) => {
        clearInterval(interval);
      });
      activeIntervalsRef.current.clear();
    };
  }, []);

  // Loading UI Component
  const LoadingDisplay = () => (
    <div className="mt-7">
      <h2 className="font-bold text-3xl line-clamp-2">
        {searchInputRecord?.searchInput}
      </h2>

      <div className="flex items-center space-x-6 border-b pt-4 pb-2">
        {tabs.map(({ label, icon: Icon }) => (
          <button
            key={label}
            disabled
            className="flex items-center gap-1 relative text-sm font-medium text-gray-400 cursor-not-allowed"
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
        <div className="ml-auto text-sm text-gray-500">
          <LucideLoader2 className="w-4 h-4 animate-spin inline mr-2" />
          Processing...
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center py-12">
        <LucideLoader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {loadingStage === "searching"
            ? "Searching the web..."
            : "Generating AI response..."}
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-md">
          {loadingStage === "searching"
            ? "Gathering relevant information from across the web"
            : "Analyzing results and crafting a comprehensive answer"}
        </p>

        {/* Loading stages indicator */}
        <div className="mt-6 flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              loadingStage === "searching"
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {loadingStage === "searching" ? (
              <LucideLoader2 className="w-3 h-3 animate-spin" />
            ) : (
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
            )}
            <span>Search</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              loadingStage === "generating"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {loadingStage === "generating" ? (
              <LucideLoader2 className="w-3 h-3 animate-spin" />
            ) : (
              <span className="w-3 h-3 rounded-full bg-gray-300"></span>
            )}
            <span>AI Response</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-5">
      {isLoading ? (
        <LoadingDisplay />
      ) : (
        searchResult?.chats?.map((chat, index) => (
          <div key={chat.id || index} className="mt-7">
            <h2 className="font-bold text-3xl line-clamp-2">
              {searchResult?.searchInput}
            </h2>
            <div className="flex items-center space-x-6 border-b pt-4 pb-2">
              {tabs.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setActiveTab(label)}
                  className={`flex items-center gap-1 relative text-sm font-medium ${
                    activeTab === label
                      ? "text-black font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                  {activeTab === label && (
                    <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-black rounded"></span>
                  )}
                </button>
              ))}
              <div className="ml-auto text-sm text-gray-500">
                1 task <span className="ml-1"> -- </span>
              </div>
            </div>

            <div>
              {activeTab === "Answer" && <AnswerDisplay chat={chat} />}
              {activeTab === "Images" && <ImageDisplay chat={chat} />}
              {activeTab === "Sources" && <SourceListTab chat={chat} />}
            </div>
            <hr className="my-5" />
          </div>
        ))
      )}
    </div>
  );
}

export default DisplayResult;