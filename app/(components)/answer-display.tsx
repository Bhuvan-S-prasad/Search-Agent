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
  


  return (
    <div>
      <div className="flex gap-2 flex-wrap mt-5 pb-8">
        <SourceList webResults={chat?.searchResult}/>
        <DisplaySummary aiResponce={chat?.aiResponce}/>
      </div>
    </div>
  );
}

export default AnswerDisplay;