import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { type SuiObjectResponse } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { NETWORK, NETWORK_URLS } from '../config/network';

let instance: SuiWrapper | null = null;

export class SuiWrapper {
    private provider: SuiClient;
    private PACKAGE_ID: string;
    private TREASURY_ID: string;

    private constructor() {
        this.provider = new SuiClient({ 
            url: NETWORK_URLS[NETWORK],
            // Check if there's any name configuration here
        });
        this.PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || '';
        this.TREASURY_ID = process.env.NEXT_PUBLIC_TREASURY_ID || '';

        if (!this.PACKAGE_ID || !this.TREASURY_ID) {
            throw new Error('Missing required environment variables!');
        }
    }

    public static getInstance(): SuiWrapper {
        if (!instance) {
            instance = new SuiWrapper();
        }
        return instance;
    }

    async createStakeTransaction(walletAddress: string, amount: bigint): Promise<Transaction> {
        const tx = new Transaction({
            sender: walletAddress,
            appId: 'SuiSound Agent',
        });
        
        try {
            const coins = await this.provider.getCoins({
                owner: walletAddress,
                coinType: '0x2::sui::SUI'
            });

            if (coins.data.length === 0) {
                throw new Error('No coins found');
            }

            const [stakingCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(Number(amount))]);
            
            tx.moveCall({
                target: `${this.PACKAGE_ID}::suisound::stake`,
                arguments: [
                    tx.object(this.TREASURY_ID),
                    stakingCoin,
                    tx.pure.u64(Number(amount))
                ]
            });

            return tx;
        } catch (error) {
            throw error;
        }
    }

    async getProducerAccess(walletAddress: string): Promise<boolean> {
        try {
            const stakeInfo = await this.getStakeInfo(walletAddress);
            return stakeInfo.stakeAmount >= BigInt(1_000_000_000);
        } catch (error) {
            return false;
        }
    }

    async getStakeInfo(walletAddress: string): Promise<{
        stakeAmount: bigint;
        isProStaker: boolean;
        rewards: bigint;
    }> {
        try {
            const treasuryObj = await this.provider.getObject({
                id: this.TREASURY_ID,
                options: { showContent: true }
            });

            if (!treasuryObj.data?.content) {
                return { stakeAmount: BigInt(0), isProStaker: false, rewards: BigInt(0) };
            }

            const treasuryFields = (treasuryObj.data.content as any)?.fields;
            const stakesTable = treasuryFields?.stakes;

            if (!stakesTable) {
                return { stakeAmount: BigInt(0), isProStaker: false, rewards: BigInt(0) };
            }

            const allStakes = await this.provider.getDynamicFields({
                parentId: stakesTable.fields.id.id,
            });

            const stake = allStakes.data.find(field => field.name?.value === walletAddress);
            if (!stake) {
                return { stakeAmount: BigInt(0), isProStaker: false, rewards: BigInt(0) };
            }

            const stakeObj = await this.provider.getObject({
                id: stake.objectId,
                options: { showContent: true }
            });

            const stakeFields = (stakeObj.data?.content as any)?.fields?.value?.fields;
            return {
                stakeAmount: BigInt(stakeFields?.amount || 0),
                isProStaker: stakeFields?.is_pro || false,
                rewards: BigInt(stakeFields?.rewards || 0)
            };
        } catch (error) {
            return { stakeAmount: BigInt(0), isProStaker: false, rewards: BigInt(0) };
        }
    }

    async createUnstakeTransaction(): Promise<Transaction> {
        const tx = new Transaction();
        tx.moveCall({
            target: `${this.PACKAGE_ID}::suisound::unstake`,
            arguments: [tx.object(this.TREASURY_ID)]
        });
        return tx;
    }

    async createClaimRewardsTransaction(): Promise<Transaction> {
        const tx = new Transaction();
        tx.moveCall({
            target: `${this.PACKAGE_ID}::suisound::claim_rewards`,
            arguments: [tx.object(this.TREASURY_ID)]
        });
        return tx;
    }
} 