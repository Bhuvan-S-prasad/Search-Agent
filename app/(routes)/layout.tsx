import AppSidebar from "../(components)/app-sidebar";
import React from "react";

export default function RoutesLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <AppSidebar />
            <main>
                {children}
            </main>
        </>
    );
}
