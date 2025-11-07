import { useParams } from "next/navigation";

function SearchQueryResult() {
    const {libId} = useParams();
    return(
        <div>
            Search Results
        </div>
    )
}

export default SearchQueryResult;

