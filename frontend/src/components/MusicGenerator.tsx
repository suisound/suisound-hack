'use client';

import { useState } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';

const API_URL = 'http://192.168.86.246:5000';

interface GenerationRequest {
    prompt: string;
    duration: number;
    style: string;
    format: string;
}

export function MusicGenerator() {
    const { currentAccount } = useWalletKit();
    const [prompt, setPrompt] = useState('happy electronic music');
    const [duration, setDuration] = useState(30);
    const [style, setStyle] = useState('electronic');
    const [format, setFormat] = useState('wav');
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    const authenticate = async () => {
        try {
            if (!currentAccount?.address) {
                throw new Error('Please connect your wallet first');
            }

            setStatus('authenticating');
            setError(null);

            const response = await fetch(`${API_URL}/auth`, {
                method: 'POST',
                headers: {
                    'X-Wallet-Address': currentAccount.address,
                    'X-Signature': 'test',  // Using test values since backend accepts any
                    'X-Nonce': 'test'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || 'Authentication failed');
            }

            setAccessToken(data.token);
            return data.token;
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Authentication failed');
            throw error;
        } finally {
            setStatus('idle');
        }
    };

    const generateMusic = async () => {
        try {
            if (!currentAccount?.address) {
                throw new Error('Please connect your wallet first');
            }

            setStatus('generating');
            setError(null);
            setAudioUrl(null);

            // First authenticate if needed
            let token = accessToken;
            if (!token) {
                token = await authenticate();
            }

            // Send generation request
            const response = await fetch(`${API_URL}/api/v1/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Access-Token': token
                },
                body: JSON.stringify({
                    prompt,
                    duration,
                    style,
                    format
                })
            });

            let data = await response.json();

            if (!response.ok) {
                // If token expired or invalid, try to authenticate again
                if (response.status === 401) {
                    setAccessToken(null);
                    token = await authenticate();
                    // Retry the request with new token
                    const retryResponse = await fetch(`${API_URL}/api/v1/generate`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Access-Token': token
                        },
                        body: JSON.stringify({
                            prompt,
                            duration,
                            style,
                            format
                        })
                    });

                    if (!retryResponse.ok) {
                        throw new Error((await retryResponse.json()).details || 'Generation failed after retry');
                    }

                    data = await retryResponse.json();
                } else {
                    throw new Error(data.details || 'Generation failed');
                }
            }

            const { task_id } = data;
            
            // Poll for status
            const checkInterval = setInterval(async () => {
                try {
                    const statusResponse = await fetch(`${API_URL}/api/v1/status/${task_id}`, {
                        headers: {
                            'X-Access-Token': token
                        }
                    });

                    if (!statusResponse.ok) {
                        throw new Error('Status check failed');
                    }

                    // If it's audio data, we'll get a blob
                    const contentType = statusResponse.headers.get('content-type');
                    if (contentType?.startsWith('audio/')) {
                        clearInterval(checkInterval);
                        const blob = await statusResponse.blob();
                        const url = URL.createObjectURL(blob);
                        setAudioUrl(url);
                        setStatus('completed');
                        return;
                    }

                    // Otherwise it's a status update
                    const statusData = await statusResponse.json();
                    if (statusData.status === 'failed') {
                        clearInterval(checkInterval);
                        throw new Error(statusData.error || 'Generation failed');
                    }
                    setStatus(statusData.status);
                } catch (error) {
                    clearInterval(checkInterval);
                    setStatus('failed');
                    setError(error instanceof Error ? error.message : 'Status check failed');
                }
            }, 1000);
        } catch (error) {
            setStatus('failed');
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto bg-gray-800/30 rounded-xl shadow-lg backdrop-blur-sm">
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Music Generator</h2>
                
                <div className="space-y-4">
                    {/* Prompt Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Prompt
                        </label>
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
                            placeholder="Describe your music..."
                        />
                    </div>

                    {/* Duration Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Duration (seconds)
                        </label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
                            min="1"
                            max="300"
                        />
                    </div>

                    {/* Style Select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Style
                        </label>
                        <select
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
                        >
                            <option value="electronic">Electronic</option>
                            <option value="hip-hop">Hip Hop</option>
                            <option value="ambient">Ambient</option>
                            <option value="drum-and-bass">Drum & Bass</option>
                            <option value="lofi">Lo-Fi</option>
                        </select>
                    </div>

                    {/* Format Select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Format
                        </label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
                        >
                            <option value="wav">WAV</option>
                            <option value="mp3">MP3</option>
                        </select>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={generateMusic}
                        disabled={status === 'generating' || status === 'authenticating'}
                        className={`w-full px-4 py-3 rounded-lg font-medium text-white 
                        ${status === 'generating' || status === 'authenticating'
                            ? 'bg-purple-600/50 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700 transition-colors'
                        }`}
                    >
                        {status === 'generating' ? 'Generating...' :
                         status === 'authenticating' ? 'Authenticating...' :
                         'Generate Music'}
                    </button>

                    {/* Status */}
                    {status !== 'idle' && status !== 'failed' && (
                        <div className="text-gray-300">
                            Status: {status}
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-500/50">
                            {error}
                        </div>
                    )}

                    {/* Audio Player */}
                    {audioUrl && (
                        <div className="mt-4">
                            <audio 
                                controls 
                                src={audioUrl}
                                className="w-full"
                            />
                            <a 
                                href={audioUrl}
                                download={`generated-music.${format}`}
                                className="mt-2 inline-block text-blue-400 hover:text-blue-300"
                            >
                                Download
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 