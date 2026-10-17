import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

interface ContractMethod {
  name: string;
  type: 'view' | 'write';
  params: string[];
  requiredParams: string[];
}

function parsePythonContract(filePath: string): Map<string, ContractMethod> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const methods = new Map<string, ContractMethod>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('@gl.public.write') || line.startsWith('@gl.public.view')) {
      const type: 'view' | 'write' = line.startsWith('@gl.public.write') ? 'write' : 'view';
      let defLine = '';
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (next.startsWith('def ')) {
          defLine = next;
          break;
        }
      }
      if (defLine) {
        const match = defLine.match(/^def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
        if (match) {
          const methodName = match[1];
          const rawParams = match[2].split(',').map((p) => p.trim()).filter(Boolean);
          const params: string[] = [];
          const requiredParams: string[] = [];
          for (const p of rawParams) {
            const clean = p.split(':')[0].trim();
            if (clean === 'self') continue;
            params.push(clean);
            if (!p.includes('=')) {
              requiredParams.push(clean);
            }
          }
          methods.set(methodName, { name: methodName, type, params, requiredParams });
        }
      }
    }
  }
  return methods;
}

function extractContractServiceCalls(filePath: string): Array<{
  functionName: string;
  targetContract: 'GuardArena' | 'GuardGate';
  callType: 'view' | 'write';
  line: number;
}> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const calls: Array<{
    functionName: string;
    targetContract: 'GuardArena' | 'GuardGate';
    callType: 'view' | 'write';
    line: number;
  }> = [];

  // 1. Direct client.readContract / client.writeContract calls
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fnMatch = line.match(/functionName:\s*['"]([a-zA-Z0-9_]+)['"]/);
    if (fnMatch) {
      const fnName = fnMatch[1];
      let target: 'GuardArena' | 'GuardGate' = 'GuardArena';
      for (let j = i; j >= Math.max(0, i - 10); j--) {
        if (lines[j].includes('GUARD_GATE_ADDRESS')) {
          target = 'GuardGate';
          break;
        }
        if (lines[j].includes('GUARD_ARENA_ADDRESS')) {
          target = 'GuardArena';
          break;
        }
      }
      let callType: 'view' | 'write' = 'view';
      for (let j = i; j >= Math.max(0, i - 10); j--) {
        if (lines[j].includes('writeContract')) {
          callType = 'write';
          break;
        }
        if (lines[j].includes('readContract')) {
          callType = 'view';
          break;
        }
      }
      calls.push({ functionName: fnName, targetContract: target, callType, line: i + 1 });
    }
  }

  // 2. High-level write calls via executeTrackedWrite invocations
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('executeTrackedWrite(')) {
      let target: 'GuardArena' | 'GuardGate' = 'GuardArena';
      let fnName = '';
      for (let j = i; j < Math.min(lines.length, i + 8); j++) {
        if (lines[j].includes('GUARD_GATE_ADDRESS')) target = 'GuardGate';
        if (lines[j].includes('GUARD_ARENA_ADDRESS')) target = 'GuardArena';
        const strMatch = lines[j].match(/^\s*['"]([a-zA-Z0-9_]+)['"],?/);
        if (strMatch && !strMatch[1].startsWith('0x') && !['idle', 'signing', 'submitting'].includes(strMatch[1])) {
          fnName = strMatch[1];
        }
      }
      if (fnName) {
        calls.push({ functionName: fnName, targetContract: target, callType: 'write', line: i + 1 });
      }
    }
  }

  return calls;
}

describe('Contract Method Signatures and Arity Verification', () => {
  const arenaPath = path.join(process.cwd(), 'contracts-reference', 'GuardArena.py');
  const gatePath = path.join(process.cwd(), 'contracts-reference', 'GuardGate.py');
  const servicePath = path.join(process.cwd(), 'src', 'services', 'contractService.ts');

  const arenaMethods = parsePythonContract(arenaPath);
  const gateMethods = parsePythonContract(gatePath);

  it('correctly parses all public methods from reference contracts', () => {
    expect(arenaMethods.has('register_guard')).toBe(true);
    expect(arenaMethods.has('attempt_breach')).toBe(true);
    expect(arenaMethods.has('reverify_attempt')).toBe(true);
    expect(arenaMethods.has('get_guard')).toBe(true);
    expect(arenaMethods.has('get_attempts')).toBe(true);
    expect(arenaMethods.has('list_guard_ids')).toBe(true);
    expect(arenaMethods.has('get_leaderboard')).toBe(true);
    expect(arenaMethods.has('get_lineage')).toBe(true);
    expect(arenaMethods.has('get_meta')).toBe(true);

    expect(gateMethods.has('ask')).toBe(true);
    expect(gateMethods.has('get_reply')).toBe(true);
    expect(gateMethods.has('get_stats')).toBe(true);
    expect(gateMethods.has('get_arena_address')).toBe(true);

    // Verify GuardGate does NOT have ask_guard or get_meta
    expect(gateMethods.has('ask_guard')).toBe(false);
    expect(gateMethods.has('get_meta')).toBe(false);
  });

  it('catches invalid contract method names like ask_guard', () => {
    // Demonstration that checking ask_guard against gateMethods fails as required by prompt
    expect(gateMethods.has('ask_guard')).toBe(false);
    expect(() => {
      const fnName = 'ask_guard';
      if (!gateMethods.has(fnName)) {
        throw new Error(`Invalid method name '${fnName}' on GuardGate contract! Real write method is 'ask'.`);
      }
    }).toThrow("Invalid method name 'ask_guard' on GuardGate contract! Real write method is 'ask'.");
  });

  it('cross-checks EVERY functionName passed in contractService.ts against contracts', () => {
    const serviceCalls = extractContractServiceCalls(servicePath);
    expect(serviceCalls.length).toBeGreaterThan(0);

    for (const call of serviceCalls) {
      const contractMethods = call.targetContract === 'GuardArena' ? arenaMethods : gateMethods;
      const exists = contractMethods.has(call.functionName);

      expect(
        exists,
        `Line ${call.line} in contractService.ts calls '${call.functionName}' on ${call.targetContract}, which DOES NOT exist in contract! Allowed methods on ${call.targetContract}: [${Array.from(contractMethods.keys()).join(', ')}]`
      ).toBe(true);

      const contractDef = contractMethods.get(call.functionName)!;
      expect(contractDef.type).toBe(call.callType);
    }
  });

  it('validates exact argument arity and parameter names for all dApp write operations', () => {
    // 1. register_guard: name, policy, token, parent_guard_id
    const reg = arenaMethods.get('register_guard')!;
    expect(reg.type).toBe('write');
    expect(reg.params).toEqual(['name', 'policy', 'token', 'parent_guard_id']);
    expect(reg.requiredParams).toEqual(['name', 'policy', 'token', 'parent_guard_id']);

    // 2. attempt_breach: guard_id, attack_text
    const att = arenaMethods.get('attempt_breach')!;
    expect(att.type).toBe('write');
    expect(att.params).toEqual(['guard_id', 'attack_text']);
    expect(att.requiredParams).toEqual(['guard_id', 'attack_text']);

    // 3. reverify_attempt: guard_id, attempt_n
    const rev = arenaMethods.get('reverify_attempt')!;
    expect(rev.type).toBe('write');
    expect(rev.params).toEqual(['guard_id', 'attempt_n']);
    expect(rev.requiredParams).toEqual(['guard_id', 'attempt_n']);

    // 4. ask: guard_id, message
    const ask = gateMethods.get('ask')!;
    expect(ask.type).toBe('write');
    expect(ask.params).toEqual(['guard_id', 'message']);
    expect(ask.requiredParams).toEqual(['guard_id', 'message']);

    // 5. get_leaderboard: limit
    const lbd = arenaMethods.get('get_leaderboard')!;
    expect(lbd.type).toBe('view');
    expect(lbd.params).toEqual(['limit']);

    // 6. get_reply: request_id
    const rep = gateMethods.get('get_reply')!;
    expect(rep.type).toBe('view');
    expect(rep.params).toEqual(['request_id']);

    // 7. get_stats: 0 args
    const stats = gateMethods.get('get_stats')!;
    expect(stats.type).toBe('view');
    expect(stats.params).toEqual([]);
  });
});
