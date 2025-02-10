export class SuiSoundError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: any
    ) {
        super(message);
        this.name = 'SuiSoundError';
    }
}

export const ErrorCodes = {
    INSUFFICIENT_STAKE: 'INSUFFICIENT_STAKE',
    NOT_PRODUCER: 'NOT_PRODUCER',
    GENERATION_COOLDOWN: 'GENERATION_COOLDOWN',
    INVALID_CONTENT: 'INVALID_CONTENT',
    CONTRACT_ERROR: 'CONTRACT_ERROR'
} as const; 