import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import {
  Shield,
  Swords,
  Scale,
  RefreshCw,
  GitFork,
  ArrowRight,
  Sparkles,
  Terminal,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  // Slow typed hero text implementation
  const fullText = "Decentralized Language Model Guard Hardening Arena.";
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setDisplayedText(fullText);
      return;
    }

    if (index < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + fullText.charAt(index));
        setIndex((prev) => prev + 1);
      }, 55); // slow typed cadence
      return () => clearTimeout(timer);
    }
  }, [index, fullText]);

  // IntersectionObserver scroll reveal
  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements = document.querySelectorAll('.scroll-reveal');

    if (isReduced) {
      elements.forEach((el) => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="scroll-reveal relative pt-12 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
        {/* Glow backdrop */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-30 pointer-events-none">
          <div className="w-[500px] h-[300px] bg-blue-600/30 blur-[120px] rounded-full" />
        </div>

        {/* Logo Shield Hero Display */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-arena-card/60 rounded-2xl border border-arena-primary/30 shadow-2xl backdrop-blur-sm animate-pulse-subtle">
            <Logo size={76} />
          </div>
        </div>

        {/* Slow Typed Hero Heading */}
        <div className="min-h-[100px] sm:min-h-[120px] flex items-center justify-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            {displayedText}
            {index < fullText.length && (
              <span className="inline-block w-2.5 h-8 sm:h-12 bg-arena-accent ml-1 animate-pulse align-middle" />
            )}
          </h1>
        </div>

        {/* Hero Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-300 leading-relaxed font-normal">
          Defenders register LLM hardening guards. Attackers probe for secret harmless tokens. Decentralized validator consensus enforces deterministic evaluation.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/arena"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-arena-primary hover:bg-arena-primaryHover text-white font-semibold text-base shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <Shield className="w-5 h-5" />
            <span>Enter The Arena</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-arena-card hover:bg-arena-cardHover border border-arena-border text-slate-200 font-semibold text-base flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-5 h-5 text-arena-accent" />
            <span>Deploy A Guard</span>
          </Link>
        </div>
      </section>

      {/* 3 Short Steps Explanation */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="scroll-reveal text-center space-y-2">
          <span className="text-xs uppercase font-mono tracking-widest text-arena-accent font-semibold">
            How It Works
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Three Steps to Robust Prompt Security
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="scroll-reveal reveal-delay-100 bg-arena-card/80 border border-arena-border rounded-xl p-6 relative flex flex-col justify-between group hover:border-arena-primary/50 transition-colors">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-arena-accent font-mono font-bold text-lg">
                01
              </div>
              <h3 className="text-lg font-bold text-white">Deploy & Probe</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Defenders register a custom policy and pick a secret token from the fixed 64-word dictionary. The contract automatically runs naive and utility probes to check that the guard is functional before accepting it.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-arena-border/40 text-xs font-mono text-arena-muted flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-arena-accent" />
              <span>register_guard()</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="scroll-reveal reveal-delay-200 bg-arena-card/80 border border-arena-border rounded-xl p-6 relative flex flex-col justify-between group hover:border-arena-primary/50 transition-colors">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-arena-accent font-mono font-bold text-lg">
                02
              </div>
              <h3 className="text-lg font-bold text-white">Attack & Consensus</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Attackers craft prompt-injection attempts to force the model to output the token. Validators independently sample the model K=3 times and evaluate a deterministic Python predicate -- never an LLM judge.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-arena-border/40 text-xs font-mono text-arena-muted flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-arena-accent" />
              <span>attempt_breach()</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="scroll-reveal reveal-delay-300 bg-arena-card/80 border border-arena-border rounded-xl p-6 relative flex flex-col justify-between group hover:border-arena-primary/50 transition-colors">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-arena-accent font-mono font-bold text-lg">
                03
              </div>
              <h3 className="text-lg font-bold text-white">Reverify & Evolve</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Breaches must reproduce in an independent re-verification round to become CONFIRMED; non-reproducing breaches are marked FLAKY. Confirmed breaches unlock hardened child guard registrations in the lineage tree.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-arena-border/40 text-xs font-mono text-arena-muted flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-arena-accent" />
              <span>reverify_attempt()</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Innovation Callout */}
      <section className="scroll-reveal max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-blue-950/40 border border-arena-border rounded-2xl p-6 sm:p-8 space-y-4 text-center">
          <Scale className="w-10 h-10 text-arena-accent mx-auto" />
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            The Deterministic Predicate Oracle
          </h3>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Traditional injection benchmarks rely on another LLM as a judge, which is itself vulnerable to prompt injection. BreakTheGuard uses pure deterministic code and Unicode NFKD normalization to evaluate breaches with mathematical certainty.
          </p>
          <div className="pt-2">
            <Link
              to="/gate"
              className="inline-flex items-center gap-2 text-arena-accent hover:text-white text-sm font-semibold transition-colors"
            >
              <span>Test the GuardGate Consumer Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

