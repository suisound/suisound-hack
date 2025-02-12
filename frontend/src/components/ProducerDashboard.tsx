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
    const [suiSoundBalance, setSuiSoundBalance] = useState<bigint>(BigInt(0));

    const suiWrapper = SuiWrapper.getInstance();

    useEffect(() => {
        fetchStakeInfo();
        fetchSuiSoundBalance();
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

    const fetchSuiSoundBalance = async () => {
        if (currentAccount?.address) {
            try {
                const balance = await suiWrapper.getSuiSoundBalance(currentAccount.address);
                setSuiSoundBalance(balance);
            } catch (error) {
                console.error('Error fetching SUI Sound balance:', error);
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
            <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 py-8">
                {/* Main content */}
                <div className="max-w-4xl w-full space-y-12">
                    {/* Hero section */}
                    <div className="text-center space-y-6">
                        <h2 className="cyberpunk-text text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
                            data-text="Next-Gen Music Production">
                            Next-Gen Music Production
                        </h2>
                        <p className="mono-font text-lg md:text-xl text-purple-300/80 max-w-2xl mx-auto leading-relaxed">
                            Create, train, and monetize autonomous AI music producers powered by blockchain technology.
                        </p>
                    </div>

                    {/* Feature grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'AI-Powered Creation',
                                desc: 'Generate unique beats and melodies using advanced AI models. Train your agent with your style preferences.',
                                icon: (
                                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                )
                            },
                            {
                                title: 'Web3 Integration',
                                desc: 'Seamless blockchain integration for secure ownership and trading. Stake SUI tokens to unlock pro features.',
                                icon: (
                                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                )
                            },
                            {
                                title: 'Monetization',
                                desc: 'Turn your AI agents into NFTs. Earn from beats they create and their social engagement.',
                                icon: (
                                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )
                            }
                        ].map((feature, i) => (
                            <div key={feature.title}
                                className="cyberpunk-card relative p-6 bg-gray-900/50 backdrop-blur-xl rounded-xl border border-purple-500/20 
                                    hover:border-purple-500/40 transition-all duration-300 group overflow-hidden">
                                <div className="scanline opacity-10"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                            {feature.icon}
                                        </div>
                                        <h3 className="cyberpunk-text text-xl font-bold" data-text={feature.title}>
                                            {feature.title}
                                        </h3>
                                    </div>
                                    <p className="mono-font text-sm text-gray-300/90 leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Stats or highlights */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'AGENTS CREATED', value: '1.2K+' },
                            { label: 'BEATS GENERATED', value: '50K+' },
                            { label: 'TOTAL STAKED', value: '500K SUI' },
                            { label: 'ACTIVE PRODUCERS', value: '850+' }
                        ].map((stat) => (
                            <div key={stat.label} 
                                className="cyberpunk-card relative p-4 bg-gray-900/30 backdrop-blur-sm rounded-lg border border-purple-500/20 
                                    text-center group hover:border-purple-500/40 transition-all duration-300">
                                <div className="scanline opacity-10"></div>
                                <div className="relative z-10">
                                    <div className="cyberpunk-text text-xl md:text-2xl font-bold text-purple-300" data-text={stat.value}>
                                        {stat.value}
                                    </div>
                                    <div className="mono-font text-[10px] md:text-xs text-gray-400 mt-1">
                                        {stat.label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            <div className="flex-1 flex flex-col">
                {isLoading ? (
                    <div className="p-2 md:p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-1 text-sm text-gray-400">Loading...</p>
                    </div>
                ) : (
                    <motion.div 
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="p-2 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4"
                    >
                        {[
                            {
                                title: 'SUISOUND Balance',
                                value: `${(Number(suiSoundBalance)).toFixed(2)} SUISOUND`,
                                desc: 'Your current balance'
                            },
                            {
                                title: 'Pending Rewards',
                                value: `${(Number(stakeInfo.rewards)).toFixed(2)} SUISOUND`,
                                desc: stakeInfo.rewards > BigInt(0) ? '✨ Ready to claim!' : 'Accumulating...'
                            },
                            {
                                title: 'Producer Status',
                                value: `${(Number(stakeInfo.stakeAmount) / 1_000_000_000).toFixed(2)} SUI`,
                                desc: stakeInfo.stakeAmount >= BigInt(1_000_000_000) ? 'Pro Status Active' : 'Need 1000 SUI for Pro'
                            }
                        ].map((card, index) => (
                            <motion.div
                                key={card.title}
                                variants={item}
                                className="cyberpunk-card rounded-lg p-3 backdrop-blur-sm 
                                transition-all duration-300 hover:border-purple-500/30 flex flex-col w-full"
                            >
                                <h3 className="mono-font text-sm md:text-base font-medium text-purple-200">{card.title}</h3>
                                <p className="cyberpunk-text text-lg md:text-2xl font-bold mt-1" data-text={card.value}>
                                    {card.value}
                                </p>
                                <p className="mono-font text-xs md:text-sm text-gray-400 mt-1">
                                    {card.desc}
                                </p>
                                <div className="scanline opacity-20"></div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                <div className="px-2 pb-2">
                    <div className="cyberpunk-card bg-gray-900/50 p-2 rounded-lg border border-purple-500/20 mb-2">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="cyberpunk-text text-sm font-bold" data-text="QUICK GUIDE">
                                QUICK GUIDE
                            </h2>
                            <span className="mono-font text-[10px] text-purple-300/60 flex items-center">
                                <span className="mr-1">&gt;</span>READY
                            </span>
                        </div>
                        <div className="mono-font text-[10px] text-purple-300/80 grid grid-cols-3 gap-1">
                            <div>&gt; STAKE</div>
                            <div>&gt; CONFIG</div>
                            <div>&gt; CREATE</div>
                        </div>
                    </div>

                    <div className="mb-2">
                        <div className="flex items-center justify-between">
                            <label className="mono-font block text-[10px] font-medium text-gray-300">
                                Stake Amount
                            </label>
                            <span className="mono-font text-[8px] text-purple-300/60">Min: 1 SUI | Pro: 1000 SUI</span>
                        </div>
                        <div className="mt-0.5 relative rounded-md shadow-sm">
                            <input
                                type="number"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                className="mono-font block w-full px-2 py-1 text-xs rounded-lg border border-gray-600 bg-gray-700/50 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                                min="1"
                                step="1"
                                disabled={loading}
                                placeholder="Enter amount..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                        <button
                            onClick={handleStake}
                            disabled={loading}
                            className="mono-font relative overflow-hidden bg-purple-600/20 hover:bg-purple-500/30 
                            text-white px-2 py-1 text-xs rounded-lg font-medium backdrop-blur-sm
                            border border-purple-500/30 hover:border-purple-400/50
                            transform transition-all duration-300"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Wait
                                </span>
                            ) : 'Stake'}
                        </button>
                        
                        <button
                            onClick={handleUnstake}
                            disabled={loading || stakeInfo.stakeAmount === BigInt(0)}
                            className="mono-font bg-red-600/80 hover:bg-red-500 text-white px-2 py-1 text-xs rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm"
                            title="Unstake your SUI tokens"
                        >
                            Unstake
                        </button>
                        
                        <button
                            onClick={handleClaimRewards}
                            disabled={loading || stakeInfo.rewards === BigInt(0)}
                            className="mono-font bg-green-600/80 hover:bg-green-500 text-white px-2 py-1 text-xs rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm"
                            title="Claim your earned SUISOUND tokens"
                        >
                            Claim
                        </button>
                    </div>

                    {error && (
                        <div className="mt-1.5 rounded-lg bg-red-900/50 border border-red-500 p-1.5">
                            <div className="flex items-center">
                                <svg className="h-3 w-3 text-red-400 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="text-[10px] text-red-400">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
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