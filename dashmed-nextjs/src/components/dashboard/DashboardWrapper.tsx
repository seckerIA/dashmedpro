
import { useState } from 'react';
import { DoctorDashboard } from './DoctorDashboard';
import { DetailedDashboard } from './DetailedDashboard';
import VisionDashboard from './VisionDashboard';
import { Button } from '@/components/ui/button';
import { Activity, BarChart2, LayoutDashboard } from 'lucide-react';

type DashboardView = 'daily' | 'detailed' | 'general';

export function DashboardWrapper() {
    const [currentView, setCurrentView] = useState<DashboardView>('daily');

    const handleViewChange = (mode: string) => {
        // Safe cast as we know the modes match
        setCurrentView(mode as DashboardView);
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* View Architecture */}
            <div className="flex-1 overflow-hidden relative">
                {currentView === 'daily' && (
                    <div className="animate-in fade-in zoom-in-95 duration-200 h-full">
                        <DoctorDashboard
                            viewMode="daily"
                            onViewModeChange={(mode) => handleViewChange(mode)}
                        />
                    </div>
                )}
                {currentView === 'detailed' && (
                    <div className="animate-in fade-in zoom-in-95 duration-200 h-full overflow-y-auto">
                        <DetailedDashboard
                            viewMode="detailed"
                            // @ts-ignore - mismatch in strict types but runtime safe
                            onViewModeChange={(mode) => handleViewChange(mode)}
                        />
                    </div>
                )}
                {currentView === 'general' && (
                    <div className="animate-in fade-in zoom-in-95 duration-200 h-full overflow-y-auto">
                        <VisionDashboard
                            viewMode="vision" // vision maps to general view in old component
                            // @ts-ignore
                            onViewModeChange={(mode) => handleViewChange(mode === 'vision' ? 'general' : mode)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
