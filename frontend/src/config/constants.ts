export const MIN_STAKE_AMOUNT = 1000000; // in MIST
export const GENERATION_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const CONTENT_TYPES = {
    AUDIO: 'audio',
    IMAGE: 'image',
    VIDEO: 'video'
} as const; 

// This might contain platform name definitions 