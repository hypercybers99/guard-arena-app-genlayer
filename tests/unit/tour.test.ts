import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TOUR_STEPS,
  isTourDismissed,
  setTourDismissed,
} from '../../src/components/GuidedTour';

describe('GuidedTour State & Onboarding Logic', () => {
  let mockStore: Map<string, string>;

  beforeEach(() => {
    mockStore = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: vi.fn((key: string) => mockStore.get(key) ?? null),
      setItem: vi.fn((key: string, val: string) => {
        mockStore.set(key, String(val));
      }),
      removeItem: vi.fn((key: string) => {
        mockStore.delete(key);
      }),
      clear: vi.fn(() => {
        mockStore.clear();
      }),
    };
  });

  it('defines exactly 5 onboarding steps covering all core platform mechanics', () => {
    expect(TOUR_STEPS.length).toBe(5);

    const stepTitles = TOUR_STEPS.map((s) => s.title);
    expect(stepTitles).toEqual([
      'Welcome & Arena Exploration',
      'Instant In-App Throwaway Key',
      'Registering an Adversarial Guard',
      'Attacking & Consensus Verification',
      'GuardGate Production Consumer',
    ]);

    TOUR_STEPS.forEach((step, idx) => {
      expect(step.badge).toBe(`Step ${idx + 1} of 5`);
      expect(step.description.length).toBeGreaterThan(20);
      expect(step.details.length).toBeGreaterThanOrEqual(2);
      expect(typeof step.icon).toBe('object');
    });
  });

  it('manages tour dismissal persistence in localStorage', () => {
    expect(isTourDismissed()).toBe(false);

    setTourDismissed(true);
    expect(isTourDismissed()).toBe(true);

    setTourDismissed(false);
    expect(isTourDismissed()).toBe(false);
  });

  it('handles localStorage exceptions gracefully without crashing', () => {
    (globalThis as any).localStorage.getItem = vi.fn(() => {
      throw new Error('SecurityError: The operation is insecure.');
    });

    // Should return false rather than throw
    expect(isTourDismissed()).toBe(false);

    (globalThis as any).localStorage.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });

    // Should not throw on set
    expect(() => setTourDismissed(true)).not.toThrow();
  });
});
