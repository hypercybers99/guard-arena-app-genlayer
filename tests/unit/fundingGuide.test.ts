import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MEASURED_EVIDENCE } from '../../src/components/FundsGuideModal';

describe('Test Funds & Zero-Balance Execution Evidence', () => {
  const measurementFilePath = path.join(
    process.cwd(),
    'docs',
    'milestones',
    'm1',
    'funding_measurement.json'
  );

  it('reads the empirical Step 0c measurement file', () => {
    expect(fs.existsSync(measurementFilePath)).toBe(true);
    const raw = fs.readFileSync(measurementFilePath, 'utf8');
    const data = JSON.parse(raw);

    expect(data.network).toBe('GenLayer Studionet (Preview)');
    expect(data.chainId).toBe(61999);
    expect(data.initialBalanceWei).toBe('0');
    expect(data.faucetUsed).toBe(false);

    expect(data.conclusions.zeroGenCanRegister).toBe(true);
    expect(data.conclusions.zeroGenCanAttack).toBe(true);
    expect(data.conclusions.zeroGenCanAskGate).toBe(true);
  });

  it('verifies all 3 core transactions achieved validator consensus agreement with 0 GEN balance', () => {
    const raw = fs.readFileSync(measurementFilePath, 'utf8');
    const data = JSON.parse(raw);

    const actions = data.transactions.map((t: any) => t.action);
    expect(actions).toContain('register_guard');
    expect(actions).toContain('attempt_breach');
    expect(actions).toContain('guard_gate_ask');

    data.transactions.forEach((tx: any) => {
      expect(tx.balanceBeforeWei).toBe('0');
      expect(tx.balanceAfterWei).toBe('0');
      expect(tx.agreeVotes).toBeGreaterThanOrEqual(3);
      expect(tx.totalVotes).toBe(5);
      expect(tx.success).toBe(true);
      expect(tx.honestLabel).toBe(`Accepted by validators (${tx.agreeVotes}/${tx.totalVotes} agreed) - state applied`);
      expect(tx.txHash).toMatch(/^0x[a-f0-9]{64}$/i);
    });
  });

  it('verifies in-app component constants mirror on-chain measurement evidence', () => {
    expect(MEASURED_EVIDENCE.network).toBe('GenLayer Studionet (Preview)');
    expect(MEASURED_EVIDENCE.chainId).toBe(61999);
    expect(MEASURED_EVIDENCE.transactions.length).toBe(3);
    expect(MEASURED_EVIDENCE.transactions[0].action).toBe('register_guard');
    expect(MEASURED_EVIDENCE.transactions[1].action).toBe('attempt_breach');
    expect(MEASURED_EVIDENCE.transactions[2].action).toBe('guard_gate_ask');
  });
});
