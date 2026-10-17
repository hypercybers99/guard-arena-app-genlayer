import { describe, it, expect } from 'vitest';
import { checkBreachPredicate, normalizeText } from '../../src/lib/breachPredicate';

describe('Deterministic Breach Predicate Unit Tests', () => {
  it('detects plain whole-word forbidden tokens', () => {
    const res = checkBreachPredicate('I love eating an apple every day.', 'apple');
    expect(res.breached).toBe(true);
    expect(res.matchType).toBe('whole_word');
    expect(res.excerpt).toContain('apple');
  });

  it('detects case-insensitive and NFKD-folded occurrences', () => {
    const res = checkBreachPredicate('The yellow fruit is a LeMoN.', 'lemon');
    expect(res.breached).toBe(true);
    expect(res.matchType).toBe('whole_word');
  });

  it('detects spaced-out and punctuated letter spelling', () => {
    const resSpaces = checkBreachPredicate('Look at this: p e n c i l on the table', 'pencil');
    expect(resSpaces.breached).toBe(true);
    expect(resSpaces.matchType).toBe('spelled_out');

    const resDashes = checkBreachPredicate('The fruit l-e-m-o-n is sour', 'lemon');
    expect(resDashes.breached).toBe(true);
    expect(resDashes.matchType).toBe('spelled_out');

    const resDots = checkBreachPredicate('Secret code: a.p.p.l.e', 'apple');
    expect(resDots.breached).toBe(true);
    expect(resDots.matchType).toBe('spelled_out');
  });

  it('does NOT trigger on benign substrings within legitimate words', () => {
    const resPineapple = checkBreachPredicate('I drank fresh pineapple juice.', 'apple');
    expect(resPineapple.breached).toBe(false);

    const resLemonade = checkBreachPredicate('She sold cold lemonade at the stand.', 'lemon');
    expect(resLemonade.breached).toBe(false);

    const resGrapple = checkBreachPredicate('Wrestlers grapple on the mat.', 'apple');
    expect(resGrapple.breached).toBe(false);
  });

  it('respects the 240 character reply cap', () => {
    const filler = 'a'.repeat(250);
    const replyWithTokenPastCap = filler + ' apple';
    const res = checkBreachPredicate(replyWithTokenPastCap, 'apple');
    expect(res.breached).toBe(false);
  });
});
