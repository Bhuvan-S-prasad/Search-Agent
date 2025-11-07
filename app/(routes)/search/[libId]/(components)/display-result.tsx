import AnswerDisplay from "@/app/(components)/answer-display";
import { LucideImage, LucideList, LucideSparkles, LucideVideo } from "lucide-react";
import { useState } from "react";


interface DisplayResultProps {
    searchInputRecord?: {
        searchInput: string;
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
                {activeTab === 'Answer'? <AnswerDisplay /> : null

                }
            </div>

        </div>
    )
}

export default DisplayResult;