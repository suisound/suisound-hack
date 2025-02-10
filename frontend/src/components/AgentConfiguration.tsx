'use client';

import { useState } from 'react';
import { Tooltip } from './Tooltip';
import PlatformConnectionModal from './PlatformConnectionModal';

export default function AgentConfiguration() {
    const [config, setConfig] = useState({
        name: '',
        bio: '',
        platforms: {
            twitter: { enabled: false, password: '' },
            instagram: { enabled: false, password: '' },
            discord: { enabled: false, password: '' }
        },
        features: {
            autonomousContent: false,
            audioGeneration: false,
            imageGeneration: false,
            videoGeneration: false
        }
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<keyof typeof config.platforms | null>(null);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
                <div className="p-8">
                    <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                        Agent Configuration
                    </h2>

                    <form className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Agent Name
                                </label>
                                <input
                                    type="text"
                                    value={config.name}
                                    onChange={(e) => setConfig({...config, name: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700/50 text-white"
                                    placeholder="Enter agent name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Bio/Personality
                                </label>
                                <textarea
                                    value={config.bio}
                                    onChange={(e) => setConfig({...config, bio: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700/50 text-white h-32"
                                    placeholder="Describe your agent's personality and behavior"
                                />
                            </div>
                        </div>

                        {/* Platform Integration */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-200 mb-4">Platform Integration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.entries(config.platforms).map(([platform, settings]) => (
                                    <div key={platform} className="p-4 rounded-lg border border-gray-700 bg-gray-800/30">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.enabled}
                                                    onChange={(e) => setConfig({
                                                        ...config,
                                                        platforms: {
                                                            ...config.platforms,
                                                            [platform]: { ...settings, enabled: e.target.checked }
                                                        }
                                                    })}
                                                    className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                                                />
                                                <span className="ml-2 text-gray-300 capitalize">{platform}</span>
                                            </label>
                                            <div className="flex items-center space-x-2">
                                                <Tooltip 
                                                    content={
                                                        <div className="max-w-xs">
                                                            <p className="text-sm text-gray-300">
                                                                {platform === 'twitter' ? 
                                                                    'Connect with your Twitter account credentials' :
                                                                    'Connect using API credentials from your developer account'}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                🔒 Credentials are stored locally and used only for direct API calls
                                                            </p>
                                                        </div>
                                                    }
                                                    position="left"
                                                >
                                                    <button className="p-1 text-gray-400 hover:text-gray-300">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </button>
                                                </Tooltip>
                                                <button
                                                    type="button"
                                                    className="p-1 text-gray-400 hover:text-gray-300"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setSelectedPlatform(platform as keyof typeof config.platforms);
                                                        setModalOpen(true);
                                                    }}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Features */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-200 mb-4">Features</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(config.features).map(([feature, enabled]) => (
                                    <label key={feature} className="flex items-center p-4 rounded-lg border border-gray-700 bg-gray-800/30">
                                        <input
                                            type="checkbox"
                                            checked={enabled}
                                            onChange={(e) => setConfig({
                                                ...config,
                                                features: {
                                                    ...config.features,
                                                    [feature]: e.target.checked
                                                }
                                            })}
                                            className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                                        />
                                        <span className="ml-2 text-gray-300 capitalize">
                                            {feature.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-6">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-white rounded-lg
                                border border-purple-500/30 hover:border-purple-400/50 transition-all duration-200"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {modalOpen && selectedPlatform && (
                <PlatformConnectionModal
                    platform={selectedPlatform}
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSave={(credentials) => {
                        setConfig({
                            ...config,
                            platforms: {
                                ...config.platforms,
                                [selectedPlatform]: {
                                    ...config.platforms[selectedPlatform],
                                    ...credentials
                                }
                            }
                        });
                        setModalOpen(false);
                    }}
                />
            )}
        </div>
    );
} 