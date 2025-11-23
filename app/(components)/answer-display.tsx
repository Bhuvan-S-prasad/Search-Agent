import { useMemo } from "react";
import DisplaySummary from "./display-summary";
import SourceList from "./source-list";

interface FormattedSearchItem {
    title: string;
    description: string;
    displayLink: string;
    img: string;
    url: string;
    thumbnail: string;
}


interface Chat {
    id: number;
    libId: string;
    searchResult: FormattedSearchItem[];
    userSearchInput: string;
    aiResponce?: string;
}
interface AnswerDisplayProps {

  chat?: Chat;

}

function AnswerDisplay({ chat }: AnswerDisplayProps) {
  const stableChat = useMemo(() => chat, [chat?.id]);  
  return (
    <div>
      <div className="flex gap-2 flex-wrap mt-5 pb-8 mb-7">
        <SourceList webResults={stableChat?.searchResult}/>
        <DisplaySummary 
          aiResponce={stableChat?.aiResponce ?? ""} 
          searchResult={stableChat?.searchResult} 
        />
      </div>
    </div>
  );
}

export default AnswerDisplay;
