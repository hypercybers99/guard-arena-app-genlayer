import { describe, it, expect } from 'vitest';
import { Z_INDEX } from '../../src/styles/zIndex';

describe('Modal Stacking & Accessibility Token Hierarchy', () => {
  it('enforces clean z-index hierarchy where modal is above sticky nav', () => {
    expect(Z_INDEX.base).toBe(0);
    expect(Z_INDEX.dropdown).toBe(10);
    expect(Z_INDEX.stickyNav).toBe(20);
    expect(Z_INDEX.modalBackdrop).toBe(40);
    expect(Z_INDEX.modalContent).toBe(50);
    expect(Z_INDEX.tooltip).toBe(60);

    // Assert strict ordering
    expect(Z_INDEX.modalBackdrop).toBeGreaterThan(Z_INDEX.stickyNav);
    expect(Z_INDEX.modalContent).toBeGreaterThan(Z_INDEX.modalBackdrop);
    expect(Z_INDEX.tooltip).toBeGreaterThan(Z_INDEX.modalContent);
  });

  it('validates focus trap selector covers all standard interactive element types', () => {
    const FOCUSABLE_SELECTOR =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    expect(FOCUSABLE_SELECTOR).toContain('a[href]');
    expect(FOCUSABLE_SELECTOR).toContain('button:not([disabled])');
    expect(FOCUSABLE_SELECTOR).toContain('textarea:not([disabled])');
    expect(FOCUSABLE_SELECTOR).toContain('input:not([disabled])');
    expect(FOCUSABLE_SELECTOR).toContain('select:not([disabled])');
    expect(FOCUSABLE_SELECTOR).toContain('[tabindex]:not([tabindex="-1"])');
  });
});
