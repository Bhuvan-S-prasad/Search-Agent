import AnswerDisplay from "@/app/(components)/answer-display";
import { SEARCH_RESULT } from "@/services/Shared";
import { supabase } from "@/services/supabase";
import axios from "axios";
import { LucideImage, LucideList, LucideSparkles, LucideVideo } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";


interface DisplayResultProps {
    searchInputRecord?: {
        searchInput: string;
        type?: string;
    };
}

const tabs = [
    {label: 'Answer', icon: LucideSparkles},
    {label: 'Images', icon: LucideImage},
    {label: 'Videos', icon: LucideVideo},
    {label: 'Sources', icon: LucideList, badge: 10}
];


function DisplayResult({ searchInputRecord }: DisplayResultProps) {

    const [activeTab, setActiveTab] = useState('Answer');
    // const [searchResult, setSearchResult] = useState(SEARCH_RESULT);
    const { libId } = useParams();

    useEffect(() => {
        searchInputRecord && GetSearchApiResult();
    }, [searchInputRecord])
    
    const GetSearchApiResult = async() => {
        // const result = await axios.post('/api/google-search-api', {
        //     searchInput: searchInputRecord?.searchInput,
        //     searchType: searchInputRecord?.type,
        // });
        // console.log(result.data);
        // console.log(JSON.stringify(result.data, null, 2));

        const searchResp = SEARCH_RESULT    //result.data;
        const formattedSearchResp = searchResp?.items?.map((item: any) => ({
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
        }));
       
        // add data to supabase chats table
        const { data, error } = await supabase
        .from('chats')
        .insert([
            { 
                libId: libId,
                searchResult: formattedSearchResp
             },
        ])
        .select()

        

        const GenerateAIResp = async ( formattedSearchResp: unknown, recordId: unknown) => {
            const result = await axios.post('/api/llm-model', {
                searchInput: searchInputRecord?.searchInput,
                searchResult: formattedSearchResp,
                recordId: recordId,
            });
            console.log(result.data);
        }

        await GenerateAIResp(formattedSearchResp, data?.[0].id)


    }


    return (
        <div className="mt-5">
            <h2 className="font-medium text-3xl line-clamp-2">{searchInputRecord?.searchInput}</h2>
            <div className="flex items-center space-x-6 border-b pt-4 pb-2">
                {tabs.map(({ label, icon: Icon, badge }) => (
                    <button
                        key={label}
                        onClick={() => setActiveTab(label)}
                        className={`flex items-center gap-1 relative text-sm font-medium ${activeTab === label ? 'text-black font-semibold' : 'text-gray-500'}`}>

                        <Icon className="w-5 h-5" />
                        <span>{label}</span>
                        {badge && (
                            <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {badge}
                            </span>

                        )}
                        {activeTab === label && (
                            <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-black rounded">
                            </span>
                        )}
                    </button>
                ))}
                <div className="ml-auto text-sm text-gray-500">
                    1 task <span className="ml-1"> -- </span>
                </div>
            </div>

            <div>
                {activeTab === 'Answer' ? <AnswerDisplay searchResult={SEARCH_RESULT} /> : null}
            </div>

        </div>
    )
}

export default DisplayResult;