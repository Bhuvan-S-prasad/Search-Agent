"use client"

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { ArrowRight, Atom, AudioLinesIcon, CpuIcon, GlobeIcon, Mic, Paperclip, SearchCheck } from "lucide-react";
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
import { useState } from "react";
import { TabsContent } from "@radix-ui/react-tabs";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/services/supabase";
import { v4 as uuidv4 } from 'uuid';
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";


export default function InputBox() {

    const  [userSearchInput, setUserSearchInput] = useState<string>('');
    const {user} = useUser();
    const[searchType, setSearchType] = useState('Search');
    const [loading, setLoading] = useState(false);
    const router = useRouter(); 


    const onSearchQuery = async () => {
        setLoading(true);
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

    return (
        <div className="flex flex-col items-center pb-35 w-full">
                <Image src={'/logo.png'} alt="logo" width={250} height={250}/>
            <div className="p-2 w-full max-w-2xl border rounded-2xl mt-8">
                
                <div className="flex justify-between pt-5 items-end">
                
                    <Tabs defaultValue="Search" className="w-[400px]">
                        <TabsContent value="Search"><input type="text" placeholder="Search with NOMI"
                        onChange={(e) => setUserSearchInput(e.target.value)}
                        className="w-full pb-3 outline-none"
                        />
                        </TabsContent>
                        <TabsContent value="DeepSearch"><input type="text" placeholder="Deep Research Agent"
                        onChange={(e) => setUserSearchInput(e.target.value)}
                        className="w-full pb-3 outline-none"
                        />
                        </TabsContent>
                        <TabsList>
                            <TabsTrigger value="Search" className="text-primary" onClick={() =>setSearchType('Search')}> <SearchCheck /> Search</TabsTrigger>
                            <TabsTrigger value="DeepSearch" className="text-primary" onClick={() =>setSearchType('DeepSearch')}> <Atom /> DeepSearch</TabsTrigger>
                        </TabsList>
                    </Tabs>
                
                    <div className="flex gap-0.5 items-center">
                            
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost">
                                    <GlobeIcon className="text-primary h-5 w-5"/>
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
                                <Button variant="ghost">
                                    <CpuIcon className="text-primary h-5 w-5"/>
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
                                <Button variant="ghost">
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

                        <Button variant="ghost">
                            <Mic className="text-primary h-5 w-5"/>
                        </Button>

                        <Button className="text" onClick={() => {
                            userSearchInput ? onSearchQuery() : null
                        }} disabled={loading || !userSearchInput}>
                            {loading ? <Spinner className="h-5 w-5 text-white" /> : (!userSearchInput ? <AudioLinesIcon className="h-5 w-5" /> : <ArrowRight />)}
                        </Button>
                    </div>
                 </div>
            </div>
        </div>
    )
}