import { SuiClient } from '@mysten/sui/client';
import { type SuiObjectResponse } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { NETWORK, NETWORK_URLS, PACKAGE_ID, TREASURY_ID } from '../config/network';

let instance: SuiWrapper | null = null;

export class SuiWrapper {
    private provider: SuiClient;
    private PACKAGE_ID: string;
    private TREASURY_ID: string;

    private constructor() {
        this.provider = new SuiClient({ 
            url: NETWORK_URLS[NETWORK]
        });
        
        this.PACKAGE_ID = PACKAGE_ID;
        this.TREASURY_ID = TREASURY_ID;

        console.log('Network:', NETWORK);
        console.log('Package ID:', this.PACKAGE_ID);
        console.log('Treasury ID:', this.TREASURY_ID);
    }

    public static getInstance(): SuiWrapper {
        if (!instance) {
            instance = new SuiWrapper();
        }
        return instance;
    }

    private configureTransaction(tx: Transaction, sender: string): Transaction {
        tx.setSender(sender);
        tx.setGasBudget(50000000);
        return tx;
    }

    async createStakeTransaction(walletAddress: string, amount: bigint): Promise<Transaction> {
        const tx = this.configureTransaction(new Transaction(), walletAddress);
        
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
            console.log('Fetching stake info for wallet:', walletAddress);
            
            const treasuryObj = await this.provider.getObject({
                id: this.TREASURY_ID,
                options: { showContent: true, showDisplay: true }
            });

            console.log('Treasury object:', JSON.stringify(treasuryObj, null, 2));

            if (!treasuryObj.data?.content) {
                console.log('No treasury content found');
                return { stakeAmount: BigInt(0), isProStaker: false, rewards: BigInt(0) };
            }

            // Access the dynamic field table for stakes
            const treasuryFields = (treasuryObj.data.content as any).fields;
            const stakesTableId = treasuryFields.stakes.fields.id.id;
            console.log('Stakes table ID:', stakesTableId);

            // Get all stakes
            const allStakes = await this.provider.getDynamicFields({
                parentId: stakesTableId,
            });

            console.log('All stakes:', JSON.stringify(allStakes, null, 2));

            // Find stake by wallet address
            const stake = allStakes.data.find(field => 
                field.name?.value?.toLowerCase() === walletAddress.toLowerCase()
            );
            
            console.log('Found stake for wallet:', stake);

            if (!stake) {
                console.log('No stake found for wallet');
                return { stakeAmount: BigInt(0), isProStaker: false, rewards: BigInt(0) };
            }

            // Get the stake object details
            const stakeObj = await this.provider.getObject({
                id: stake.objectId,
                options: { showContent: true, showDisplay: true }
            });

            console.log('Stake object:', JSON.stringify(stakeObj, null, 2));

            // Access the stake fields correctly
            const stakeFields = (stakeObj.data?.content as any)?.fields;
            console.log('Stake fields:', stakeFields);

            return {
                stakeAmount: BigInt(stakeFields?.amount || 0),
                isProStaker: Boolean(stakeFields?.is_pro || false),
                rewards: BigInt(stakeFields?.rewards || 0)
            };
        } catch (error) {
            console.error('Error fetching stake info:', error);
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