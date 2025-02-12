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
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-2 md:p-4 overflow-y-auto">
                <div className="cyberpunk-card bg-gray-900/80 backdrop-blur-xl rounded-xl border border-purple-500/20 
                    shadow-2xl">
                    <div className="scanline opacity-10"></div>
                    <div className="p-1 md:p-4 space-y-2 md:space-y-4">
                        <h2 
                            className="cyberpunk-text text-base md:text-xl font-bold"
                            data-text="AGENT CONFIGURATION"
                        >
                            AGENT CONFIGURATION
                        </h2>
                        <p className="mono-font text-xs md:text-sm text-purple-300/80">
                            &gt; Configure your AI producer agent's personality, capabilities, and social presence.
                            <br/>&gt; Pro features require 1000 SUI stake.
                        </p>

                        <form className="space-y-2 md:space-y-4">
                            {/* Basic Info - Made more compact */}
                            <div>
                                <h3 className="cyberpunk-text text-xs md:text-sm font-bold mb-1 md:mb-2" data-text="AGENT_IDENTITY">
                                    AGENT_IDENTITY
                                </h3>
                                <div className="grid grid-cols-1 gap-1 md:gap-2">
                                    <div>
                                        <label className="mono-font text-[10px] md:text-xs font-medium text-purple-300/70 mb-0.5 block tracking-wider">
                                            &gt; AGENT_NAME
                                            <span className="text-gray-400 ml-1">(Your agent's public identity)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={config.name}
                                            onChange={(e) => setConfig({...config, name: e.target.value})}
                                            className="w-full px-2 py-1 text-xs md:text-sm rounded-lg bg-gray-800/50 text-white border border-gray-600/50 
                                                focus:outline-none focus:ring-1 focus:ring-purple-500/30 placeholder-gray-500 shadow-inner
                                                mono-font tracking-wide"
                                            placeholder="e.g., CyberBeats_2077, VaporWave_AI..."
                                        />
                                    </div>
                                    <div>
                                        <label className="mono-font text-[10px] md:text-xs font-medium text-purple-300/70 mb-0.5 block tracking-wider">
                                            &gt; PERSONALITY_MATRIX
                                            <span className="text-gray-400 ml-1">(Define agent behavior)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={config.bio}
                                            onChange={(e) => setConfig({...config, bio: e.target.value})}
                                            className="w-full px-2 py-1 text-xs md:text-sm rounded-lg bg-gray-800/50 text-white border border-gray-600/50 
                                                focus:outline-none focus:ring-1 focus:ring-purple-500/30 placeholder-gray-500 shadow-inner
                                                mono-font tracking-wide"
                                            placeholder="e.g., Cyberpunk producer, Lo-fi specialist..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Platform Integration */}
                            <div>
                                <h3 className="cyberpunk-text text-xs md:text-sm font-bold mb-1 md:mb-2" data-text="SOCIAL_MATRIX">
                                    SOCIAL_MATRIX
                                    <span className="mono-font text-[10px] md:text-xs font-normal text-gray-400 ml-2">Connect platforms</span>
                                </h3>
                                <div className="grid grid-cols-3 gap-1 md:gap-2">
                                    {Object.entries(config.platforms).map(([platform, settings], index) => (
                                        <div key={platform} 
                                            className="p-1 md:p-1.5 rounded-lg border border-purple-500/20 bg-gray-800/30"
                                        >
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center space-x-1 md:space-x-2">
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
                                                        className="form-checkbox h-2 w-2 md:h-3 md:w-3 text-purple-500 border-gray-600 bg-gray-700 rounded"
                                                    />
                                                    <span className="mono-font text-[10px] md:text-xs text-white tracking-wider uppercase">{platform}</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    className="p-0.5 md:p-1 text-gray-400"
                                                    onClick={() => {
                                                        setSelectedPlatform(platform as keyof typeof config.platforms);
                                                        setModalOpen(true);
                                                    }}
                                                    title="Configure platform settings"
                                                >
                                                    <svg className="w-2 h-2 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Features */}
                            <div>
                                <h3 className="cyberpunk-text text-xs md:text-sm font-bold mb-1 md:mb-2" data-text="CAPABILITY_MATRIX">
                                    CAPABILITY_MATRIX
                                    <span className="mono-font text-[10px] md:text-xs font-normal text-gray-400 ml-2">Define abilities</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-1 md:gap-2">
                                    {[
                                        { key: 'autonomousContent', label: 'AUTONOMOUS_POSTING', desc: 'Agent creates and posts content independently' },
                                        { key: 'audioGeneration', label: 'BEAT_GENERATION', desc: 'AI-powered music production' },
                                        { key: 'imageGeneration', label: 'VISUAL_SYNTHESIS', desc: 'Create artwork for releases' },
                                        { key: 'videoGeneration', label: 'VIDEO_CREATION', desc: 'Generate music videos and promos' }
                                    ].map(({ key, label, desc }, index) => (
                                        <label key={key} 
                                            className="p-1 md:p-1.5 rounded-lg border border-purple-500/20 bg-gray-800/30"
                                            title={desc}
                                        >
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={config.features[key as keyof typeof config.features]}
                                                    onChange={(e) => setConfig({
                                                        ...config,
                                                        features: {
                                                            ...config.features,
                                                            [key]: e.target.checked
                                                        }
                                                    })}
                                                    className="form-checkbox h-2 w-2 md:h-3 md:w-3 text-purple-500 border-gray-600 bg-gray-700 rounded"
                                                />
                                                <span className="mono-font text-[10px] md:text-xs text-white ml-1 md:ml-2 tracking-wider">
                                                    {label}
                                                </span>
                                            </div>
                                            <p className="mono-font text-[8px] md:text-[10px] text-gray-400 mt-0.5 md:mt-1 leading-tight">
                                                {desc}
                                            </p>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-1">
                                <p className="mono-font text-[10px] md:text-xs text-purple-300/60">
                                    &gt; Changes auto-save
                                </p>
                                <button
                                    type="submit"
                                    className="px-2 md:px-3 py-1 md:py-1.5 bg-purple-500/20 text-white rounded-lg 
                                        border border-purple-500/30 mono-font tracking-wider text-[10px] md:text-xs"
                                >
                                    <span className="relative z-10">&gt; DEPLOY_AGENT</span>
                                </button>
                            </div>
                        </form>
                    </div>
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