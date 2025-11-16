"use client"

import { Button } from "@/components/ui/button";
import { ArrowRight, Atom, AudioLines, Cpu, Globe, Mic, Paperclip, SearchCheck } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AIModelsOptions } from "@/services/Shared";
import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/services/supabase";
import { v4 as uuidv4 } from 'uuid';
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";


export default function InputBox() {

    const [userSearchInput, setUserSearchInput] = useState<string>('');
    const {user} = useUser();
    const [searchType, setSearchType] = useState<'Search' | 'DeepSearch'>('Search');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const newHeight = Math.min(textarea.scrollHeight, 200);
            textarea.style.height = `${newHeight}px`;
        }
    }, [userSearchInput]);

    const onSearchQuery = async () => {
        setLoading(true);
        
        if (searchType === 'DeepSearch') {
            // For DeepSearch, create a chat directly and start research
            try {
                const response = await fetch('/api/deep-research/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: userSearchInput,
                        userId: user?.id || '',
                        userEmail: user?.primaryEmailAddress?.emailAddress || '',
                    }),
                });

                const data = await response.json();
                if (data.chatId) {
                    router.push(`/deep-research?chatId=${data.chatId}`);
                } else {
                    console.error('Failed to start deep research');
                }
            } catch (error) {
                console.error('Error starting deep research:', error);
            } finally {
                setLoading(false);
            }
        } else {
            // Regular search flow
            const libid = uuidv4();

            const result = await supabase.from('Library').insert([
                {
                    searchInput: userSearchInput,
                    userEmail: user?.primaryEmailAddress?.emailAddress,
                    type: searchType,
                    libId: libid
                }
            ]).select();
            setLoading(false);

            router.push('/search/'+libid)
        }
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); 
            if (userSearchInput.trim()) {
                onSearchQuery();
            }
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setUserSearchInput(e.target.value);
    }

    const placeholder = searchType === 'Search' ? 'Search with NOMI' : 'Deep Research Agent';

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full pl-20 py-8">
            <Image src={'/logo.png'} alt="logo" width={250} height={250}/>
            
            <div className="w-full max-w-2xl mt-8 border rounded-2xl p-5 bg-white">
                <div className="w-full">
                    <textarea 
                        ref={textareaRef}
                        placeholder={placeholder}
                        value={userSearchInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        className="w-full outline-none resize-none overflow-y-auto min-h-7 bg-transparent text-base"
                        rows={1}
                    />
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-none">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setSearchType('Search')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                                searchType === 'Search' 
                                    ? 'bg-primary/10 text-primary font-medium' 
                                    : 'hover:bg-gray-100 text-gray-600'
                            }`}
                        >
                            <SearchCheck className="h-4 w-4" />
                            Search
                        </button>
                        <button 
                            onClick={() => setSearchType('DeepSearch')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                                searchType === 'DeepSearch' 
                                    ? 'bg-primary/10 text-primary font-medium' 
                                    : 'hover:bg-gray-100 text-gray-600'
                            }`}
                        >
                            <Atom className="h-4 w-4" />
                            DeepSearch
                        </button>
                    </div>

                    <div className="flex gap-0.5 items-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Globe className="text-primary h-5 w-5"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Search</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Web</DropdownMenuItem>
                                <DropdownMenuItem>Academics</DropdownMenuItem>
                                <DropdownMenuItem>Finance</DropdownMenuItem>
                                <DropdownMenuItem>Social</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Cpu className="text-primary h-5 w-5"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Models</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {AIModelsOptions.map((model, index) => (
                                    <DropdownMenuItem key={index}>
                                        <div className="mb-1">
                                            <h2>{model.name}</h2>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Paperclip className="text-primary h-5 w-5"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Attachments</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Local Files</DropdownMenuItem>
                                <DropdownMenuItem>Connect files</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="ghost" size="icon">
                            <Mic className="text-primary h-5 w-5"/>
                        </Button>

                        <Button 
                            onClick={() => {
                                if (userSearchInput.trim()) {
                                    onSearchQuery();
                                }
                            }} 
                            disabled={loading || !userSearchInput.trim()}
                            size="icon"
                        >
                            {loading ? (
                                <Spinner className="h-5 w-5 text-white" />
                            ) : !userSearchInput.trim() ? (
                                <AudioLines className="h-5 w-5" />
                            ) : (
                                <ArrowRight className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}