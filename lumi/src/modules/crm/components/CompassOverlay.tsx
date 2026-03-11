import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';

export const CompassOverlay: React.FC = () => {
    // Connect to Engineering Slice for Azimuth
    const azimuth = useSolarStore(state => state.engineeringData.azimute);
    const updateEngineeringData = useSolarStore(state => state.updateEngineeringData);
    const compassRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const adjustAzimuth = (delta: number) => {
        let newValue = azimuth + delta;
        if (newValue >= 360) newValue = 0;
        if (newValue < 0) newValue = 359;
        updateEngineeringData({ azimute: newValue });
    };

    // --- Radial Logic (UNTOUCHED) ---
    const updateAzimuthFromPointer = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!compassRef.current) return;
        
        const rect = compassRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;

        let angleDeg = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        angleDeg += 90;
        if (angleDeg < 0) angleDeg += 360;
        const finalAzimuth = Math.round(angleDeg) % 360;
        
        updateEngineeringData({ azimute: finalAzimuth });
    };

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        updateAzimuthFromPointer(e);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation(); 
        const delta = e.deltaY < 0 ? 1 : -1;
        adjustAzimuth(delta);
    };

    // Global listeners for drag consistency
    React.useEffect(() => {
        const up = () => setIsDragging(false);
        const move = (e: MouseEvent | TouchEvent) => {
            if (isDragging) updateAzimuthFromPointer(e);
        };
        
        if (isDragging) {
            window.addEventListener('mouseup', up);
            window.addEventListener('mousemove', move);
            window.addEventListener('touchend', up);
            window.addEventListener('touchmove', move);
        }
        return () => {
            window.removeEventListener('mouseup', up);
            window.removeEventListener('mousemove', move);
            window.removeEventListener('touchend', up);
            window.removeEventListener('touchmove', move);
        };
    }, [isDragging]);

    return (
        <div className="absolute bottom-6 left-6 z-[400] flex flex-col items-center gap-3 pointer-events-auto">
            
            {/* 1. Visual Compass (Interactive Widget) */}
            <div 
                ref={compassRef}
                className="relative flex items-center justify-center cursor-crosshair group w-32 h-32 rounded-full transition-transform hover:scale-105 active:scale-95 shadow-2xl shadow-black/40"
                onWheel={handleWheel}
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
                title="Ajuste a Orientação do Telhado"
            >
                {/* 
                   A. STATIC BASE: The Nautical Star (SVG)
                   Fixed at 0deg (North Up). 
                */}
                <div className="absolute inset-0 select-none pointer-events-none drop-shadow-lg">
                    {/* Background Disc */}
                    <div className="absolute inset-0 bg-slate-900/90 rounded-full border-2 border-slate-700/50 backdrop-blur-sm" />
                    
                    {/* SVG Compass Rose */}
                    <svg viewBox="0 0 100 100" className="w-full h-full p-1 opacity-90">
                         {/* Outer Degree Marks */}
                        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" strokeDasharray="1,2" />
                        
                        {/* 4 Point Star (Ordinals - NE, SE...) */}
                        <path d="M50 20 L55 45 L80 50 L55 55 L50 80 L45 55 L20 50 L45 45 Z" fill="#334155" />
                        
                        {/* 4 Point Star (Cardinals - N, E, S, W) - Main star on top */}
                        <path d="M50 5 L60 50 L50 95 L40 50 Z" fill="#475569" /> {/* Vertical Axis (Dark) */}
                        <path d="M5 50 L50 40 L95 50 L50 60 Z" fill="#475569" /> {/* Horizontal Axis (Dark) */}
                        
                        {/* North Point (Red Highlight) */}
                        <path d="M50 5 L58 50 L50 50 Z" fill="#ef4444" opacity="0.8" /> {/* Right Half */}
                        <path d="M50 5 L42 50 L50 50 Z" fill="#dc2626" /> {/* Left Half (Darker) */}

                        {/* South Point (Dark Blue/Grey) */}
                        <path d="M50 95 L58 50 L50 50 Z" fill="#1e293b" /> 
                        <path d="M50 95 L42 50 L50 50 Z" fill="#0f172a" />

                        {/* Labels */}
                        <text x="50" y="16" fontSize="8" fontWeight="bold" fill="#ef4444" textAnchor="middle">N</text>
                        <text x="50" y="90" fontSize="6" fontWeight="bold" fill="#94a3b8" textAnchor="middle">S</text>
                        <text x="88" y="52" fontSize="6" fontWeight="bold" fill="#94a3b8" textAnchor="middle">L</text>
                        <text x="12" y="52" fontSize="6" fontWeight="bold" fill="#94a3b8" textAnchor="middle">O</text>
                    </svg>
                </div>

                {/* 
                   B. DYNAMIC LAYERS: Rotating Elements
                   These rotate according to Azimuth
                */}
                <div 
                     className="absolute inset-0 transition-transform duration-75 ease-out will-change-transform flex items-center justify-center pointer-events-none"
                     style={{ transform: `rotate(${azimuth}deg)` }}
                >
                    {/* Precision Pointer (Golden Arrow) */}
                    {/* Orbiting Ring */}
                    <div className="absolute inset-[2px] rounded-full border border-yellow-400/30 border-dashed animate-spin-slow" style={{ animationDuration: '60s' }}></div>

                    {/* The Triangular Pointer */}
                    <div className="absolute -top-[6px] flex flex-col items-center filter drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[18px] border-b-yellow-400"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full -mt-1 border-2 border-slate-900 shadow-md"></div>
                    </div>
                </div>

                {/* C. PIVOT (Central Screw) */}
                <div className="absolute w-4 h-4 bg-slate-800 rounded-full z-10 border-2 border-slate-600 shadow-inner flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full opacity-50"></div>
                </div>
            </div>

            {/* 2. Compact Value Display (Bottom) */}
            <div className="bg-slate-900/90 backdrop-blur-md rounded-full px-2 py-1 shadow-xl border border-slate-700/50 flex items-center gap-2">
                <button 
                    onClick={() => adjustAzimuth(-1)}
                    className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
                >
                   <ChevronLeft size={14} />
                </button>
                
                <div className="text-sm font-black text-yellow-400 min-w-[3rem] text-center font-mono tracking-wider">
                    {azimuth}°
                </div>

                <button 
                    onClick={() => adjustAzimuth(1)}
                    className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
                >
                   <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
};
