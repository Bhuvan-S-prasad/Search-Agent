"use client"

import { supabase } from "@/services/supabase";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "./(components)/Header";
import DisplayResult from "./(components)/display-result";



function SearchQueryResult() {
    const {libId} = useParams();



    const [searchInputRecord, setSearchInputRecord] = useState();

    useEffect(() => {
        const GetSearchQueryRecord = async () => {
            const { data: Library, error } = await supabase
            .from('Library')
            .select('*')
            .eq('libId', libId);
    
            if (Library && Library.length > 0) {
                setSearchInputRecord(Library[0]);
            }
        }
        GetSearchQueryRecord();
    }, [libId])

    

    return(

        <div>
            <Header searchInputRecord={searchInputRecord}/>        
            <div className="px-10 md:px-20 lg:px-36 xl:px-56 mt-15">
                <DisplayResult searchInputRecord={searchInputRecord} />
            </div>
        </div>
    )
}

export default SearchQueryResult;   

