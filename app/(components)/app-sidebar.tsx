"use client"

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SignOutButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Compass, GalleryHorizontalEnd, LogIn, Search } from "lucide-react"
import Image from "next/image";
import { usePathname } from "next/navigation";

const MenuOptions = [
    {
        title: "Home",
        icon: Search,
        path: "/"
    },
    {
        title: "Discover",
        icon: Compass,
        path: "/discover"
    },
    {
        title: "Library",
        icon: GalleryHorizontalEnd,
        path: "/library"
    },
    {
        title: "Sign In",
        icon: LogIn,
        path: "/sign-in"
    }
];


export default function AppSidebar() {
    const path = usePathname();
    const { user } = useUser();

    const finalMenuOptions = user
    ? MenuOptions.filter((menu) => menu.title !== "Sign In")
    : MenuOptions;

  return (
    <Sidebar>
      <SidebarHeader className="bg-accent flex items-center py-5">
        <Image src={'/logo.png'} alt="logo" width={150} height={100}/>
      </SidebarHeader>
      <SidebarContent className="bg-accent">
        <SidebarGroup>
        <SidebarContent>
            <SidebarMenu>
                {finalMenuOptions.map((menu, index)=> (
                    <SidebarMenuItem key={index}>
                        <SidebarMenuButton asChild className={`p-5 py-6 hover:bg-sidebar-ring hover:font-bold ${path === menu.path ? "bg-accent/70 font-bold" : ""}`}>
                            <a href={menu.path} className=''>
                                <menu.icon className='h-8 w-8'/>
                                <span className="text-lg">{menu.title}</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>

            {!user? <SignUpButton mode="modal">
               <Button className="rounded-full mx-4 mt-4">Sign Up</Button>
            </SignUpButton>:
            <SignOutButton>
              <Button className="rounded-full mx-4 mt-4">Sign Out</Button>
            </SignOutButton>

            }

        </SidebarContent>
        </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>

      <SidebarFooter className="bg-accent">
        <div className="p-3 flex flex-col">
          <h2 className="text-gray-500">Try Now</h2>
          <p className="text-gray-400">upgrade for image upload and more powerful AI</p>
          <Button variant={'secondary'} className="text-gray-500 mb-3">Learn more</Button>
          <UserButton />
        </div>
        
      </SidebarFooter>
    </Sidebar>
  )
}