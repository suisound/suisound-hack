'use client';

import { WalletKitProvider } from '@mysten/wallet-kit';
import { NETWORK } from '../config/network';

export function WalletProvider({ children }: { children: React.ReactNode }) {
    return (
        <WalletKitProvider features={['sui:signAndExecuteTransaction']} preferredNetwork={NETWORK}>
            {children}
        </WalletKitProvider>
    );
} 