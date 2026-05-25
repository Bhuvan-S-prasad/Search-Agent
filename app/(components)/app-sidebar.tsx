"use client";

import {
  SignOutButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Home, Compass, BookOpen, LogIn, Plus, Atom, Crown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import axios from "axios";


const MenuOptions = [
  {
    title: "Home",
    icon: Home,
    path: "/",
    hasLibrary: true,
  },
  {
    title: "Discover",
    icon: Compass,
    path: "/discover",
  },
  {
    title: "SignIn",
    icon: LogIn,
    path: "/sign-in",
  },
];

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

interface CouncilItem {
  id: string;
  query: string;
  status: string;
  user_email: string;
  created_at: string;
}

export default function AppSidebar() {
  const path = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryHistory, setLibraryHistory] = useState<LibraryItem[]>([]);
  const [researchHistory, setResearchHistory] = useState<ResearchItem[]>([]);
  const [councilHistory, setCouncilHistory] = useState<CouncilItem[]>([]);

  const finalMenuOptions = user
    ? MenuOptions.filter((menu) => menu.title !== "SignIn")
    : MenuOptions;

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
        console.error("Error fetching history:", error);
      }
    };


    if (user) {
      GetLibraryHistory();
    }
  }, [user]);

  const handleLibraryClick = (libId: string) => {
    router.push("/search/" + libId);
    setShowLibrary(false);
  };

  return (
    <>
      <div className="md:flex fixed left-0 top-0 h-screen w-20 bg-accent border-r border-border flex flex-col items-center py-4 z-50">
        <div className="mb-5 mt-3 ml-2 mr-2">
          <Image src={"/logo-navbar.png"} alt="logo" width={150} height={150} />
        </div>

        <button
          className="flex flex-col items-center justify-center gap-1 py-6 px-2 mx-2 hover:bg-accent/70 text-muted-foreground rounded-lg hover:text-foreground transition-colors"
          onClick={() => router.push("/")}
        >
          <Plus className="h-6 w-6" />
          <span className="text-xs font-medium">New</span>
        </button>

        {/* Menu Items */}
        <div className="flex-1 flex flex-col items-center gap-6 w-full">
          {finalMenuOptions.map((menu, index) => (
            <div
              key={index}
              className="relative w-full"
              onMouseEnter={() => menu.hasLibrary && setShowLibrary(true)}
              onMouseLeave={() => menu.hasLibrary && setShowLibrary(false)}
            >
              <a
                href={menu.path}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg mx-2 transition-colors ${
                  path === menu.path
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                <menu.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{menu.title}</span>
              </a>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto flex flex-col items-center gap-4">
          {!user ? (
            <SignUpButton mode="modal">
              <button className="flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg hover:bg-accent/70 text-muted-foreground hover:text-foreground transition-colors">
                <LogIn className="h-6 w-6" />
                <span className="text-xs font-medium">Sign In</span>
              </button>
            </SignUpButton>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UserButton />
              <SignOutButton>
                <button className="text-xs text-muted-foreground hover:text-foreground">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          )}
        </div>
      </div>

      {showLibrary && (
        <div
          className="fixed left-20 top-0 h-screen w-64 bg-background border-r border-border shadow-lg z-40 overflow-hidden"
          onMouseEnter={() => setShowLibrary(true)}
          onMouseLeave={() => setShowLibrary(false)}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Library
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {/* Council of NOMI Sessions */}
              {councilHistory.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-2 pb-1 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>Council</span>
                  </p>
                  {councilHistory.map((item) => (
                    <div
                      key={item.id}
                      className="py-1.5 px-3 hover:bg-accent cursor-pointer transition-colors rounded-md group"
                      onClick={() => {
                        router.push(`/council/${item.id}`);
                        setShowLibrary(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                        <h3 className="font-medium text-sm truncate group-hover:text-amber-500 transition-colors">
                          {item.query}
                        </h3>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Deep Research Items */}
              {researchHistory.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-3 pb-1">Research</p>
                  {researchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="py-1.5 px-3 hover:bg-accent cursor-pointer transition-colors rounded-md"
                      onClick={() => { router.push(`/deep-research/${item.id}`); setShowLibrary(false); }}
                    >
                      <div className="flex items-center gap-2">
                        <Atom className="w-3 h-3 text-primary shrink-0" />
                        <h3 className="font-medium text-sm truncate">{item.query}</h3>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Regular Search Items */}
              {libraryHistory.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-3 pb-1">Searches</p>
                  {libraryHistory.map((item, index) => (
                    <div
                      key={index}
                      className="py-1.5 px-3 hover:bg-accent cursor-pointer transition-colors rounded-md"
                      onClick={() => handleLibraryClick(item.libId)}
                    >
                      <h3 className="font-medium text-sm truncate">
                        {item.searchInput}
                      </h3>
                    </div>
                  ))}
                </>
              )}

              {libraryHistory.length === 0 && researchHistory.length === 0 && councilHistory.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No library items yet</p>
                  <p className="text-xs mt-1">Your searches and consultations will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="hidden md:block w-20 shrink-0" />
    </>
  );
}
