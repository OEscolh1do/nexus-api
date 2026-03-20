import React, { useState, useEffect } from 'react';
import { CloudOff, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Simple check, could be enhanced with actual API ping
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
      isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    )}>
      {isOnline ? (
        <>
          <Cloud className="w-4 h-4" />
          <span>Online</span>
        </>
      ) : (
        <>
          <CloudOff className="w-4 h-4" />
          <span>Offline - Modificações Locais</span>
        </>
      )}
    </div>
  );
};
