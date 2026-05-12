"use client"

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Header from "./(components)/Header";
import DisplayResult from "./(components)/display-result";



function SearchQueryResult() {
    const {libId} = useParams();



    const [searchInputRecord, setSearchInputRecord] = useState();

    useEffect(() => {
        const GetSearchQueryRecord = async () => {
            try {
                const response = await axios.get(`/api/search/record?libId=${libId}`);
                if (response.data) {
                    console.log(response.data);
                    setSearchInputRecord(response.data);
                }
            } catch (error) {
                console.error("Error fetching search query record:", error);
            }
        }
        if (libId) {
            GetSearchQueryRecord();
        }
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

