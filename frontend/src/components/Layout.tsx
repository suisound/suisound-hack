'use client';

import { useState, useEffect } from 'react';
import { useWalletKit, ConnectButton } from '@mysten/wallet-kit';
import BlobAnimation from './BlobAnimation';
import { SuiWrapper } from '../lib/sui';
import AgentConfiguration from './AgentConfiguration';
import ElizaChat from './ElizaChat';
import Sidebar from './Sidebar';
import { useMobile } from './WalletProvider';
import ThreeBackground from './ThreeBackground';
import Link from 'next/link';
import '../styles/design-tokens.css';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { currentAccount, disconnect } = useWalletKit();
    const isMobile = useMobile();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [stakeInfo, setStakeInfo] = useState<{
        stakeAmount: bigint;
        isProStaker: boolean;
        rewards: bigint;
    }>({ stakeAmount: BigInt(0), isProStaker: false, rewards: BigInt(0) });
    const [currentView, setCurrentView] = useState<'dashboard' | 'configure' | 'chat'>('dashboard');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info';
        message: string;
    } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto-close sidebar on mobile
    useEffect(() => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    }, [isMobile]);

    // Fetch stake info when account changes
    useEffect(() => {
        const fetchStakeInfo = async () => {
            if (currentAccount?.address) {
                setIsLoading(true);
                setError(null);
                try {
                    const suiWrapper = SuiWrapper.getInstance();
                    const info = await suiWrapper.getStakeInfo(currentAccount.address);
                    console.log('Stake Info:', info);
                    setStakeInfo(info);
                    if (info.isProStaker) {
                        showNotification('success', 'Pro features unlocked!');
                    }
                } catch (error) {
                    console.error('Error fetching stake info:', error);
                    setError('Failed to load stake info. Please try again.');
                    showNotification('error', 'Failed to load stake information');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchStakeInfo();
    }, [currentAccount]);

    useEffect(() => {
        // Show onboarding only on first visit
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        if (hasSeenOnboarding) {
            setShowOnboarding(false);
        }
    }, []);

    const handleNavigation = (view: 'dashboard' | 'configure' | 'chat') => {
        setCurrentView(view);
        if (isMobile) {
            setIsSidebarOpen(false);
        }
        if (view === 'chat') {
            setIsChatOpen(true);
        }
    };

    const handleDismissOnboarding = () => {
        localStorage.setItem('hasSeenOnboarding', 'true');
        setShowOnboarding(false);
    };

    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000); // Auto-dismiss after 5s
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen relative bg-[var(--bg-dark)] text-[var(--text-primary)]">
            <ThreeBackground />
            
            {/* Status Notifications */}
            <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
                {isLoading && (
                    <div className="bg-gray-900/95 text-white px-4 py-2 rounded-lg border border-purple-500/20 
                        shadow-lg backdrop-blur-sm animate-pulse mono-font text-sm flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                    </div>
                )}
                {error && (
                    <div className="bg-red-900/90 text-white px-4 py-2 rounded-lg border border-red-500/30 
                        shadow-lg backdrop-blur-sm mono-font text-sm flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}
                {notification && (
                    <div className={`${
                        notification.type === 'success' ? 'bg-green-900/90 border-green-500/30' :
                        notification.type === 'error' ? 'bg-red-900/90 border-red-500/30' :
                        'bg-blue-900/90 border-blue-500/30'
                    } text-white px-4 py-2 rounded-lg border shadow-lg backdrop-blur-sm mono-font text-sm flex items-center`}>
                        {notification.type === 'success' && (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        {notification.message}
                    </div>
                )}
            </div>

            <div className="relative z-[var(--z-elevate)]">
                {!currentAccount ? (
                    <div className="min-h-screen flex flex-col">
                        <header className="w-full border-b border-[var(--border-dark)] backdrop-blur-[var(--blur-default)] bg-[var(--bg-darker)]/80">
                            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                                <h1 className="cyberpunk-text text-2xl" data-text="suisound">
                                    suisound
                                </h1>
                                <div className="h-[32px] md:h-[40px]">
                                    <ConnectButton className="!font-['Orbitron'] !text-xs md:!text-sm !min-w-0 !flex !items-center !justify-center !px-2 md:!px-3 !py-0 !h-full cyberpunk-card" />
                                </div>
                            </div>
                        </header>
                        
                        <main className="flex-1 container mx-auto px-4 py-8">
                            <div className="grid gap-8">
                                {children}
                            </div>
                        </main>
                    </div>
                ) : (
                    <div className="relative z-[var(--z-default)] h-screen overflow-hidden">
                        {/* Main content wrapper */}
                        <div className={`h-full transition-[margin] duration-[var(--duration-normal)] ease-in-out
                            ${isSidebarOpen ? 'md:ml-[280px]' : 'ml-0'}`}>
                            {/* Header */}
                            <header className="sticky top-0 z-[var(--z-sticky)] bg-[var(--bg-darker)]/80 backdrop-blur-[var(--blur-default)] 
                                border-b border-[var(--border-dark)] shadow-[var(--shadow-md)]">
                                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 h-14 md:h-16 px-3 md:px-4">
                                    {/* Menu button with tooltip */}
                                    <div className="w-[40px] relative group">
                                        <button
                                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                            className="cyberpunk-card p-2 bg-gray-800/50 rounded-lg backdrop-blur-xl border border-purple-500/20 
                                            hover:bg-purple-500/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50
                                            relative overflow-hidden"
                                            aria-label="Toggle menu"
                                        >
                                            <div className="scanline opacity-10"></div>
                                            <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                            </svg>
                                        </button>
                                        <div className="absolute left-0 top-full mt-2 hidden group-hover:block">
                                            <div className="bg-gray-900/95 text-xs mono-font p-2 rounded-lg border border-purple-500/20 whitespace-nowrap">
                                                Toggle Navigation Menu
                                            </div>
                                        </div>
                                    </div>

                                    {/* Center section with branding and title */}
                                    <div className="flex justify-center items-center">
                                        <div className="flex flex-col items-center">
                                            <button 
                                                onClick={() => handleNavigation('dashboard')}
                                                className="cyberpunk-text text-2xl md:text-3xl font-bold hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-lg"
                                                data-text="suisound"
                                                aria-label="Go to dashboard"
                                            >
                                                suisound
                                            </button>
                                            <div className="mono-font text-xs md:text-sm text-purple-300/80 mt-0.5 tracking-wider">
                                                {currentView === 'dashboard' ? '> DASHBOARD_ACTIVE' : 
                                                 currentView === 'configure' ? '> CONFIG_MODE' : '> CHAT_INTERFACE'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right section with disconnect button */}
                                    <div className="w-[100px] md:w-[120px] h-[32px] md:h-[40px]">
                                        <div className="group relative" title="Disconnect wallet">
                                            <button
                                                onClick={disconnect}
                                                className="cyberpunk-card w-full h-full px-2 md:px-3 bg-red-500/20 hover:bg-red-500/30 
                                                text-white text-xs md:text-sm rounded-lg border border-red-500/30 hover:border-red-400/50 
                                                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 
                                                whitespace-nowrap shadow-lg backdrop-blur-sm hover:shadow-red-500/10 mono-font relative overflow-hidden"
                                                aria-label="Disconnect wallet"
                                            >
                                                <div className="scanline opacity-10"></div>
                                                <span className="relative z-10">DISCONNECT</span>
                                            </button>
                                            <div className="absolute right-0 top-full mt-2 hidden group-hover:block">
                                                <div className="bg-gray-900/95 text-xs mono-font p-2 rounded-lg border border-red-500/20">
                                                    Disconnect your wallet
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </header>
                            
                            {/* Onboarding overlay */}
                            {showOnboarding && currentAccount && (
                                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                                    <div className="max-w-md bg-gray-900/95 rounded-xl border border-purple-500/20 p-6 space-y-4">
                                        <h2 className="cyberpunk-text text-xl font-bold" data-text="WELCOME TO SUISOUND">
                                            WELCOME TO SUISOUND
                                        </h2>
                                        <div className="mono-font text-sm space-y-2 text-purple-300/80">
                                            <p>&gt; Quick Guide:</p>
                                            <ul className="space-y-1 text-xs">
                                                <li>• Use the menu button to navigate between views</li>
                                                <li>• Configure your AI agent in the CONFIG_MODE</li>
                                                <li>• Chat with your agent in CHAT_INTERFACE</li>
                                                <li>• Monitor your stake and rewards in DASHBOARD</li>
                                            </ul>
                                        </div>
                                        <button
                                            onClick={handleDismissOnboarding}
                                            className="w-full cyberpunk-card px-4 py-2 bg-purple-500/20 text-white rounded-lg 
                                                border border-purple-500/30 hover:bg-purple-500/30 
                                                transition-all duration-200 mono-font text-sm"
                                        >
                                            GOT IT
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Main content area */}
                            <main className="flex-1 flex flex-col bg-black/40 min-h-0 overflow-hidden">
                                <div className="flex-1 flex flex-col p-[var(--space-2)] md:p-[var(--space-4)] min-h-0">
                                    <div className="cyberpunk-card flex-1 bg-[var(--bg-darker)]/50 backdrop-blur-[var(--blur-lg)] rounded-[var(--radius-lg)] 
                                        border border-[var(--border-primary)] shadow-[var(--shadow-lg)] overflow-hidden flex flex-col 
                                        hover:border-[var(--border-secondary)] transition-colors duration-[var(--duration-normal)]
                                        relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-[var(--primary-purple-dark)]/5 
                                        before:to-transparent before:pointer-events-none">
                                        <div className="scanline opacity-10"></div>
                                        <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
                                            {currentView === 'dashboard' ? (
                                                <div className="flex-1 flex flex-col overflow-auto">{children}</div>
                                            ) : currentView === 'configure' ? (
                                                <div className="flex-1 flex flex-col overflow-auto"><AgentConfiguration /></div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </main>
                        </div>

                        {/* Chat Interface - Positioned above everything when open */}
                        {currentView === 'chat' && (
                            <ElizaChat 
                                isOpen={isChatOpen} 
                                onClose={() => {
                                    setIsSidebarOpen(!isSidebarOpen);
                                }} 
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}

                        {/* Sidebar */}
                        <Sidebar 
                            isOpen={isSidebarOpen}
                            currentView={currentView}
                            onNavigate={handleNavigation}
                            onClose={() => setIsSidebarOpen(false)}
                        />

                        {/* Overlay - Only show on mobile */}
                        <div 
                            className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden
                                ${isSidebarOpen ? 'opacity-100 z-[9998]' : 'opacity-0 pointer-events-none -z-10'}`}
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
} 