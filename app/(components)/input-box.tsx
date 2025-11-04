import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Atom, AudioLinesIcon, CpuIcon, GlobeIcon, Mic, Paperclip, SearchCheck } from "lucide-react";
import Image from "next/image";


export default function InputBox() {
    return (
        <div className="flex flex-col items-center justify-center w-full">
                <Image src={'/logo.png'} alt="logo" width={250} height={250}/>
            <div className="p-2 w-full max-w-2xl border rounded-2xl mt-8">
                <input type="text" placeholder="Search with NOMI" className="w-full p-4 outline-none"/>

                <div className="flex justify-between items-end">
                
                    <Tabs defaultValue="Search" className="w-[400px]">
                        <TabsList>
                            <TabsTrigger value="Search" className="text-primary" > <SearchCheck /> Search</TabsTrigger>
                            <TabsTrigger value="DeepSearch" className="text-primary"> <Atom /> DeepSearch</TabsTrigger>
                        </TabsList>
                    </Tabs>
                
                    <div className="flex gap-4 items-center">
                        <GlobeIcon className="text-primary h-5 w-5"/>
                        <CpuIcon className="text-primary h-5 w-5"/>
                        <Paperclip className="text-primary h-5 w-5"/>
                        <Mic className="text-primary h-5 w-5"/>
                        <Button className="text">
                        <AudioLinesIcon className="text-white h-5 w-5"/>
                        </Button>
                    </div>
                 </div>
            </div>
        </div>
    )
}