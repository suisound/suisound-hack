'use client';

import { useState } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { SuiWrapper } from '../lib/sui';
import { CONTENT_TYPES } from '../config/constants';

export function TestMint() {
    const { currentAccount, signAndExecuteTransactionBlock } = useWalletKit();
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [debug, setDebug] = useState<string>('');

    const testMintNFT = async () => {
        if (!currentAccount?.address) {
            setStatus('No wallet connected');
            return;
        }

        try {
            setLoading(true);
            setStatus('Creating NFT transaction...');
            const suiWrapper = SuiWrapper.getInstance();

            // Test NFT metadata
            const testNFT = {
                name: "TestMusicNFT",
                description: "This_is_a_test_music_NFT",
                url: "https://example.com/test-music.mp3",
                contentType: CONTENT_TYPES.AUDIO
            };

            const tx = await suiWrapper.mintContentNFT(
                currentAccount.address,
                testNFT.name,
                testNFT.description,
                testNFT.url,
                testNFT.contentType
            );

            setStatus('Executing transaction...');
            const result = await signAndExecuteTransactionBlock({
                transactionBlock: tx,
            });

            console.log('Mint result:', result);
            setStatus(`NFT minted successfully! Digest: ${result.digest}`);
        } catch (error) {
            console.error('Error minting NFT:', error);
            setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const debugProducerAccess = async () => {
        if (!currentAccount?.address) return;
        
        const suiWrapper = SuiWrapper.getInstance();
        const stakeInfo = await suiWrapper.getStakeInfo(currentAccount.address);
        const producerAccess = await suiWrapper.getProducerAccess(currentAccount.address);
        
        // Convert BigInt values to strings for JSON serialization
        const debugInfo = {
            stakeInfo: {
                stakeAmount: stakeInfo.stakeAmount.toString(),
                isProStaker: stakeInfo.isProStaker,
                rewards: stakeInfo.rewards.toString()
            },
            producerAccess: producerAccess ? {
                ...producerAccess,
                // Convert any BigInt fields if they exist
                data: producerAccess.data ? {
                    ...producerAccess.data,
                    content: producerAccess.data.content ? {
                        ...producerAccess.data.content,
                        fields: {
                            ...((producerAccess.data.content as any)?.fields || {}),
                            // Convert specific BigInt fields if they exist
                            stake_amount: (producerAccess.data.content as any)?.fields?.stake_amount?.toString()
                        }
                    } : null
                } : null
            } : null
        };

        setDebug(JSON.stringify(debugInfo, null, 2));
    };

    return (
        <div className="space-y-4">
            <button
                onClick={testMintNFT}
                disabled={loading}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-white rounded-lg
                border border-purple-500/30 hover:border-purple-400/50 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Minting...
                    </span>
                ) : (
                    'Test Mint NFT'
                )}
            </button>

            <button
                onClick={debugProducerAccess}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-white rounded-lg
                border border-blue-500/30 hover:border-blue-400/50 transition-all duration-200"
            >
                Debug Producer Access
            </button>

            {status && (
                <div className={`p-4 rounded-lg border ${
                    status.includes('Error') 
                        ? 'bg-red-900/20 border-red-500/50 text-red-200'
                        : 'bg-gray-800/50 border-gray-700 text-gray-200'
                }`}>
                    {status}
                </div>
            )}

            {debug && (
                <pre className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-200 overflow-auto">
                    {debug}
                </pre>
            )}
        </div>
    );
} 