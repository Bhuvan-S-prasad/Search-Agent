import DisplaySummary from "./display-summary";
import SourceList from "./source-list";

interface SearchItem {
  displayLink?: string;
  link: string;
  title: string;
  snippet: string;
}

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

interface SearchResult {
  items?: SearchItem[];
}

interface AnswerDisplayProps {

  chat?: Chat;

}

function AnswerDisplay({ chat }: AnswerDisplayProps) {
  


  return (
    <div>
      <div className="flex gap-2 flex-wrap mt-5">
        <SourceList webResults={chat?.searchResult}/>
        <DisplaySummary aiResponse={chat?.aiResponce}/>
      </div>
    </div>
  );
}

export default AnswerDisplay;