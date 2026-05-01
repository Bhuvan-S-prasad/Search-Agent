"use client";

import { Button } from "@/components/ui/button";
import {
  SignOutButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Home, Compass, BookOpen, LogIn, Plus, DollarSign } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import Image from "next/image";

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
    title: "finance",
    icon: DollarSign,
    path: "/finance",
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

export default function AppSidebar() {
  const path = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryHistory, setLibraryHistory] = useState<LibraryItem[]>([]);

  const finalMenuOptions = user
    ? MenuOptions.filter((menu) => menu.title !== "SignIn")
    : MenuOptions;

  useEffect(() => {
    const GetLibraryHistory = async () => {
      const { data: Library } = await supabase
        .from("Library")
        .select("*")
        .eq("userEmail", user?.primaryEmailAddress?.emailAddress)
        .order("id", { ascending: false });

      if (Library) {
        setLibraryHistory(Library);
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
      <div className="fixed left-0 top-0 h-screen w-20 bg-accent border-r border-border flex flex-col items-center py-4 z-50">
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
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push("/library")}
              >
                View All
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {libraryHistory.length > 0 ? (
                libraryHistory.map((item, index) => (
                  <div
                    key={index}
                    className="py-1.5 px-3 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleLibraryClick(item.libId)}
                  >
                    <h3 className="font-medium text-sm truncate">
                      {item.searchInput}
                    </h3>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No library items yet</p>
                  <p className="text-xs mt-1">Your searches will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="w-20" />
    </>
  );
}
