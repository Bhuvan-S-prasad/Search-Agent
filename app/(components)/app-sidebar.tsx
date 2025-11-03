"use client"

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
import { Compass, GalleryHorizontalEnd, Search } from "lucide-react"
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
        <p className="font-semibold text-xl ">Search Agent</p>
      </SidebarHeader>
      <SidebarContent className="bg-accent">
        <SidebarGroup>
        <SidebarContent>
            <SidebarMenu>
                {MenuOptions.map((menu, index)=> (
                    <SidebarMenuItem key={index}>
                        <SidebarMenuButton asChild className={`p-5 py-6 hover:bg-accent/50 hover:font-bold ${path === menu.path ? "bg-accent/70 font-bold" : ""}`}>
                            <a href={menu.path} className=''>
                                <menu.icon className='h-8 w-8'/>
                                <span className="text-lg">{menu.title}</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarContent>
        </SidebarGroup>

        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter /> 
    </Sidebar>
  )
}