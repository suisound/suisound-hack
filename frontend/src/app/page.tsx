'use client';

import { WalletKitProvider } from '@mysten/wallet-kit';
import Layout from '../components/Layout';
import ProducerDashboard from '../components/ProducerDashboard';

export default function Home() {
    return (
        <WalletKitProvider>
            <Layout>
                <ProducerDashboard />
            </Layout>
        </WalletKitProvider>
    );
} 