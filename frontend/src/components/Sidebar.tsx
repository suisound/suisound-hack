'use client';

import React from 'react';

interface SidebarProps {
    isOpen: boolean;
    currentView: 'dashboard' | 'configure' | 'chat';
    onNavigate: (view: 'dashboard' | 'configure' | 'chat') => void;
    onClose: () => void;
}

export default function Sidebar({ isOpen, currentView, onNavigate }: SidebarProps) {
    return (
        <>
            {/* Sidebar - Fixed on mobile, static on desktop */}
            <aside 
                className={`fixed md:fixed inset-y-0 left-0 w-[280px] transform transition-transform duration-300 ease-in-out z-[9999] 
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="h-full bg-gray-900/95 backdrop-blur-xl border-r border-purple-500/20 cyberpunk-card">
                    <div className="scanline opacity-20"></div>
                    <div className="flex flex-col h-full relative z-10">
                        <div className="p-4 border-b border-purple-500/20">
                            <h2 
                                className="cyberpunk-text text-xl font-bold"
                                data-text="SYSTEM MENU"
                            >
                                SYSTEM MENU
                            </h2>
                            <p className="mono-font text-xs text-purple-300/70 mt-1 tracking-wider">
                                &gt; SELECT_MODULE
                            </p>
                        </div>
                        <nav className="flex-1 p-4 space-y-2">
                            <div className="group relative">
                                <button 
                                    onClick={() => onNavigate('dashboard')}
                                    className={`cyberpunk-card w-full flex items-center px-4 py-2.5 text-gray-300 mono-font tracking-wide
                                        hover:bg-purple-500/10 rounded-lg transition-all duration-300 relative overflow-hidden
                                        ${currentView === 'dashboard' ? 'bg-purple-500/20 border border-purple-500/30 text-purple-200' : 'border border-gray-700/50'}`}
                                    aria-label="Navigate to dashboard"
                                >
                                    <div className="scanline opacity-10"></div>
                                    <svg 
                                        className={`w-5 h-5 mr-3 ${currentView === 'dashboard' ? 'text-purple-400' : 'text-gray-400'}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                                        />
                                    </svg>
                                    &gt; DASHBOARD
                                </button>
                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block">
                                    <div className="bg-gray-900/95 text-xs mono-font p-2 rounded-lg border border-purple-500/20 whitespace-nowrap">
                                        View stake info and rewards
                                    </div>
                                </div>
                            </div>

                            <div className="group relative">
                                <button 
                                    onClick={() => onNavigate('chat')}
                                    className={`cyberpunk-card w-full flex items-center px-4 py-2.5 text-gray-300 mono-font tracking-wide
                                        hover:bg-purple-500/10 rounded-lg transition-all duration-300 relative overflow-hidden
                                        ${currentView === 'chat' ? 'bg-purple-500/20 border border-purple-500/30 text-purple-200' : 'border border-gray-700/50'}`}
                                    aria-label="Open chat interface"
                                >
                                    <div className="scanline opacity-10"></div>
                                    <svg 
                                        className={`w-5 h-5 mr-3 ${currentView === 'chat' ? 'text-purple-400' : 'text-gray-400'}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                                        />
                                    </svg>
                                    &gt; CHAT_INTERFACE
                                </button>
                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block">
                                    <div className="bg-gray-900/95 text-xs mono-font p-2 rounded-lg border border-purple-500/20 whitespace-nowrap">
                                        Chat with your AI agent
                                    </div>
                                </div>
                            </div>

                            <div className="group relative">
                                <button 
                                    onClick={() => onNavigate('configure')}
                                    className={`cyberpunk-card w-full flex items-center px-4 py-2.5 text-gray-300 mono-font tracking-wide
                                        hover:bg-purple-500/10 rounded-lg transition-all duration-300 relative overflow-hidden
                                        ${currentView === 'configure' ? 'bg-purple-500/20 border border-purple-500/30 text-purple-200' : 'border border-gray-700/50'}`}
                                    aria-label="Configure agent settings"
                                >
                                    <div className="scanline opacity-10"></div>
                                    <svg 
                                        className={`w-5 h-5 mr-3 ${currentView === 'configure' ? 'text-purple-400' : 'text-gray-400'}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                                        />
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                                        />
                                    </svg>
                                    &gt; CONFIG_MODE
                                </button>
                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block">
                                    <div className="bg-gray-900/95 text-xs mono-font p-2 rounded-lg border border-purple-500/20 whitespace-nowrap">
                                        Customize agent behavior and features
                                    </div>
                                </div>
                            </div>
                        </nav>
                    </div>
                </div>
            </aside>
        </>
    );
} 