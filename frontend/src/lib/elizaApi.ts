// Eliza backend will run on 3001 by default
const ELIZA_API_URL = 'http://localhost:3001';

export interface ElizaResponse {
  content: {
    text: string;
    source?: string;
    action?: string;
  };
}

export const elizaApi = {
  sendMessage: async (message: string) => {
    const formData = new FormData();
    formData.append("text", message);
    formData.append("user", "user");
    
    // Using the first available agent for simplicity
    const response = await fetch(`${ELIZA_API_URL}/agents`);
    const { agents } = await response.json();
    const agentId = agents[0]?.id;
    
    if (!agentId) {
      throw new Error('No agent available');
    }

    const messageResponse = await fetch(`${ELIZA_API_URL}/${agentId}/message`, {
      method: 'POST',
      body: formData,
    });
    
    if (!messageResponse.ok) {
      throw new Error('Failed to send message');
    }
    
    return messageResponse.json();
  }
}; 