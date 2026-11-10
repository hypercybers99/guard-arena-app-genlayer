import { studionet } from 'genlayer-js/chains';

export const NETWORK_NAME = 'GenLayer Studionet (Preview)';
export const CHAIN_ID = 61999;
export const RPC_URL = 'https://studio.genlayer.com/api';
export const EXPLORER_BASE = 'https://explorer-studio.genlayer.com';
export const FAUCET_URL = 'https://studio.genlayer.com';

// Active Intelligent Contracts on GenLayer Studionet (Preview) (v1.1.0)
export const GUARD_ARENA_ADDRESS = '0xFcEAb957e1412e063760A534C294B897071E144B' as const;
export const GUARD_ARENA_DEPLOY_TX = '0x515d7e498651de97538d9e41821b3da7fbb724156f6b1b924d37ccb28410aad9' as const;
export const GUARD_ARENA_SHA256 = 'a93010bb5a3371b8a2fddcc1b8c12d7a459c9572abe033ef8e265ed6c9872b41' as const;

export const GUARD_GATE_ADDRESS = '0xCc9086C43D4152A5f5b5eb7fCfDfcd03a1f67AB6' as const;
export const GUARD_GATE_DEPLOY_TX = '0x0b2275177af47611e47d057c77c5c971e8e41cff1fd76ba6ac700d68586a0147' as const;
export const GUARD_GATE_SHA256 = '6ebf7eb0606c00a95ece12123035e99bcecd9015c311a76a0ab3d3da7c90c4d2' as const;

export const CONTRACT_REPO_URL = 'https://github.com/hypercybers99/guard-arena-genlayer';
export const APP_REPO_URL = 'https://github.com/hypercybers99/guard-arena-app-genlayer';

export const GENLAYER_CHAIN = studionet;

// The contract-defined on-chain list of 64 harmless common nouns
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
