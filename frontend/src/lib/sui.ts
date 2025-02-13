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

            const treasuryFields = (treasuryObj.data.content as any).fields;
            const stakesTableId = treasuryFields.stakes.fields.id.id;
            console.log('Stakes table ID:', stakesTableId);

            const allStakes = await this.provider.getDynamicFields({
                parentId: stakesTableId,
            });

            console.log('All stakes:', JSON.stringify(allStakes, null, 2));

            const stake = allStakes.data.find(field => {
                const nameValue = field.name?.value as string | undefined;
                return nameValue?.toLowerCase() === walletAddress.toLowerCase();
            });
            
            console.log('Found stake for wallet:', stake);

            if (!stake) {
                console.log('No stake found for wallet');
                return { stakeAmount: BigInt(0), isProStaker: false, rewards: BigInt(0) };
            }

            // Get the stake object details
            const stakeObj = await this.provider.getObject({
                id: stake.objectId,
                options: { showContent: true }
            });

            console.log('Stake object:', JSON.stringify(stakeObj, null, 2));

            // Access the stake fields correctly through the dynamic field value
            const stakeContent = stakeObj.data?.content as { type: string; fields: any } | undefined;
            const stakeFields = stakeContent?.fields?.value?.fields;
            console.log('Stake fields:', stakeFields);

            if (!stakeFields) {
                return { stakeAmount: BigInt(0), isProStaker: false, rewards: BigInt(0) };
            }

            const stakeAmount = BigInt(stakeFields.amount || 0);
            const isProStaker = Boolean(stakeFields.is_pro || false);
            const lastClaimTime = BigInt(stakeFields.last_claim_time || 0);
            const currentTime = BigInt(Date.now()); // Keep in milliseconds
            
            // Calculate rewards using same formula as contract
            const COOLDOWN_PERIOD = BigInt(86400_000); // 24 hours in milliseconds (same as contract)
            const REWARD_RATE = BigInt(1);
            const timeStaked = currentTime - lastClaimTime;
            const daysStaked = timeStaked / COOLDOWN_PERIOD;
            const multiplier = isProStaker ? BigInt(5) : BigInt(1);
            const rewards = (stakeAmount * REWARD_RATE * daysStaked * multiplier) / BigInt(1_000_000_000);

            console.log('Rewards calculation:', {
                stakeAmount: stakeAmount.toString(),
                lastClaimTime: lastClaimTime.toString(),
                currentTime: currentTime.toString(),
                timeStaked: timeStaked.toString(),
                daysStaked: daysStaked.toString(),
                multiplier: multiplier.toString(),
                rewards: rewards.toString()
            });

            return {
                stakeAmount,
                isProStaker,
                rewards
            };
        } catch (error) {
            console.error('Error fetching stake info:', error);
            return { stakeAmount: BigInt(0), isProStaker: false, rewards: BigInt(0) };
        }
    }

    async createUnstakeTransaction(walletAddress: string): Promise<Transaction> {
        const tx = this.configureTransaction(new Transaction(), walletAddress);
        try {
            tx.moveCall({
                target: `${this.PACKAGE_ID}::suisound::unstake`,
                arguments: [tx.object(this.TREASURY_ID)]
            });
            return tx;
        } catch (error) {
            console.error('Error creating unstake transaction:', error);
            throw error;
        }
    }

    async createClaimRewardsTransaction(walletAddress: string): Promise<Transaction> {
        const tx = this.configureTransaction(new Transaction(), walletAddress);
        try {
            tx.moveCall({
                target: `${this.PACKAGE_ID}::suisound::claim_rewards`,
                arguments: [tx.object(this.TREASURY_ID)]
            });
            return tx;
        } catch (error) {
            console.error('Error creating claim rewards transaction:', error);
            throw error;
        }
    }

    async getSuiSoundBalance(walletAddress: string): Promise<bigint> {
        try {
            console.log('Fetching SUISOUND balance for:', walletAddress);
            const coins = await this.provider.getCoins({
                owner: walletAddress,
                coinType: `${this.PACKAGE_ID}::suisound::SUISOUND`
            });

            console.log('Found SUISOUND coins:', JSON.stringify(coins.data, null, 2));
            let totalBalance = BigInt(0);
            const DECIMALS = BigInt(1_000_000_000); // 9 decimals
            
            for (const coin of coins.data) {
                console.log('Processing coin:', {
                    coinId: coin.coinObjectId,
                    rawBalance: coin.balance,
                    type: coin.coinType
                });
                const rawBalance = BigInt(coin.balance);
                totalBalance += rawBalance;
                console.log('Running total (raw):', totalBalance.toString());
                console.log('Running total (adjusted):', (totalBalance / DECIMALS).toString());
            }
            
            console.log('Final SUISOUND balance:', {
                rawBalance: totalBalance.toString(),
                adjustedBalance: (totalBalance / DECIMALS).toString(),
                numCoins: coins.data.length
            });
            return totalBalance;
        } catch (error) {
            console.error('Error fetching SUISOUND balance:', error);
            return BigInt(0);
        }
    }
} 