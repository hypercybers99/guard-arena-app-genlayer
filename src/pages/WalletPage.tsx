import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { FAUCET_URL, getExplorerAddressUrl } from '../config/contracts';
import {
  Wallet,
  Key,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Download,
  Upload,
} from 'lucide-react';

export const WalletPage: React.FC = () => {
  const {
    address,
    privateKey,
    balance,
    isRefreshingBalance,
    refreshBalance,
    resetWallet,
    importKey,
  } = useWallet();

  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleCopyAddr = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleCopyKey = () => {
    if (!privateKey) return;
    navigator.clipboard.writeText(privateKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    const ok = importKey(inputKey.trim());
    if (ok) {
      setImportStatus('Key imported successfully!');
      setInputKey('');
    } else {
      setImportStatus('Invalid key format. Please enter a valid 32-byte hex key.');
    }
    setTimeout(() => setImportStatus(null), 3500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-arena-border pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Wallet className="w-8 h-8 text-arena-accent" />
          <span>Throwaway Key & Funding</span>
        </h1>
        <p className="text-sm text-arena-muted mt-1">
          Generate, import, and fund a disposable key for executing transactions on GenLayer Studionet (Preview).
        </p>
      </div>

      {/* Safety Note */}
      <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-4 text-xs text-amber-200 leading-relaxed space-y-1">
        <div className="flex items-center gap-2 font-semibold text-amber-300">
          <AlertTriangle className="w-4 h-4" />
          <span>Disposable / Throwaway Keys Only</span>
        </div>
        <p>
          Never enter a primary personal private key with real assets. BreakTheGuard operates on GenLayer Studionet (Preview). Use throwaway test keys generated in-browser or from the GenLayer CLI.
        </p>
      </div>

      {/* Active Key Details Card */}
      <div className="bg-arena-card border border-arena-border rounded-xl p-6 space-y-6 shadow-md">
        <div className="flex items-center justify-between border-b border-arena-border pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-arena-accent" />
            <span>Active Session Account</span>
          </h2>
          <button
            onClick={refreshBalance}
            disabled={isRefreshingBalance}
            className="flex items-center gap-1.5 text-xs text-arena-muted hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingBalance ? 'animate-spin' : ''}`} />
            <span>Check Balance</span>
          </button>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-arena-muted">
            Public Address
          </span>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-arena-surface border border-arena-border rounded-lg px-3.5 py-2.5 font-mono text-xs sm:text-sm text-white break-all">
              {address || 'No address loaded'}
            </div>
            <button
              onClick={handleCopyAddr}
              className="bg-arena-surface hover:bg-arena-border border border-arena-border p-2.5 rounded-lg text-arena-muted hover:text-white transition-colors"
              title="Copy Address"
              aria-label="Copy Address"
            >
              {copiedAddr ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {address && (
            <div className="pt-1">
              <a
                href={getExplorerAddressUrl(address)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-arena-accent hover:underline inline-flex items-center gap-1"
              >
                <span>View on Studionet Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Private Key (Export) */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-arena-muted">
            Private Key (Disposable)
          </span>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-arena-surface border border-arena-border rounded-lg px-3.5 py-2.5 font-mono text-xs sm:text-sm text-slate-300 break-all">
              {privateKey || '********'}
            </div>
            <button
              onClick={handleCopyKey}
              className="bg-arena-surface hover:bg-arena-border border border-arena-border p-2.5 rounded-lg text-arena-muted hover:text-white transition-colors"
              title="Copy Key"
              aria-label="Copy Key"
            >
              {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Actions: Generate New Key */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={resetWallet}
            className="flex-1 bg-arena-surface hover:bg-arena-cardHover border border-arena-border text-white text-xs font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-arena-accent" />
            <span>Generate Fresh Throwaway Key</span>
          </button>

          <a
            href={FAUCET_URL}
            target="_blank"
            rel="noreferrer"
            className="flex-1 bg-arena-primary hover:bg-arena-primaryHover text-white text-xs font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <span>Open Studionet Faucet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Import Key Card */}
      <div className="bg-arena-card border border-arena-border rounded-xl p-6 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Upload className="w-4 h-4 text-arena-accent" />
          <span>Import Existing Key</span>
        </h2>
        <form onSubmit={handleImport} className="space-y-3">
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="Paste 0x... 32-byte hex private key"
            className="w-full bg-arena-surface border border-arena-border rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono placeholder-arena-muted focus:outline-none focus:border-arena-primary"
          />
          {importStatus && (
            <p
              className={`text-xs ${
                importStatus.includes('successfully') ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {importStatus}
            </p>
          )}
          <button
            type="submit"
            disabled={!inputKey.trim()}
            className="bg-arena-surface hover:bg-arena-border border border-arena-border disabled:opacity-50 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Import Key
          </button>
        </form>
      </div>
    </div>
  );
};
