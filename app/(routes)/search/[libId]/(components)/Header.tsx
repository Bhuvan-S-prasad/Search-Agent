import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import {  Link, ShareIcon } from "lucide-react";


interface HeaderProps {
  searchInputRecord?: {
    created_at: string;
    searchInput: string;
  };
}

function Header({ searchInputRecord }: HeaderProps) {
  return (
    <div className="fixed top-14 md:top-0 left-0 md:left-20 right-0 z-30 bg-background/90 backdrop-blur-xs border-b border-border/40">
      <div className="flex items-center justify-between px-4 md:px-8 py-3 gap-2">
        {/* Left Section - User (Desktop only, hidden on mobile to avoid redundancy) */}
        <div className="hidden md:flex gap-2 items-center min-w-[100px]">
          <UserButton />
        </div>
        <div className="block md:hidden w-[40px] shrink-0" /> {/* Spacer to balance right actions */}

        {/* Center Section - Search Input */}
        <div className="flex-1 flex justify-center min-w-0">
          <h2 className="line-clamp-1 max-w-2xl text-sm md:text-lg font-semibold text-center text-foreground/90">
            {searchInputRecord?.searchInput}
          </h2>
        </div>

        {/* Right Section - Actions */}
        <div className="flex gap-2 md:gap-3 min-w-[100px] justify-end shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Link className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs max-sm:px-2">
            <ShareIcon className="h-3.5 w-3.5 sm:mr-2" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Header;