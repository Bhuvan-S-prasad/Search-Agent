import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { Clock, Link, ShareIcon } from "lucide-react";
import moment from "moment";


interface HeaderProps {
  searchInputRecord?: {
    created_at: string;
    searchInput: string;
  };
}

function Header({ searchInputRecord }: HeaderProps) {
  return (
    <div className="px-4 pb-4 border-b flex justify-between">
      <div className="flex gap-2 items-center">
        <UserButton />
        <div className="flex gap-2 items-center">
          <Clock className="h-4 w-4 text-primary"/>
          <h2>{moment(searchInputRecord?.created_at).fromNow()}</h2>
        </div>
      </div>

      <h2 className="line-clamp-1 max-w-md">{searchInputRecord?.searchInput}</h2>

      <div className="flex gap-3">
        <Button><Link /></Button>
        <Button> <ShareIcon /> Share</Button>
      </div>
    </div>
  );
}

export default Header;
