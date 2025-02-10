'use client';

import { useState } from 'react';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

export default function ChatInterface() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        // Add user message
        const newMessage: Message = {
            role: 'user',
            content: message,
            timestamp: new Date()
        };
        
        setMessages([...messages, newMessage]);
        setMessage('');

        // TODO: Add API call to ElizaOS here
    };

    return (
        <div className="h-full flex flex-col">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-4 ${
                                msg.role === 'user'
                                    ? 'bg-purple-500/20 ml-4'
                                    : 'bg-gray-800/50 mr-4'
                            }`}
                        >
                            <p className="text-white">{msg.content}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {msg.timestamp.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Message input */}
            <div className="border-t border-gray-700 p-4">
                <form onSubmit={handleSubmit} className="flex space-x-4">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Type your message..."
                    />
                    <button
                        type="submit"
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-white px-6 py-2 rounded-lg
                        border border-purple-500/30 hover:border-purple-400/50 transition-all duration-200"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
} 