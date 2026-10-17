import React, { createContext, useContext, useEffect, useState } from 'react';
import { createAccount, generatePrivateKey } from 'genlayer-js';
import { getClient } from '../services/contractService';

interface WalletContextType {
  account: any | null;
  privateKey: string | null;
  address: string | null;
  balance: string;
  isRefreshingBalance: boolean;
  refreshBalance: () => Promise<void>;
  resetWallet: () => void;
  importKey: (key: string) => boolean;
}

const STORAGE_KEY = 'guard_arena_throwaway_key';

const WalletContext = createContext<WalletContextType>({
  account: null,
  privateKey: null,
  address: null,
  balance: '0',
  isRefreshingBalance: false,
  refreshBalance: async () => {},
  resetWallet: () => {},
  importKey: () => false,
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [account, setAccount] = useState<any | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  const initAccountFromKey = (key: string) => {
    try {
      const formatted = (key.startsWith('0x') ? key : `0x${key}`) as `0x${string}`;
      const acc = createAccount(formatted);
      setAccount(acc);
      setPrivateKey(formatted);
      try {
        localStorage.setItem(STORAGE_KEY, formatted);
      } catch {
        // ignore
      }
      return true;
    } catch (err) {
      console.error('Failed to init account from key:', err);
      return false;
    }
  };

  const resetWallet = () => {
    try {
      const freshKey = generatePrivateKey();
      initAccountFromKey(freshKey);
    } catch (err) {
      console.error('Failed to generate fresh wallet:', err);
    }
  };

  const importKey = (key: string) => {
    return initAccountFromKey(key.trim());
  };

  const refreshBalance = async () => {
    if (!account) return;
    setIsRefreshingBalance(true);
    try {
      const client = getClient();
      // RPC balance or provider check
      const bal = await client.getBalance({ address: account.address });
      setBalance(String(bal));
    } catch {
      // Balance query may be optional on Studionet
      setBalance('Ready');
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  useEffect(() => {
    let existingKey: string | null = null;
    try {
      existingKey = localStorage.getItem(STORAGE_KEY);
    } catch {
      // ignore
    }

    if (existingKey) {
      initAccountFromKey(existingKey);
    } else {
      resetWallet();
    }
  }, []);

  useEffect(() => {
    if (account) {
      refreshBalance();
    }
  }, [account]);

  return (
    <WalletContext.Provider
      value={{
        account,
        privateKey,
        address: account ? account.address : null,
        balance,
        isRefreshingBalance,
        refreshBalance,
        resetWallet,
        importKey,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
