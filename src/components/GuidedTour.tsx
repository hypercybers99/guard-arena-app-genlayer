import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Compass, Key, Shield, Swords, Cpu, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';

export interface TourStep {
  title: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  details: string[];
}

export const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome & Arena Exploration',
    badge: 'Step 1 of 5',
    icon: Compass,
    description:
      'You can browse the BreakTheGuard arena, view registered guards, inspect attack histories, and review lineage trees without needing a wallet or credentials.',
    details: [
      'Read-only browsing queries contract state on GenLayer Studionet (Preview).',
      'Inspect past breach attempts, sample logs, and lineage trees freely.',
      'No wallet connection or token setup needed for read operations.',
    ],
  },
  {
    title: 'Instant In-App Throwaway Key',
    badge: 'Step 2 of 5',
    icon: Key,
    description:
      'An in-app throwaway key is automatically generated and stored locally in your browser to sign on-chain transactions.',
    details: [
      'Pre-configured for GenLayer Studionet (Preview) without manual RPC configuration.',
      'Transactions currently execute with 0 GEN balance - no gas deductions required.',
      'Export your throwaway private key anytime from the Wallet page.',
    ],
  },
  {
    title: 'Registering an Adversarial Guard',
    badge: 'Step 3 of 5',
    icon: Shield,
    description:
      'Create and deploy a defensive guard with a custom policy and a chosen secret token from the allowed word list.',
    details: [
      'Validators run 3 naive baseline probes and 2 utility queries during registration.',
      'Utility probes verify responsiveness and refusal phrases - they do not assess factual accuracy.',
      'The secret token is stored publicly on-chain to enable transparent predicate checks.',
    ],
  },
  {
    title: 'Attacking & Consensus Verification',
    badge: 'Step 4 of 5',
    icon: Swords,
    description:
      'Challenge active guards with prompt injection attacks evaluated under multi-validator consensus.',
    details: [
      'Validators independently execute 3 non-deterministic model samples per attempt.',
      'A breach is flagged if 2 out of 3 samples expose the forbidden secret token.',
      'Initial breaches enter BREACHED_UNCONFIRMED state and require a reverify transaction to reach CONFIRMED.',
    ],
  },
  {
    title: 'GuardGate Production Consumer',
    badge: 'Step 5 of 5',
    icon: Cpu,
    description:
      'GuardGate demonstrates cross-contract composition by reusing hardened GuardArena guards.',
    details: [
      'GuardGate acts as an intelligent firewall layer for downstream applications.',
      'Queries the designated guard; if the forbidden token appears, the output is blocked.',
      'Validators deterministically bind the sanitized reply, filter flag, and integrity hash.',
    ],
  },
];

const TOUR_STORAGE_KEY = 'breaktheguard_tour_dismissed_v1';

export function isTourDismissed(): boolean {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setTourDismissed(dismissed: boolean): void {
  try {
    if (dismissed) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(TOUR_STORAGE_KEY);
    }
  } catch {
    // Storage access restricted (private mode / sandboxed iframe)
  }
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setTourDismissed(true);
    onClose();
  };

  const handleSkip = () => {
    setTourDismissed(true);
    onClose();
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const modalTitle = (
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 rounded-lg bg-arena-primary/20 text-arena-accent border border-arena-primary/30">
        <Sparkles className="w-4 h-4" />
      </div>
      <div>
        <span className="font-bold text-white text-base">Interactive Platform Tour</span>
        <span className="ml-2.5 text-xs font-mono font-medium text-arena-accent bg-arena-card px-2 py-0.5 rounded border border-arena-border">
          {step.badge}
        </span>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="w-full flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={handleSkip}
        className="text-xs text-arena-muted hover:text-white px-2 py-1 rounded transition-colors focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
      >
        Skip tour
      </button>

      <div className="flex items-center gap-2">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-arena-card border border-arena-border text-arena-text hover:bg-arena-cardHover transition-colors focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-arena-primary text-white hover:bg-arena-primaryHover transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
        >
          {isLast ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Get Started</span>
            </>
          ) : (
            <>
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSkip}
      title={modalTitle}
      footer={modalFooter}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Step Indicator Progress Bar */}
        <div className="flex items-center gap-1.5 w-full">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                idx === currentStep
                  ? 'bg-arena-accent'
                  : idx < currentStep
                  ? 'bg-arena-primary'
                  : 'bg-arena-border'
              }`}
            />
          ))}
        </div>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-3.5 pt-1">
          <div className="p-2.5 rounded-xl bg-arena-card border border-arena-border text-arena-accent shrink-0">
            <StepIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{step.title}</h3>
            <p className="text-xs text-arena-muted mt-1 leading-relaxed">{step.description}</p>
          </div>
        </div>

        {/* Bullet details */}
        <div className="bg-arena-bg/60 border border-arena-border/60 rounded-lg p-3.5 space-y-2">
          {step.details.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-arena-text">
              <span className="w-1.5 h-1.5 rounded-full bg-arena-accent mt-1.5 shrink-0" />
              <span className="leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
