export interface StakeInfo {
    stakeAmount: bigint;
    isProStaker: boolean;
    rewards: bigint;
}

export interface ProducerAccess {
    objectId: string;
    stakeAmount: bigint;
    lastGenerationTime: number;
}

export interface ContentNFTMetadata {
    name: string;
    description: string;
    url: string;
    contentType: string;
} 