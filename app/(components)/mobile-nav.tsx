"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser, UserButton, SignUpButton, SignOutButton } from "@clerk/nextjs";
import { Menu, X, Home, Compass, BookOpen, Plus, Atom, LogIn, ChevronDown, ChevronUp, Crown, Search } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { CouncilItem } from "@/types";

interface LibraryItem {
  id: number;
  libId: string;
  searchInput: string;
  userEmail: string;
}

interface ResearchItem {
  id: string;
  query: string;
  status: string;
  user_email: string;
  created_at: string;
}

const MenuOptions = [
  {
    title: "Home",
    icon: Home,
    path: "/",
  },
  {
    title: "Discover",
    icon: Compass,
    path: "/discover",
  },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showResearchHistory, setShowResearchHistory] = useState(true);
  const [showSearchHistory, setShowSearchHistory] = useState(true);
  const [showCouncilHistory, setShowCouncilHistory] = useState(true);
  const [libraryHistory, setLibraryHistory] = useState<LibraryItem[]>([]);
  const [researchHistory, setResearchHistory] = useState<ResearchItem[]>([]);
  const [councilHistory, setCouncilHistory] = useState<CouncilItem[]>([]);

  const path = usePathname();
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    const GetLibraryHistory = async () => {
      try {
        const response = await axios.get("/api/user/history");
        const { library, research, council } = response.data;

        if (library) {
          setLibraryHistory(library);
        }

        if (research) {
          setResearchHistory(research);
        }

        if (council) {
          setCouncilHistory(council);
        }
      } catch (error) {
        console.error("Error fetching history in mobile nav:", error);
      }
    };

    if (user) {
      GetLibraryHistory();
    }
  }, [user]);

  // Close drawer synchronously on path change
  const [prevPath, setPrevPath] = useState(path);
  if (path !== prevPath) {
    setPrevPath(path);
    setIsOpen(false);
  }

  const handleNavigate = (targetPath: string) => {
    router.push(targetPath);
    setIsOpen(false);
  };

  const handleLibraryClick = (libId: string) => {
    router.push("/search/" + libId);
    setIsOpen(false);
  };

  return (
    <div className="block md:hidden">
      {/* Sticky Top Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-background/85 backdrop-blur-md border-b border-border/40 px-4 flex items-center justify-between z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="p-1.5 hover:bg-accent/70 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => handleNavigate("/")}>
          <Image src="/logo-navbar.png" alt="logo" width={90} height={30} className="object-contain" />
        </div>

        <div className="flex items-center min-w-[32px]">
          {user ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <SignUpButton mode="modal">
              <button className="p-1.5 hover:bg-accent/70 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <LogIn className="h-5 w-5" />
              </button>
            </SignUpButton>
          )}
        </div>
      </div>

      {/* Slide-out Drawer Panel */}
      <div
        className={`fixed inset-0 z-100 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Drawer container */}
        <div
          className={`absolute top-0 left-0 bottom-0 w-72 max-w-[80vw] bg-background border-r border-border flex flex-col transition-transform duration-300 ease-out transform ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="h-14 border-b border-border/40 px-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Image src="/logo-navbar.png" alt="logo" width={95} height={32} className="object-contain" />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-accent/70 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Actions & Menu Items */}
          <div className="p-4 border-b border-border/40">
            <Button
              onClick={() => handleNavigate("/")}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-transform active:scale-98 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>New Search</span>
            </Button>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4 flex flex-col gap-1 border-b border-border/40">
            {MenuOptions.map((menu, index) => {
              const isActive = path === menu.path;
              return (
                <button
                  key={index}
                  onClick={() => handleNavigate(menu.path)}
                  className={`flex items-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-colors text-left ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent/70 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <menu.icon className="h-5 w-5 shrink-0" />
                  <span>{menu.title}</span>
                </button>
              );
            })}
          </div>

          {/* Collapsible Library history */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <button
              onClick={() => setShowLibrary(!showLibrary)}
              className="w-full flex items-center justify-between py-2 px-3 hover:bg-accent/50 rounded-lg text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-colors mb-2"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 shrink-0" />
                Library
              </span>
              {showLibrary ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showLibrary && (
              <div className="space-y-4 pl-2 mt-1">
                {/* Council Sessions */}
                <div>
                  <button
                    onClick={() => setShowCouncilHistory(!showCouncilHistory)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 py-1 px-2 hover:bg-accent/30 rounded transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                      COUNCIL ({councilHistory.length})
                    </span>
                    {showCouncilHistory ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                  </button>

                  {showCouncilHistory && (
                    <div className="mt-1 space-y-1.5 max-h-48 overflow-y-auto">
                      {councilHistory.length > 0 ? (
                        councilHistory.map((item) => (
                          <div
                            key={item.id}
                            className="py-2 px-3 hover:bg-accent cursor-pointer transition-colors rounded-lg flex items-center gap-2 border border-transparent hover:border-border/20 group"
                            onClick={() => handleNavigate(`/council/${item.id}`)}
                          >
                            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                            <h3 className="font-medium text-xs text-foreground/90 truncate group-hover:text-amber-500 transition-colors">{item.query}</h3>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-muted-foreground/60 px-3 py-1">No consultations yet</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Deep Research Items */}
                <div>
                  <button
                    onClick={() => setShowResearchHistory(!showResearchHistory)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 py-1 px-2 hover:bg-accent/30 rounded transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Atom className="w-3 h-3 text-purple-500 shrink-0" />
                      RESEARCH ({researchHistory.length})
                    </span>
                    {showResearchHistory ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                  </button>

                  {showResearchHistory && (
                    <div className="mt-1 space-y-1.5 max-h-48 overflow-y-auto">
                      {researchHistory.length > 0 ? (
                        researchHistory.map((item) => (
                          <div
                            key={item.id}
                            className="py-2 px-3 hover:bg-accent cursor-pointer transition-colors rounded-lg flex items-center gap-2 border border-transparent hover:border-border/20 group"
                            onClick={() => handleNavigate(`/deep-research/${item.id}`)}
                          >
                            <Atom className="w-3.5 h-3.5 text-purple-500 shrink-0 group-hover:scale-110 transition-transform" />
                            <h3 className="font-medium text-xs text-foreground/90 truncate group-hover:text-purple-500 transition-colors">{item.query}</h3>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-muted-foreground/60 px-3 py-1">No research yet</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Regular Searches */}
                <div>
                  <button
                    onClick={() => setShowSearchHistory(!showSearchHistory)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 py-1 px-2 hover:bg-accent/30 rounded transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Search className="w-3 h-3 text-blue-500 shrink-0" />
                      SEARCHES ({libraryHistory.length})
                    </span>
                    {showSearchHistory ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                  </button>

                  {showSearchHistory && (
                    <div className="mt-1 space-y-1.5 max-h-48 overflow-y-auto">
                      {libraryHistory.length > 0 ? (
                        libraryHistory.map((item, index) => (
                          <div
                            key={index}
                            className="py-2 px-3 hover:bg-accent cursor-pointer transition-colors rounded-lg flex items-center gap-2 border border-transparent hover:border-border/20 group"
                            onClick={() => handleLibraryClick(item.libId)}
                          >
                            <Search className="w-3.5 h-3.5 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
                            <h3 className="font-medium text-xs text-foreground/90 truncate group-hover:text-blue-500 transition-colors">{item.searchInput}</h3>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-muted-foreground/60 px-3 py-1">No searches yet</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer / Account */}
          <div className="p-4 border-t border-border/40 mt-auto bg-accent/20">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <UserButton afterSignOutUrl="/" />
                  <div className="min-w-0 flex flex-col">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {user.fullName || user.username || "Account"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                </div>
                <SignOutButton>
                  <button className="text-xs text-muted-foreground hover:text-foreground font-medium shrink-0 ml-2 px-2 py-1 border border-border/60 rounded-md hover:bg-background transition-colors">
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            ) : (
              <SignUpButton mode="modal">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 rounded-xl">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In / Sign Up</span>
                </Button>
              </SignUpButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
