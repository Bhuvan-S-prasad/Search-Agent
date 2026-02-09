"use client";

import { supabase } from "@/services/supabase";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "./(components)/Header";
import DisplayResult from "./(components)/display-result"; 

function DeepResearchPage() {
  const { libId } = useParams();
  const [searchInputRecord, setSearchInputRecord] = useState<any>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const GetSearchQueryRecord = async () => {
      try {
        setLoading(true);
        
        // Fetch Library record with all associated chats
        // This matches the search feature pattern
        const { data: Library, error } = await supabase
          .from("Library")
          .select("*,chats(*)")
          .eq("libId", libId)
          .order("id", { foreignTable: "chats", ascending: true });

        if (error) {
          console.error("Error fetching library", error);
          return;
        }
        
        if (Library && Library.length > 0) {
          setSearchInputRecord(Library[0]);
        }
      } catch (err) {
        console.error("GetSearchQueryRecord error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (libId) {
      GetSearchQueryRecord();
    }
  }, [libId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <Header searchInputRecord={searchInputRecord} />
      <div className="px-10 md:px-20 lg:px-36 xl:px-56 mt-15">
        <DisplayResult searchInputRecord={searchInputRecord} />
      </div>
    </div>
  );
}

export default DeepResearchPage;