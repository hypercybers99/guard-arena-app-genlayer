import React, { useEffect, useRef, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Z_INDEX } from '../styles/zIndex';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  triggerRef?: React.RefObject<HTMLElement | null>;
  closeOnBackdrop?: boolean;
}

const MAX_WIDTH_CLASSES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'lg',
  triggerRef,
  closeOnBackdrop = true,
}) => {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Return focus on close
  const restoreFocus = useCallback(() => {
    if (triggerRef?.current) {
      triggerRef.current.focus();
    } else if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
      previousActiveElementRef.current.focus();
    }
  }, [triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    // Save active element for focus restoration
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    // Body scroll lock
    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Apply inert to #app-root
    const appRoot = document.getElementById('app-root');
    if (appRoot) {
      appRoot.setAttribute('inert', '');
      appRoot.setAttribute('aria-hidden', 'true');
    }

    // Move initial focus into modal
    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 20);

    // Escape listener and Focus Trap
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        if (!modalRef.current) return;
        const focusables = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalBodyOverflow;
      if (appRoot) {
        appRoot.removeAttribute('inert');
        appRoot.removeAttribute('aria-hidden');
      }
      restoreFocus();
    };
  }, [isOpen, onClose, restoreFocus]);

  if (!isOpen) return null;

  // Locate portal target
  let modalTarget = document.getElementById('modal-root');
  if (!modalTarget) {
    modalTarget = document.body;
  }

  const modalNode = (
    <div
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      style={{ zIndex: Z_INDEX.modalBackdrop }}
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 transition-opacity"
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Modal Dialog Content Container */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative w-full ${MAX_WIDTH_CLASSES[maxWidth] || 'max-w-lg'} my-auto rounded-xl bg-arena-surface border border-arena-border shadow-2xl flex flex-col focus:outline-none`}
        style={{
          zIndex: Z_INDEX.modalContent,
          maxHeight: 'min(92vh, 92dvh)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-arena-border bg-arena-surface rounded-t-xl shrink-0">
          <div id={titleId} data-testid="modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-arena-muted hover:text-white hover:bg-arena-card transition-colors focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto text-arena-text text-sm leading-relaxed space-y-4">
          {children}
        </div>

        {/* Sticky Footer (if provided) */}
        {footer && (
          <div className="sticky bottom-0 z-10 px-5 py-3.5 border-t border-arena-border bg-arena-surface/95 rounded-b-xl flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalNode, modalTarget);
};
