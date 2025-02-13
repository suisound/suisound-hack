// Eliza backend will run on 3000 by default
const ELIZA_API_URL = 'http://localhost:3000';

// Store the current agent ID and user ID in memory
let currentAgentId: string | null = null;
let currentUserId: string | null = null;

// Add this at the top with other constants
export const STORAGE_KEY_PREFIX = 'eliza_room_';

export interface ElizaResponse {
  content: {
    text: string;
    source?: string;
    action?: string;
  };
}

export interface AgentConfig {
  name: string;
  username?: string;
  description?: string;
  bio: string[];
  lore: string[];
  system?: string;
  modelProvider?: string;
  plugins?: string[];
  clients?: string[];
  messageExamples: Array<Array<{
    user: string;
    content: { text: string };
  }>>;
  postExamples: string[];
  topics: string[];
  adjectives: string[];
  style: {
    all: string[];
    chat: string[];
    post: string[];
  };
  settings?: {
    secrets?: Record<string, string>;
  };
}

export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp?: string;
}

export function stringToUuid(str: string): string {
  // Use a more robust hashing approach
  let hash = new Uint8Array(16);
  
  // Simple but more robust hashing
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    // Use a better distribution algorithm
    for (let j = 0; j < 16; j++) {
      hash[j] = (hash[j] + (char * (j + 1) * 31)) % 256;
    }
  }
  
  // Ensure version 4 UUID format (random)
  hash[6] = (hash[6] & 0x0f) | 0x40;  // Version 4
  hash[8] = (hash[8] & 0x3f) | 0x80;  // Variant 1
  
  // Convert to hex string
  const hex = Array.from(hash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
}

export const elizaApi = {
  setCurrentUser: (walletAddress: string) => {
    currentUserId = walletAddress;
  },

  clearRoomId: (agentId: string) => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${agentId}`);
  },

  sendMessage: async (text: string, agentId?: string, onStream?: (text: string) => void): Promise<any[]> => {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    try {
      let roomId = localStorage.getItem(`${STORAGE_KEY_PREFIX}${agentId}`);
      if (!roomId) {
        const timestamp = Date.now().toString();
        roomId = stringToUuid(`room-${agentId}-${timestamp}`);
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${agentId}`, roomId);
      }

      const response = await fetch(`${ELIZA_API_URL}/${agentId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        body: JSON.stringify({
          text,
          roomId,
          userId: currentUserId || stringToUuid('user-' + Date.now()),
          source: 'direct',
          stream: true
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to send message:', errorText);
        throw new Error(`Failed to send message: ${errorText}`);
      }

      let finalMessages: any[] = [];

      if (response.body) {
        const reader = response.body.getReader();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the chunk and add it to our buffer
          const chunk = new TextDecoder().decode(value);
          console.log('Raw chunk received:', chunk);
          
          try {
            // Try to parse the chunk directly as a message array
            const messages = JSON.parse(chunk);
            if (Array.isArray(messages)) {
              finalMessages = messages;
              // Find the last non-CONTINUE message for streaming
              const lastMessage = messages.find(msg => !msg.action || msg.action !== 'CONTINUE') || messages[messages.length - 1];
              if (lastMessage?.text && onStream) {
                onStream(lastMessage.text);
              }
              // Since we got a complete message, we can break the loop
              break;
            }
          } catch (e) {
            // If parsing fails, accumulate in buffer for potential SSE processing
            buffer += chunk;
            
            // Try to process any complete SSE events
            const events = buffer.split('\n\n');
            buffer = events.pop() || ''; // Keep the last incomplete event in the buffer

            for (const event of events) {
              if (!event.trim()) continue;

              try {
                if (event.startsWith('data: ')) {
                  const data = event.slice(6); // Remove 'data: ' prefix
                  const messages = JSON.parse(data);
                  if (Array.isArray(messages)) {
                    finalMessages = messages;
                    // Find the last non-CONTINUE message for streaming
                    const lastMessage = messages.find(msg => !msg.action || msg.action !== 'CONTINUE') || messages[messages.length - 1];
                    if (lastMessage?.text && onStream) {
                      onStream(lastMessage.text);
                    }
                  }
                }
              } catch (e) {
                console.log('Failed to parse SSE event:', event, e);
              }
            }
          }
        }

        // Format the final messages for the chat component
        if (finalMessages.length > 0) {
          // Get the last non-CONTINUE message or the last message
          const lastMessage = finalMessages.find(msg => !msg.action || msg.action !== 'CONTINUE') || finalMessages[finalMessages.length - 1];
          if (lastMessage?.text) {
            return [{
              text: lastMessage.text,
              isUser: false,
              timestamp: new Date().toISOString()
            }];
          }
        }
      }

      return [];
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  },

  getChatHistory: async (agentId: string): Promise<ChatMessage[]> => {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    try {
      // Get the roomId from localStorage
      const roomId = localStorage.getItem(`${STORAGE_KEY_PREFIX}${agentId}`);
      if (!roomId) {
        console.log('No roomId found, returning empty history');
        return [];
      }

      console.log('Fetching chat history for:', { agentId, roomId });
      
      const response = await fetch(`${ELIZA_API_URL}/agents/${agentId}/${roomId}/memories`);
      console.log('History response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get chat history:', errorText);
        
        // If we get a 404, clear the stored roomId as it might be invalid
        if (response.status === 404) {
          elizaApi.clearRoomId(agentId);
        }
        
        throw new Error(`Failed to get chat history: ${errorText}`);
      }
      
      const { memories } = await response.json();
      console.log('Raw memories response:', memories);
      
      // Convert memories to chat messages
      return memories.map(memory => ({
        text: memory.content.text,
        isUser: memory.userId !== memory.agentId,
        timestamp: new Date(memory.createdAt).toISOString()
      }));
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      return [];
    }
  },

  generateAgentDetails: async (description: string) => {
    // Generate agent details using the Eliza backend
    const response = await fetch(`${ELIZA_API_URL}/agent/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        characterJson: {
          name: 'SuiSound',
          description,
          modelProvider: 'openai',
          bio: [],
          lore: [],
          system: 'You are a helpful AI assistant for music production and promotion.',
          messageExamples: [],
          postExamples: [],
          topics: [],
          adjectives: [],
          style: {
            all: [],
            chat: [],
            post: []
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate agent details');
    }

    const result = await response.json();
    return {
      ...result.character,
      id: result.id
    };
  },

  registerAgent: async (config: AgentConfig, userId: string) => {
    // Set default values
    const agentConfig = {
      ...config,
      username: config.username || config.name,
      modelProvider: config.modelProvider || 'openai',
      plugins: config.plugins || [],
      clients: config.clients || [],
      bio: config.bio || [config.description || ''],
      lore: config.lore || [],
      messageExamples: config.messageExamples || [[{ user: 'user', content: { text: 'Hello!' } }]],
      postExamples: config.postExamples || [],
      topics: config.topics || [],
      adjectives: config.adjectives || [],
      style: config.style || {
        all: [],
        chat: [],
        post: []
      }
    };

    console.log('Registering agent with config:', agentConfig);

    try {
      // Register the agent using the agents/start endpoint
      const response = await fetch(`${ELIZA_API_URL}/agents/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          characterJson: agentConfig,
          userId: userId
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to register agent:', error);
        throw new Error(`Failed to register agent: ${error}`);
      }

      const result = await response.json();
      console.log('Registration response:', result);
      
      if (!result.id) {
        console.error('No agent ID returned from registration:', result);
        throw new Error('No agent ID returned from registration');
      }
      
      // Store the agent ID from the server's response
      currentAgentId = result.id;
      currentUserId = userId;
      return result;
    } catch (error) {
      console.error('Error registering agent:', error);
      throw error;
    }
  },

  // Add a function to get the current agent ID
  getCurrentAgentId: () => currentAgentId,

  // Add a function to get agents for current user
  getUserAgents: async () => {
    if (!currentUserId) {
      throw new Error('No user ID set. Please register an agent first.');
    }

    const response = await fetch(`${ELIZA_API_URL}/agents`);
    const { agents } = await response.json();
    return agents.filter((agent: any) => agent.config?.userId === currentUserId);
  },

  // Add a function to get agents
  getAgents: async () => {
    const response = await fetch(`${ELIZA_API_URL}/agents`);
    if (!response.ok) {
      throw new Error('Failed to get agents');
    }
    const data = await response.json();
    console.log('Available agents:', data);
    return data;
  },

  // Add a function to ensure an agent exists
  ensureAgent: async () => {
    try {
      // First try to get existing agents
      const { agents } = await elizaApi.getAgents();
      console.log('Checking existing agents:', agents);

      if (agents && agents.length > 0) {
        const agent = agents[0];
        console.log('Using existing agent:', agent);
        currentAgentId = agent.id;
        return agent;
      }

      // If no agents exist, create a default one
      console.log('No agents found, creating default agent...');
      const defaultAgent = await elizaApi.registerAgent({
        name: 'SuiSound Assistant',
        description: 'A helpful AI assistant for music production and promotion.',
        bio: ['Your AI companion for music creation and promotion'],
        lore: [],
        system: 'You are a helpful AI assistant for music production and promotion.',
        messageExamples: [],
        postExamples: [],
        topics: [],
        adjectives: [],
        style: {
          all: [],
          chat: [],
          post: []
        }
      }, 'default-user');

      console.log('Created default agent:', defaultAgent);
      return defaultAgent;
    } catch (error) {
      console.error('Error ensuring agent exists:', error);
      throw error;
    }
  },

  // Add a function to get a specific agent
  getAgent: async (agentId: string) => {
    const response = await fetch(`${ELIZA_API_URL}/agents/${agentId}`);
    if (!response.ok) {
      if (response.status === 404) {
        // If agent not found, try to ensure one exists
        console.log('Agent not found, trying to ensure agent exists...');
        return elizaApi.ensureAgent();
      }
      throw new Error('Failed to get agent');
    }
    const data = await response.json();
    console.log('Agent details:', data);
    return data;
  },

  // Remove or simplify the debug function since we don't need wallet stuff anymore
  debugCheckMemories: async (agentId: string) => {
    try {
      const roomId = localStorage.getItem(`${STORAGE_KEY_PREFIX}${agentId}`);
      if (!roomId) return null;
      
      const response = await fetch(`${ELIZA_API_URL}/agents/${agentId}/${roomId}/memories`);
      const data = await response.json();
      console.log('Memory check:', { roomId, data });
      return data;
    } catch (error) {
      console.error('Debug check failed:', error);
      throw error;
    }
  }
};