'use client';

import { useState } from 'react';
import { Tooltip } from './Tooltip';
import PlatformConnectionModal from './PlatformConnectionModal';
import { elizaApi, type AgentConfig } from '../lib/elizaApi';

type Platform = 'twitter' | 'instagram' | 'discord';

export default function AgentConfiguration() {
    const [config, setConfig] = useState<AgentConfig>({
        name: '',
        description: '',
        bio: [],
        lore: [],
        system: 'You are a helpful AI assistant for music production and promotion.',
        plugins: [],
        clients: [],
        messageExamples: [],
        postExamples: [],
        topics: [],
        adjectives: [],
        style: {
            all: [],
            chat: [],
            post: []
        }
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleDescriptionChange = async (description: string) => {
        setConfig(prev => ({ ...prev, description }));
        
        if (description.length > 30) { // Only generate after a meaningful description
            setIsGenerating(true);
            try {
                const details = await elizaApi.generateAgentDetails(description);
                setConfig(prev => ({
                    ...prev,
                    ...details,
                    // Keep the original description and name
                    description: prev.description,
                    name: prev.name
                }));
            } catch (err) {
                console.error('Failed to generate agent details:', err);
            } finally {
                setIsGenerating(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (!config.name) {
                throw new Error('Agent name is required');
            }

            const userId = 'user-123'; // Replace with actual user ID from your auth system
            console.log('Sending agent config:', config);
            const agent = await elizaApi.registerAgent(config, userId);
            console.log('Agent registered successfully:', agent);
            
            // Reset form with all required fields
            setConfig({
                name: '',
                description: '',
                bio: [],
                lore: [],
                system: 'You are a helpful AI assistant for music production and promotion.',
                plugins: [],
                clients: [],
                messageExamples: [],
                postExamples: [],
                topics: [],
                adjectives: [],
                style: {
                    all: [],
                    chat: [],
                    post: []
                }
            });
            
            // Show success message
            setSuccessMessage('Agent registered successfully!');
            
            // Clear success message after 5 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
        } catch (err) {
            console.error('Registration error:', err);
            setError(err instanceof Error ? err.message : 'Failed to register agent');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-2 md:p-4 overflow-y-auto">
                {/* Success Message */}
                {successMessage && (
                    <div className="fixed top-4 right-4 z-50">
                        <div className="bg-green-500/20 border border-green-500/30 text-green-300 p-4 rounded-lg mono-font text-sm shadow-xl backdrop-blur-sm">
                            <div className="flex items-center space-x-2">
                                <span className="text-green-400">✓</span>
                                <span>{successMessage}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="cyberpunk-card bg-gray-900/80 backdrop-blur-xl rounded-xl border border-purple-500/20 shadow-2xl">
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
                        </p>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-2 rounded-lg mono-font text-xs">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Basic Information */}
                            <div className="space-y-2">
                                <div>
                                    <label className="mono-font text-[10px] md:text-xs font-medium text-purple-300/70 mb-0.5 block tracking-wider">
                                        &gt; AGENT_NAME
                                        <span className="text-gray-400 ml-1">(Required)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={config.name}
                                        onChange={(e) => setConfig({...config, name: e.target.value})}
                                        className="w-full px-2 py-1 text-xs md:text-sm rounded-lg bg-gray-800/50 text-white border border-gray-600/50 
                                            focus:outline-none focus:ring-1 focus:ring-purple-500/30 placeholder-gray-500 shadow-inner
                                            mono-font tracking-wide relative z-10"
                                        placeholder="e.g., MusicMaestro"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mono-font text-[10px] md:text-xs font-medium text-purple-300/70 mb-0.5 block tracking-wider">
                                        &gt; AGENT_DESCRIPTION
                                        <span className="text-gray-400 ml-1">(Describe your agent's personality)</span>
                                    </label>
                                    <textarea
                                        value={config.description}
                                        onChange={(e) => handleDescriptionChange(e.target.value)}
                                        className="w-full px-2 py-1 text-xs md:text-sm rounded-lg bg-gray-800/50 text-white border border-gray-600/50 
                                            focus:outline-none focus:ring-1 focus:ring-purple-500/30 placeholder-gray-500 shadow-inner
                                            mono-font tracking-wide min-h-[100px] relative z-10"
                                        placeholder="Describe your agent's personality, style, and role..."
                                    />
                                    {isGenerating && (
                                        <p className="text-xs text-purple-400/70 mt-1">Generating agent details...</p>
                                    )}
                                </div>

                                {/* Preview of generated details */}
                                {config.bio && config.bio.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <h3 className="mono-font text-xs font-medium text-purple-300/70">&gt; GENERATED_PROFILE</h3>
                                        <div className="bg-black/30 rounded-lg p-3 space-y-2">
                                            <div>
                                                <h4 className="text-xs text-purple-300/70 mb-1">Bio:</h4>
                                                <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                                                    {config.bio.map((item, i) => (
                                                        <li key={i}>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            {config.lore && (
                                                <div>
                                                    <h4 className="text-xs text-purple-300/70 mb-1">Lore:</h4>
                                                    <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                                                        {config.lore.map((item, i) => (
                                                            <li key={i}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-1">
                                <p className="mono-font text-[10px] md:text-xs text-purple-300/60">
                                    {isLoading ? '> Processing...' : '> Ready to deploy'}
                                </p>
                                <button
                                    type="submit"
                                    disabled={isLoading || !config.name || isGenerating}
                                    className="px-2 md:px-3 py-1 md:py-1.5 bg-purple-500/20 text-white rounded-lg 
                                        border border-purple-500/30 mono-font tracking-wider text-[10px] md:text-xs
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        hover:bg-purple-500/30 transition-colors"
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
                            settings: {
                                ...config.settings,
                                secrets: {
                                    ...config.settings?.secrets,
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