import AppSidebar from "../(components)/app-sidebar";
import MobileNav from "../(components)/mobile-nav";
import React from "react";

export default function RoutesLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-background">
            <AppSidebar />
            <MobileNav />
            <main className="flex-1 w-full min-h-screen">
                {children}
            </main>
        </div>
    );
}
