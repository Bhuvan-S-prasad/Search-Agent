import AnswerDisplay from "@/app/(components)/answer-display";
import ImageDisplay from "@/app/(components)/images-display";
import SourceListTab from "@/app/(components)/source-list-tab";
import { supabase } from "@/services/supabase";
import axios from "axios";
import { LucideImage, LucideList, LucideSparkles, LucideVideo } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

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
    { label: 'Answer', icon: LucideSparkles },
    { label: 'Images', icon: LucideImage },
    { label: 'Videos', icon: LucideVideo },
    { label: 'Sources', icon: LucideList }
];

function DisplayResult({ searchInputRecord }: DisplayResultProps) {
    const [activeTab, setActiveTab] = useState('Answer');
    const params = useParams();
    const libId = params?.libId as string;

    const GetSearchApiResult = useCallback(async () => {
        if (!searchInputRecord?.searchInput) return;

        try {
            const result = await axios.post('/api/google-search-api', {
                searchInput: searchInputRecord?.searchInput,
                searchType: searchInputRecord?.type,
            });

            const searchResp = result.data;

            const formattedSearchResp: FormattedSearchItem[] = searchResp?.items?.map((item: SearchItem) => ({
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

            // Add data to supabase chats table
            const { data, error } = await supabase
                .from('chats')
                .insert([
                    {
                        libId: libId,
                        searchResult: formattedSearchResp,
                        userSearchInput: searchInputRecord?.searchInput
                    },
                ])
                .select();

            if (error) {
                console.error('Error inserting chat:', error);
                return;
            }

            const GenerateAIResp = async (
                formattedSearchResp: FormattedSearchItem[],
                recordId: number
            ) => {
                const result = await axios.post('/api/llm-model', {
                    searchInput: searchInputRecord?.searchInput,
                    searchResult: formattedSearchResp,
                    recordId: recordId,
                });

                const runId = result.data;
                const interval = setInterval(async () => {
                    try {
                        const runResp = await axios.post('/api/get-inngest-status', {
                            runId: runId.ids[0],
                        });
                        console.log(runResp.data);

                        if (runResp.data.data[0]?.status === 'Completed') {
                            console.log('complete');
                            clearInterval(interval);
                        }
                    } catch (error) {
                        console.error('Error checking status:', error);
                        clearInterval(interval);
                    }
                }, 1000);
            };

            if (data && data[0]?.id) {
                await GenerateAIResp(formattedSearchResp, data[0].id);
            }
        } catch (error) {
            console.error('Error in GetSearchApiResult:', error);
        }
    }, [searchInputRecord, libId]);

    useEffect(() => {
        if (searchInputRecord?.chats?.length === 0) {
            GetSearchApiResult();
        }
    }, [searchInputRecord, GetSearchApiResult]);

    return (
        <div className="mt-5">
            {searchInputRecord?.chats?.map((chat, index) => (
                <div key={chat.id || index} className="mt-7">
                    <h2 className="font-bold text-3xl line-clamp-2">
                        {searchInputRecord?.searchInput}
                    </h2>
                    <div className="flex items-center space-x-6 border-b pt-4 pb-2">
                        {tabs.map(({ label, icon: Icon }) => (
                            <button
                                key={label}
                                onClick={() => setActiveTab(label)}
                                className={`flex items-center gap-1 relative text-sm font-medium ${
                                    activeTab === label
                                        ? 'text-black font-semibold'
                                        : 'text-gray-500'
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
                        {activeTab === 'Answer' && (
                            <AnswerDisplay chat={chat} />
                            
                        )}
                        {activeTab === 'Images' && (
                            <ImageDisplay chat={chat}/> 
                        )}
                        {activeTab === 'Sources' && (
                            <SourceListTab chat={chat}/>
                        )}
                    </div>
                    <hr className="my-5" />
                </div>
            ))}
        </div>
    );
}

export default DisplayResult;