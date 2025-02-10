'use client';

import { useState, useEffect } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import BlobAnimation from './BlobAnimation';
import { SuiWrapper } from '../lib/sui';
import AgentConfiguration from './AgentConfiguration';
import ChatInterface from './ChatInterface';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { currentAccount } = useWalletKit();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [stakeInfo, setStakeInfo] = useState<{
        stakeAmount: bigint;
        isProStaker: boolean;
        rewards: bigint;
    }>({ stakeAmount: BigInt(0), isProStaker: false, rewards: BigInt(0) });
    const [currentView, setCurrentView] = useState<'dashboard' | 'configure' | 'chat'>('dashboard');

    // Fetch stake info when account changes
    useEffect(() => {
        const fetchStakeInfo = async () => {
            if (currentAccount?.address) {
                try {
                    const suiWrapper = SuiWrapper.getInstance();
                    const info = await suiWrapper.getStakeInfo(currentAccount.address);
                    console.log('Stake Info:', info);
                    setStakeInfo(info);
                } catch (error) {
                    console.error('Error fetching stake info:', error);
                }
            }
        };

        fetchStakeInfo();
    }, [currentAccount]);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Background with proper z-index */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-black" />
                {currentAccount && (
                    <div className="absolute inset-0 opacity-40">
                        <BlobAnimation />
                    </div>
                )}
            </div>

            {currentAccount ? (
                <div className="relative z-10 flex h-screen overflow-hidden">
                    {/* Sidebar */}
                    <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                        w-64 bg-gray-800/50 backdrop-blur-md transition-all duration-400 ease-in-out border-r border-gray-700/50`}>
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-gray-700/50">
                                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                                    SuiSound Platform
                                </h1>
                                <p className="text-sm text-gray-400 mt-1">AI-Powered Music Production</p>
                            </div>
                            <nav className="flex-1 p-4">
                                <ul className="space-y-4">
                                    {/* Dashboard Button */}
                                    <li>
                                        <button 
                                            onClick={() => setCurrentView('dashboard')}
                                            className={`w-full flex items-center px-4 py-2 text-gray-300 
                                            hover:bg-gray-700/50 rounded-lg ${currentView === 'dashboard' ? 'bg-gray-700/50' : ''}`}
                                        >
                                            <svg 
                                                className="w-5 h-5 mr-3 text-gray-400" 
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
                                            Dashboard
                                        </button>
                                    </li>

                                    {/* New Chat Button */}
                                    <li>
                                        <button 
                                            onClick={() => setCurrentView('chat')}
                                            className="w-full flex items-center px-4 py-3 text-gray-300 
                                            bg-purple-500/20 hover:bg-purple-500/30 rounded-lg
                                            border border-purple-500/30 hover:border-purple-400/50
                                            transition-all duration-200 group"
                                        >
                                            <svg 
                                                className="w-5 h-5 mr-3 text-purple-400 group-hover:text-purple-300" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M12 4v16m8-8H4" 
                                                />
                                            </svg>
                                            New Chat
                                        </button>
                                    </li>

                                    {/* Configure Agent */}
                                    <li>
                                        <button 
                                            onClick={() => setCurrentView('configure')}
                                            className={`w-full flex items-center px-4 py-2 text-gray-300 
                                            hover:bg-gray-700/50 rounded-lg ${currentView === 'configure' ? 'bg-gray-700/50' : ''}`}
                                        >
                                            <svg 
                                                className="w-5 h-5 mr-3 text-gray-400" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                                                />
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                                                />
                                            </svg>
                                            Configure Agent
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-400 ease-in-out`}>
                        {/* Header with hamburger menu */}
                        <div className="sticky top-0 z-50 bg-gray-800/50 backdrop-blur-md border-b border-gray-700/50">
                            <div className="flex items-center h-16 px-4">
                                <button
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className="p-2 mr-4 bg-gray-800/50 rounded-lg backdrop-blur-md border border-gray-700/50 
                                    hover:bg-gray-700/50 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                
                                {/* Current section title */}
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold">Dashboard</h2>
                                </div>
                            </div>
                        </div>

                        {/* Main content area with proper padding */}
                        <main className="h-[calc(100vh-4rem)] overflow-auto p-6">
                            {currentView === 'dashboard' ? (
                                children
                            ) : currentView === 'configure' ? (
                                <AgentConfiguration />
                            ) : (
                                <ChatInterface />
                            )}
                        </main>
                    </div>
                </div>
            ) : (
                // Welcome screen
                <div className="relative z-10">
                    {/* Add branding to welcome screen */}
                    <div className="absolute top-6 left-6">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                            SuiSound Platform
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">AI-Powered Music Production</p>
                    </div>
                    {children}
                </div>
            )}
        </div>
    );
} 