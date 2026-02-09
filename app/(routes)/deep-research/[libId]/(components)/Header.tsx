// app/deep-research/[libId]/(components)/Header.tsx
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { ShareIcon, Link } from "lucide-react";
import React from "react";

interface HeaderProps {
  searchInputRecord?: {
    created_at?: string;
    searchInput?: string;
  };
}

function Header({ searchInputRecord }: HeaderProps) {
  return (
    <div className="fixed top-0 left-20 right-0 z-40 bg-background">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Left Section - User */}
        <div className="flex gap-2 items-center min-w-[100px]">
          <UserButton />
        </div>

        {/* Center Section - Research Title */}
        <div className="flex-1 flex justify-center">
          <h2 className="line-clamp-1 max-w-2xl text-lg font-semibold text-center">
            {searchInputRecord?.searchInput ?? "Deep Research"}
          </h2>
        </div>

        {/* Right Section - Actions */}
        <div className="flex gap-3 min-w-[100px] justify-end">
          <Button variant="ghost" size="icon">
            <Link className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ShareIcon className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Header;
