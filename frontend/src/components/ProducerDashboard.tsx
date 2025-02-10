'use client';

import { useState, useEffect } from 'react';
import { SuiWrapper } from '../lib/sui';
import { ConnectButton, useWalletKit } from '@mysten/wallet-kit';
import BackgroundAnimation from './BackgroundAnimation';
import BlobAnimation from './BlobAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import { TestMint } from './TestMint';

export default function ProducerDashboard() {
    const { currentAccount, signAndExecuteTransactionBlock } = useWalletKit();
    const connected = !!currentAccount;
    const [stakeAmount, setStakeAmount] = useState<string>('1');
    const [stakeInfo, setStakeInfo] = useState<{
        stakeAmount: bigint;
        isProStaker: boolean;
        rewards: bigint;
    }>({ stakeAmount: BigInt(0), isProStaker: false, rewards: BigInt(0) });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    const suiWrapper = SuiWrapper.getInstance();

    useEffect(() => {
        fetchStakeInfo();
    }, [currentAccount]);

    const fetchStakeInfo = async () => {
        if (currentAccount?.address) {
            setIsLoading(true);
            try {
                const info = await suiWrapper.getStakeInfo(currentAccount.address);
                setStakeInfo(info);
            } catch (error) {
                console.error('Error fetching stake info:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleStake = async () => {
        if (!currentAccount?.address) return;
        setLoading(true);
        setError('');
        
        try {
            const amountInMist = BigInt(parseFloat(stakeAmount) * 1_000_000_000);
            const tx = await suiWrapper.createStakeTransaction(currentAccount.address, amountInMist);
            await signAndExecuteTransactionBlock({ transactionBlock: tx });
            await fetchStakeInfo();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleUnstake = async () => {
        if (!currentAccount?.address) return;
        setLoading(true);
        setError('');
        
        try {
            const tx = await suiWrapper.createUnstakeTransaction(currentAccount.address);
            await signAndExecuteTransactionBlock({ transactionBlock: tx });
            await fetchStakeInfo();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleClaimRewards = async () => {
        if (!currentAccount?.address) return;
        setLoading(true);
        setError('');
        
        try {
            const tx = await suiWrapper.createClaimRewardsTransaction(currentAccount.address);
            await signAndExecuteTransactionBlock({ transactionBlock: tx });
            await fetchStakeInfo();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!currentAccount) {
        return (
            <div className="min-h-screen relative overflow-hidden bg-gray-900">
                <BlobAnimation />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/30 to-gray-900/70" />

                {/* Content */}
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
                    <div className="text-center max-w-2xl mx-auto backdrop-blur-lg bg-gray-900/30 p-8 rounded-2xl border border-gray-700 shadow-2xl">
                        <h1 
                            className="cyberpunk-text text-5xl font-bold mb-6"
                            data-text="Welcome to SuiSound Platform"
                        >
                            Welcome to SuiSound Platform
                        </h1>
                        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                            Join the next generation of decentralized music production. 
                            Stake your SUI tokens and become part of the revolution.
                        </p>
                        <div className="space-y-4">
                            <ConnectButton />
                            <p className="text-gray-400 text-sm">
                                Connect your wallet to start staking and earning rewards
                            </p>
                        </div>
                    </div>

                    {/* Stats or features */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {['Stake & Earn', 'Pro Benefits', 'Community'].map((title, index) => (
                            <div 
                                key={title}
                                className="cyberpunk-card backdrop-blur-lg bg-gray-900/30 p-6 rounded-xl border border-gray-700 transform transition-all duration-300 hover:scale-105 hover:border-blue-500"
                                style={{
                                    animationDelay: `${index * 200}ms`,
                                    animation: 'fadeIn 0.5s ease-out forwards'
                                }}
                            >
                                <div className="text-blue-400 mb-2 text-2xl font-bold">{title}</div>
                                <p className="text-gray-300">
                                    {/* Your description text */}
                                </p>
                                <div className="scanline"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-gray-400">Loading stake info...</p>
                    </div>
                ) : (
                    <motion.div 
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {[
                            {
                                title: 'Current Stake',
                                value: `${(Number(stakeInfo.stakeAmount) / 1_000_000_000).toFixed(2)} SUI`
                            },
                            {
                                title: 'Status',
                                value: stakeInfo.isProStaker ? 'Pro Staker' : 'Basic Staker'
                            },
                            {
                                title: 'Available Rewards',
                                value: `${(Number(stakeInfo.rewards) / 1_000_000_000).toFixed(2)} SUISOUND`
                            }
                        ].map((card, index) => (
                            <motion.div
                                key={card.title}
                                variants={item}
                                className="cyberpunk-card rounded-xl p-6 backdrop-blur-sm 
                                transition-all duration-300 hover:border-purple-500/30"
                            >
                                <h3 className="text-sm font-medium text-purple-200/70">{card.title}</h3>
                                <p className="mt-2 text-3xl font-bold cyberpunk-text" data-text={card.value}>
                                    {card.value}
                                </p>
                                <div className="scanline opacity-20"></div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                <div className="px-8 pb-8">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Stake Amount (SUI)
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                type="number"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                className="block w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800/50 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                                min="1"
                                step="1"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={handleStake}
                            disabled={loading}
                            className="flex-1 relative overflow-hidden bg-purple-600/20 hover:bg-purple-500/30 
                            text-white px-6 py-3 rounded-lg font-medium backdrop-blur-sm
                            border border-purple-500/30 hover:border-purple-400/50
                            transform transition-all duration-300 hover:scale-[1.02]"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : 'Stake SUI'}
                        </button>
                        
                        <button
                            onClick={handleUnstake}
                            disabled={loading || stakeInfo.stakeAmount === BigInt(0)}
                            className="flex-1 bg-red-600/80 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm"
                        >
                            Unstake
                        </button>
                        
                        <button
                            onClick={handleClaimRewards}
                            disabled={loading || stakeInfo.rewards === BigInt(0)}
                            className="flex-1 bg-green-600/80 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm"
                        >
                            Claim Rewards
                        </button>
                    </div>

                    {error && (
                        <div className="mt-6 rounded-lg bg-red-900/50 border border-red-500 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Test Mint Section */}
            {/* <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-bold mb-4">Test NFT Minting</h3>
                <TestMint />
            </div> */}
        </div>
    );
}

// Add stagger effect to cards
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}; 