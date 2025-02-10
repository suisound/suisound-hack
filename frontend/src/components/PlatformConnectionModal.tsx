'use client';

import { useState } from 'react';
import { Tooltip } from './Tooltip';

type Platform = 'twitter' | 'instagram' | 'discord';

interface Props {
    platform: Platform;
    isOpen: boolean;
    onClose: () => void;
    onSave: (credentials: any) => void;
}

export default function PlatformConnectionModal({ platform, isOpen, onClose, onSave }: Props) {
    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
        apiKey: '',
        apiSecret: ''
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800/90 rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold capitalize">{platform} Connection</h3>
                    <Tooltip 
                        content={
                            <div className="max-w-xs">
                                <p className="font-medium mb-1">🔒 Your data stays local</p>
                                <p className="text-sm text-gray-300">
                                    All credentials are securely stored in your browser and never sent to our servers. 
                                    They are only used directly with the platform's API.
                                </p>
                            </div>
                        }
                    >
                        <button className="p-1 text-gray-400 hover:text-gray-300 transition-colors">
                            <svg 
                                className="w-5 h-5" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                />
                            </svg>
                        </button>
                    </Tooltip>
                </div>
                
                <form className="space-y-4">
                    {platform === 'twitter' && (
                        <>
                            <input
                                type="text"
                                placeholder="Username"
                                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700/50 text-white"
                                value={credentials.username}
                                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700/50 text-white"
                                value={credentials.password}
                                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                            />
                        </>
                    )}
                    
                    {(platform === 'instagram' || platform === 'discord') && (
                        <>
                            <input
                                type="text"
                                placeholder="API Key"
                                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700/50 text-white"
                                value={credentials.apiKey}
                                onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
                            />
                            <input
                                type="password"
                                placeholder="API Secret"
                                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700/50 text-white"
                                value={credentials.apiSecret}
                                onChange={(e) => setCredentials({...credentials, apiSecret: e.target.value})}
                            />
                        </>
                    )}
                    
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-300 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-white rounded-lg
                            border border-purple-500/30 hover:border-purple-400/50 transition-all duration-200"
                        >
                            Connect
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 