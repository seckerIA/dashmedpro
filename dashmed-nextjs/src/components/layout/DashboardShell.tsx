'use client'

import React, { useState, useRef } from "react"
import { PanelImperativeHandle } from "react-resizable-panels"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { AppHeader } from "@/components/layout/AppHeader"

interface DashboardShellProps {
    children: React.ReactNode
    userProfile: any
    organization: any
}

export function DashboardShell({ children, userProfile, organization }: DashboardShellProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const sidebarRef = useRef<PanelImperativeHandle>(null)

    const toggleSidebar = () => {
        if (isCollapsed) {
            sidebarRef.current?.expand()
        } else {
            sidebarRef.current?.collapse()
        }
    }

    return (
        <ResizablePanelGroup
            orientation="horizontal"
            className="h-screen w-full overflow-hidden font-sans"
            onLayoutChange={(layout) => {
                document.cookie = `react-resizable-panels:layout=${JSON.stringify(layout)}`
            }}
        >
            <ResizablePanel
                panelRef={sidebarRef}
                defaultSize={20}
                collapsedSize={5}
                collapsible={true}
                minSize={5}
                maxSize={20}
                onResize={() => {
                    const collapsed = sidebarRef.current?.isCollapsed() ?? false
                    if (collapsed !== isCollapsed) {
                        setIsCollapsed(collapsed)
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(collapsed)}`
                    }
                }}
                className="transition-all duration-300 ease-in-out border-r"
            >
                <AppSidebar
                    isCollapsed={isCollapsed}
                    userProfile={userProfile}
                    organization={organization}
                />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={80}>
                <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
                    <AppHeader
                        userProfile={userProfile}
                        isCollapsed={isCollapsed}
                        toggleSidebar={toggleSidebar}
                    />
                    <main className="flex-1 overflow-y-auto bg-background p-6">
                        {children}
                    </main>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
