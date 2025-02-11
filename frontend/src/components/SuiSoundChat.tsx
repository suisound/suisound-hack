'use client';

import React, { useState, useEffect } from 'react';
import { elizaApi } from '../lib/elizaApi';

interface Message {
  text: string;
  isUser: boolean;
}

export default function SuiSoundChat({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [agentName, setAgentName] = useState('Agent');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const fetchAgentInfo = async () => {
    try {
      const agent = await elizaApi.getAgent();
      if (agent?.name) {
        setAgentName(agent.name);
      }
    } catch (error) {
      console.error('Failed to get agent info:', error);
    }
  };

  // Fetch agent info initially and refresh periodically
  useEffect(() => {
    fetchAgentInfo();
    
    // Refresh agent info every 2 seconds to ensure we have the latest agent
    const interval = setInterval(fetchAgentInfo, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    // Add user message
    const userMessage = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Get agent response using the elizaApi service
      const response = await elizaApi.sendMessage(input, conversationId);
      
      // Store the conversation ID if this is the first message
      if (!conversationId && response[0]?.roomId) {
        setConversationId(response[0].roomId);
      }
      
      const agentMessage = {
        text: response[0]?.text || 'No response',
        isUser: false
      };
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Failed to get response:', error);
      setMessages(prev => [...prev, {
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-gray-800/30 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
          Chat with {agentName}
        </h3>
        <button
          onClick={() => {
            setMessages([]);
            setConversationId(null);
            onClose();
          }}
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.isUser
                  ? 'bg-purple-500/20 text-white border border-purple-500/30'
                  : 'bg-gray-700/50 text-white border border-gray-600'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-700/50 text-white border border-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500/50 animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-purple-500/50 animate-pulse delay-100" />
                <div className="w-3 h-3 rounded-full bg-purple-500/50 animate-pulse delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-700/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 placeholder-gray-400"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-6 py-2 bg-purple-500/20 text-white rounded-lg border border-purple-500/30 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
} 