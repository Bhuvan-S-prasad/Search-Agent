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
import { SignUpButton } from "@clerk/nextjs";
import { Compass, GalleryHorizontalEnd, Search } from "lucide-react"
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
    }
];


export default function AppSidebar() {
    const path = usePathname();
  return (
    <Sidebar>
      <SidebarHeader className="bg-accent flex items-center py-5">
        <Image src={'/logo.png'} alt="logo" width={150} height={100}/>
      </SidebarHeader>
      <SidebarContent className="bg-accent">
        <SidebarGroup>
        <SidebarContent>
            <SidebarMenu>
                {MenuOptions.map((menu, index)=> (
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
            <SignUpButton mode="modal">
               <Button className="rounded-full mx-4 mt-4">Sign Up</Button>
            </SignUpButton>
              

        </SidebarContent>
        </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter /> 
    </Sidebar>
  )
}