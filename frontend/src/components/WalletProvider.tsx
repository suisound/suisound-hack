'use client';

import { WalletKitProvider } from '@mysten/wallet-kit';
import { NETWORK, NETWORK_URLS } from '../config/network';
import { useState, useEffect, createContext, useContext } from 'react';

// Create context for mobile state
export const MobileContext = createContext<boolean>(false);
export const useMobile = () => useContext(MobileContext);

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [showWarning, setShowWarning] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check for mobile device
    useEffect(() => {
        const checkMobile = () => {
            const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
            setIsMobile(mobile);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Listen for wallet dialogs (both connection and transaction)
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    // Check for any wallet modal or transaction approval dialog
                    const hasDialog = document.querySelector('[role="dialog"]');
                    const hasTransactionDialog = document.querySelector('[data-testid="wallet-kit-modal"]');
                    setShowWarning(!!(hasDialog || hasTransactionDialog));
                }
                // Also check for removals to hide the warning
                if (mutation.removedNodes.length) {
                    const hasAnyDialog = document.querySelector('[role="dialog"], [data-testid="wallet-kit-modal"]');
                    if (!hasAnyDialog) {
                        setShowWarning(false);
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    return (
        <MobileContext.Provider value={isMobile}>
            {showWarning && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 text-black px-4 py-2 text-center font-medium backdrop-blur-sm">
                    🚨 Important: This app runs on Sui Testnet - Please ensure your wallet is set to Testnet before connecting or making transactions! 🚨
                </div>
            )}
            <WalletKitProvider 
                features={['sui:signAndExecuteTransaction']}
                preferredWallets={['sui:sui-wallet']}
            >
                {children}
            </WalletKitProvider>
        </MobileContext.Provider>
    );
} 