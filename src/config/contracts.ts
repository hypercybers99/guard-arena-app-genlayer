import { studionet } from 'genlayer-js/chains';

export const NETWORK_NAME = 'GenLayer Studionet (Preview)';
export const CHAIN_ID = 61999;
export const RPC_URL = 'https://studio.genlayer.com/api';
export const EXPLORER_BASE = 'https://explorer-studio.genlayer.com';
export const FAUCET_URL = 'https://studio.genlayer.com';

// Active Intelligent Contracts on GenLayer Studionet (Preview)
export const GUARD_ARENA_ADDRESS = '0x05628E36D65281bfa7EA64DBcCd9Ac9c2e1a6474' as const;
export const GUARD_ARENA_DEPLOY_TX = '0x8c7cf7754804996df19d8e355df3f01b28ac5f64a22655f96a9857afdf25fba0' as const;
export const GUARD_ARENA_SHA256 = 'fd163692452d869e1422c63efc09b388269e68175f22bcff3b0783e9ed55f1c4' as const;

export const GUARD_GATE_ADDRESS = '0xE699C8828F4F054fEe73B251837CE8B373Ba3D02' as const;
export const GUARD_GATE_DEPLOY_TX = '0xbabc4708a844890d1b25ddc9c263ed956c6e08753772682dcec38c110c206f21' as const;
export const GUARD_GATE_SHA256 = '4f4ef9bd903f24b145faecfef50a2d78227fa68e2693cc7eb07889cf76c92233' as const;

export const CONTRACT_REPO_URL = 'https://github.com/huzyow155/guard-arena-genlayer';
export const APP_REPO_URL = 'https://github.com/huzyow155/guard-arena-app-genlayer';

export const GENLAYER_CHAIN = studionet;

// The immutable on-chain list of 64 harmless common nouns
export const TOKEN_WORDLIST = [
  'apple', 'banana', 'cherry', 'orange', 'lemon', 'mango', 'grape', 'peach',
  'melon', 'berry', 'papaya', 'apricot', 'plum', 'pear', 'purple', 'yellow',
  'silver', 'violet', 'indigo', 'maroon', 'crimson', 'scarlet', 'turquoise', 'magenta',
  'amber', 'bronze', 'copper', 'rabbit', 'dolphin', 'turtle', 'badger', 'falcon',
  'walrus', 'otter', 'beaver', 'parrot', 'iguana', 'hamster', 'gecko', 'koala',
  'penguin', 'ferret', 'donkey', 'pencil', 'bottle', 'guitar', 'ladder', 'mirror',
  'pillow', 'blanket', 'teacup', 'candle', 'whistle', 'compass', 'magnet', 'lantern',
  'anchor', 'hammer', 'bucket', 'basket', 'shovel', 'helmet', 'camera', 'violin',
] as const;

export type AllowedToken = (typeof TOKEN_WORDLIST)[number];

export const getExplorerAddressUrl = (address: string) => `${EXPLORER_BASE}/address/${address}`;
export const getExplorerTxUrl = (txHash: string) => `${EXPLORER_BASE}/tx/${txHash}`;
