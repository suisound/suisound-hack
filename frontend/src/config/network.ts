export const NETWORK = 'devnet';

export const NETWORK_URLS = {
    devnet: 'https://fullnode.devnet.sui.io:443',
    mainnet: 'https://fullnode.mainnet.sui.io:443',
    testnet: 'https://fullnode.testnet.sui.io:443'
} as const;

// Remove PACKAGE_ID export since we're using env variables directly 