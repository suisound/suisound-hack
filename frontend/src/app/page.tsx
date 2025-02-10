'use client';

import { WalletKitProvider } from '@mysten/wallet-kit';
import Layout from '../components/Layout';
import ProducerDashboard from '../components/ProducerDashboard';
import { MusicGenerator } from '../components/MusicGenerator';

export default function Home() {
    return (
        <WalletKitProvider>
            <Layout>
                <ProducerDashboard />
                <div className="mt-8">
                    <MusicGenerator />
                </div>
            </Layout>
        </WalletKitProvider>
    );
} 