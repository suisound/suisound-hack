'use client';

import React, { useState, useEffect } from 'react';
import { elizaApi, ChatMessage } from '../lib/elizaApi';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletKit } from '@mysten/wallet-kit';
import { STORAGE_KEY_PREFIX, stringToUuid } from '../lib/elizaApi';

interface Message {
  text: string;
  isUser: boolean;
  timestamp?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isSidebarOpen: boolean;
  agentId?: string;
}

export default function ElizaChat({ isOpen, onClose, isSidebarOpen, agentId: providedAgentId }: Props) {
  const { currentAccount } = useWalletKit();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(() => {
    // Try to load from localStorage first
    if (providedAgentId) return providedAgentId;
    const stored = localStorage.getItem('lastAgentId');
    return stored || null;
  });
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Load default agent if no agentId provided
  useEffect(() => {
    const loadDefaultAgent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to use provided agentId first
        if (providedAgentId) {
          console.log('Using provided agent ID:', providedAgentId);
          const agent = await elizaApi.getAgent(providedAgentId);
          setAgentId(agent.id);
          localStorage.setItem('lastAgentId', agent.id);
          return;
        }
        
        // Try to use stored agentId
        const storedAgentId = localStorage.getItem('lastAgentId');
        if (storedAgentId) {
          console.log('Using stored agent ID:', storedAgentId);
          const agent = await elizaApi.getAgent(storedAgentId);
          setAgentId(agent.id);
          return;
        }
        
        // If no agent ID available, ensure one exists
        console.log('No agent ID available, ensuring agent exists...');
        const agent = await elizaApi.ensureAgent();
        console.log('Using ensured agent:', agent);
        setAgentId(agent.id);
        localStorage.setItem('lastAgentId', agent.id);
      } catch (error) {
        console.error('Failed to load or create agent:', error);
        setError('Failed to load or create agent. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDefaultAgent();
  }, [providedAgentId]);

  // Set current user when wallet connects
  useEffect(() => {
    if (currentAccount?.address) {
      elizaApi.setCurrentUser(currentAccount.address);
    }
  }, [currentAccount]);

  // Load chat history when component mounts or agentId changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!agentId) {
        setError('Agent ID is required');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('Loading chat history for agent:', agentId);
        setError(null);
        setIsLoading(true);
        
        // Get or create persistent roomId for this agent
        let roomId = localStorage.getItem(`${STORAGE_KEY_PREFIX}${agentId}`);
        if (!roomId) {
          roomId = stringToUuid(`room-${agentId}`);
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${agentId}`, roomId);
        }
        
        const history = await elizaApi.getChatHistory(agentId);
        console.log('Loaded chat history:', history);
        if (Array.isArray(history)) {
          setMessages(history.map(msg => ({
            text: msg.text,
            isUser: msg.isUser,
            timestamp: msg.timestamp
          })));
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setError('Failed to load chat history. Please try again.');
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, [agentId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !agentId) {
      setError(!agentId ? 'Agent ID is required' : null);
      return;
    }

    const messageText = input.trim();
    setError(null);
    
    // Add user message immediately
    const userMessage = { 
      text: messageText, 
      isUser: true,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsInputFocused(false);
    inputRef.current?.blur();

    // Show typing indicator
    setIsTyping(true);

    try {
      // Get agent response with streaming
      const response = await elizaApi.sendMessage(
        messageText, 
        agentId,
        (streamText: string) => {
          // Update or add the agent's response message
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            // If the last message is from the agent, update it
            // Otherwise, add a new message
            if (lastMessage && !lastMessage.isUser) {
              lastMessage.text = streamText;
            } else {
              newMessages.push({
                text: streamText,
                isUser: false,
                timestamp: new Date().toISOString()
              });
            }
            
            return newMessages;
          });
          
          // Turn off typing indicator once we start receiving the response
          setIsTyping(false);
        }
      );
      
      setIsTyping(false);
      
      if (!response || !response[0]) {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response from agent');
      }
    } catch (error) {
      console.error('Failed to get response:', error);
      setIsTyping(false);
      setError(error instanceof Error ? error.message : 'Failed to get response');
      setMessages(prev => {
        const newMessages = [...prev];
        // Replace the last message with an error message if it was the agent's response
        if (newMessages.length > 0 && !newMessages[newMessages.length - 1].isUser) {
          newMessages[newMessages.length - 1] = {
            text: 'Sorry, I encountered an error. Please try again.',
            isUser: false,
            timestamp: new Date().toISOString()
          };
        }
        return newMessages;
      });
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!isInputFocused) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isInputFocused]);

  // Handle keyboard appearance and viewport adjustments
  useEffect(() => {
    const handleResize = () => {
      if (isInputFocused) {
        // Get viewport height and adjust container
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Ensure container is in view
        containerRef.current?.scrollIntoView({ block: 'end' });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.documentElement.style.removeProperty('--vh');
    };
  }, [isInputFocused]);

  return (
    <motion.div 
      ref={containerRef}
      className={`fixed top-[64px] bottom-0 z-[50] flex flex-col overflow-hidden
        ${isSidebarOpen ? 'md:left-[280px]' : 'left-0'} right-0 transition-[left] duration-300
        ${!isOpen && 'hidden'}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[var(--bg-darker)] overflow-hidden">
        {/* Psychedelic base layer */}
        <div className="absolute inset-0">
          {/* Morphing gradient core */}
          <div className="absolute inset-0 bg-gradient-radial from-[#ff1b6b] via-[#9333ea]/80 to-transparent animate-morph-slow"></div>
          
          {/* Swirling vortex layers */}
          <div className="absolute inset-0 bg-gradient-conic from-[#ff1b6b] via-[#9333ea]/90 to-[#45caff]/70 animate-vortex-spin"></div>
          <div className="absolute inset-0 bg-gradient-conic from-[#7928ca] via-[#ff69b4]/80 to-[#ff1b6b]/70 animate-vortex-spin-reverse"></div>
          
          {/* Pulsating orbs */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,27,107,0.8),transparent_60%)] animate-pulse-slow scale-150"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(69,202,255,0.7),transparent_60%)] animate-pulse-slow-reverse scale-150"></div>
        </div>

        {/* Flowing energy streams */}
        <div className="absolute inset-0 mix-blend-color-dodge">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,27,107,0.3),rgba(147,51,234,0.3)_20px,transparent_20px,transparent_40px)] animate-flow-diagonal"></div>
          <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,rgba(69,202,255,0.3),rgba(255,105,180,0.3)_20px,transparent_20px,transparent_40px)] animate-flow-diagonal-reverse"></div>
        </div>

        {/* Ethereal mist */}
        <div className="absolute inset-0 mix-blend-screen">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,27,107,0.5),transparent_70%)] animate-ethereal-drift scale-150"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.4),transparent_60%)] animate-ethereal-drift-reverse scale-150"></div>
        </div>

        {/* Glowing particles */}
        <div className="absolute inset-0 mix-blend-screen">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] bg-repeat animate-particle-drift opacity-50"></div>
        </div>

        {/* Chromatic aberration effect */}
        <div className="absolute inset-0 mix-blend-screen">
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff1b6b]/30 via-transparent to-[#45caff]/30 animate-chromatic-shift"></div>
        </div>

        {/* Final atmosphere layer */}
        <div className="absolute inset-0 backdrop-blur-[60px] bg-[var(--bg-darker)]/10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-2 m-4 rounded-lg mono-font text-sm">
            {error}
          </div>
        )}
        {/* Messages */}
        <motion.div 
          className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto min-h-0 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <motion.div 
              className="flex-1 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex space-x-2">
                <motion.div
                  className="w-3 h-3 bg-purple-500/50 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <motion.div
                  className="w-3 h-3 bg-purple-500/50 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, delay: 0.2, repeat: Infinity }}
                />
                <motion.div
                  className="w-3 h-3 bg-purple-500/50 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, delay: 0.4, repeat: Infinity }}
                />
              </div>
            </motion.div>
          ) : messages.length === 0 ? (
            <motion.div 
              className="flex-1 flex flex-col items-center justify-center p-4 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="max-w-md space-y-4 bg-black/95 p-6 rounded-xl border border-purple-500/20 backdrop-blur-md shadow-xl">
                <h2 className="cyberpunk-text text-xl font-bold mb-2" data-text="SUISOUND AGENT">
                  SUISOUND AGENT
                </h2>
                <div className="mono-font text-sm text-purple-300/80 space-y-2">
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    &gt; AGENT_COMMANDS:
                  </motion.p>
                  {[
                    '/train - Train your agent with new patterns',
                    '/create - Generate new content',
                    '/analyze - Get insights on your music',
                    '/market - Promote your content',
                    '/help - Show all commands'
                  ].map((command, index) => (
                    <motion.p
                      key={command}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (index * 0.1) }}
                    >
                      &gt; {command}
                    </motion.p>
                  ))}
                </div>
                <motion.p 
                  className="mono-font text-xs text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  Your AI agent is ready to assist with music creation and promotion
                </motion.p>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <motion.div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.isUser
                        ? 'bg-purple-500/20 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10'
                        : 'bg-gray-700/50 text-white border border-gray-600/50 shadow-lg'
                    } backdrop-blur-sm hover:border-opacity-50 transition-colors duration-200 cyberpunk-card`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="scanline opacity-20"></div>
                    <div className="mono-font tracking-wide text-sm md:text-base relative z-10">
                      {msg.isUser ? (
                        <span className="text-white font-medium">&gt; {msg.text}</span>
                      ) : (
                        <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-cyan-300 bg-[length:200%_auto] animate-text-gradient-slow bg-clip-text text-transparent">{msg.text}</span>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="cyberpunk-card bg-gray-700/50 text-white border border-gray-600/50 rounded-lg p-3 shadow-lg backdrop-blur-sm">
                <div className="flex space-x-2">
                  <motion.div
                    className="w-2 h-2 bg-cyan-300 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-cyan-300 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, delay: 0.2, repeat: Infinity }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-cyan-300 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, delay: 0.4, repeat: Infinity }}
                  />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </motion.div>

        {/* Input */}
        <motion.div 
          className="flex-none p-2 sm:p-4 border-t border-[var(--border-dark)] bg-[var(--bg-darker)]/90 backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <form onSubmit={handleSend} className="flex gap-2">
            <motion.input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => {
                setTimeout(() => setIsInputFocused(false), 100);
              }}
              placeholder="> Enter command..."
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="cyberpunk-card flex-1 px-3 py-2 text-base rounded-lg border border-gray-600/50 
                focus:outline-none focus:ring-2 focus:ring-purple-500/30 placeholder-gray-500 shadow-inner
                backdrop-blur-sm hover:border-purple-500/30 hover:bg-purple-500/10 
                transition-all duration-200 mono-font tracking-wide relative overflow-hidden
                bg-black/50 text-white selection:bg-black selection:text-transparent selection:bg-clip-text 
                selection:bg-gradient-to-r selection:from-[#ff1b6b] selection:via-[#9333ea] selection:to-[#45caff]"
              style={{ 
                fontSize: '16px',
                backgroundSize: '200% auto'
              }}
            />
            <motion.button
              type="submit"
              disabled={!input.trim()}
              className="cyberpunk-card min-w-[60px] px-3 py-2 bg-purple-500/20 text-white rounded-lg 
                border border-purple-500/30 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed 
                transition-all duration-200 shadow-lg hover:shadow-purple-500/20
                backdrop-blur-sm hover:border-purple-400/50 mono-font tracking-wider whitespace-nowrap text-sm sm:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">SEND</span>
              <div className="scanline opacity-30"></div>
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
} 