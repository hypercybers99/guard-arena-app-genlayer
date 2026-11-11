/**
 * BreakTheGuard - Unified Z-Index Token Hierarchy
 *
 * Single source of truth for stacking contexts across the application.
 * Enforces clean separation between content, sticky navigation, modals, and tooltips.
 */

export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  stickyNav: 20,
  modalBackdrop: 40,
  modalContent: 50,
  tooltip: 60,
} as const;

export type ZIndexLayer = keyof typeof Z_INDEX;
