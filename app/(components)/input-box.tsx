import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Atom, AudioLinesIcon, CpuIcon, GlobeIcon, Mic, Paperclip, SearchCheck } from "lucide-react";
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


export default function InputBox() {
    return (
        <div className="flex flex-col items-center pb-35 w-full">
                <Image src={'/logo.png'} alt="logo" width={250} height={250}/>
            <div className="p-2 w-full max-w-2xl border rounded-2xl mt-8">
                <input type="text" placeholder="Search with NOMI" className="w-full p-4 outline-none"/>

                <div className="flex justify-between pt-5 items-end">
                
                    <Tabs defaultValue="Search" className="w-[400px]">
                        <TabsList>
                            <TabsTrigger value="Search" className="text-primary" > <SearchCheck /> Search</TabsTrigger>
                            <TabsTrigger value="DeepSearch" className="text-primary"> <Atom /> DeepSearch</TabsTrigger>
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

                        <Button className="text">
                            <AudioLinesIcon className="text-white h-5 w-5"/>
                        </Button>
                    </div>
                 </div>
            </div>
        </div>
    )
}