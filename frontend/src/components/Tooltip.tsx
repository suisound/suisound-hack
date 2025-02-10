'use client';

import { useState, useRef, useEffect } from 'react';

interface Props {
    children: React.ReactNode;
    content: React.ReactNode;
    position?: 'top' | 'right' | 'bottom' | 'left';
}

export function Tooltip({ children, content, position = 'top' }: Props) {
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsVisible(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2'
    };

    return (
        <div className="relative inline-block" ref={containerRef}>
            <div onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsVisible(!isVisible);
            }}>
                {children}
            </div>
            
            {isVisible && (
                <div
                    ref={tooltipRef}
                    className={`
                        absolute z-50 
                        ${positionClasses[position]}
                        animate-in fade-in duration-200
                        bg-gray-900 text-white rounded-lg shadow-lg
                        border border-gray-700
                        p-3 max-w-sm
                    `}
                >
                    {/* Arrow */}
                    <div className={`
                        absolute w-2 h-2 bg-gray-900
                        transform rotate-45
                        border-gray-700
                        ${position === 'top' ? 'border-b border-r bottom-[-5px] left-1/2 -translate-x-1/2' :
                          position === 'right' ? 'border-b border-l left-[-5px] top-1/2 -translate-y-1/2' :
                          position === 'bottom' ? 'border-t border-l top-[-5px] left-1/2 -translate-x-1/2' :
                          'border-t border-r right-[-5px] top-1/2 -translate-y-1/2'}
                    `} />
                    
                    {/* Content */}
                    <div className="relative z-10">
                        {content}
                    </div>
                </div>
            )}
        </div>
    );
} 