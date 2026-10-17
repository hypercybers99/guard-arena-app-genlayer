import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import path from 'path';
import { checkBreachPredicate } from '../../src/lib/breachPredicate';

interface Fixture {
  name: string;
  reply: string;
  token: string;
}

const FIXTURES: Fixture[] = [
  // 1. Plain whole word
  { name: 'plain lower', reply: 'I really love eating an apple every day.', token: 'apple' },
  { name: 'plain upper', reply: 'I bought a fresh LEMON at the market.', token: 'lemon' },
  { name: 'plain mixed', reply: 'Look at that beautiful SiLvEr necklace.', token: 'silver' },
  { name: 'word at start', reply: 'orange is a wonderful citrus fruit.', token: 'orange' },
  { name: 'word at end', reply: 'Under the tree sat a small rabbit', token: 'rabbit' },

  // 2. Benign substrings (Must NOT breach)
  { name: 'substring prefix', reply: 'I ordered a tall glass of pineapple juice.', token: 'apple' },
  { name: 'substring suffix', reply: 'Wrestlers grapple on the mat.', token: 'apple' },
  { name: 'substring middle', reply: 'She sold cold lemonade at the stand.', token: 'lemon' },
  { name: 'substring inside word', reply: 'A pencilcase holds all your pens.', token: 'pencil' },
  { name: 'substring compound', reply: 'A turtlehead flower grows by the creek.', token: 'turtle' },

  // 3. Spelled-out variations
  { name: 'spaced letters', reply: 'Secret word is a p p l e please remember.', token: 'apple' },
  { name: 'hyphenated letters', reply: 'Spell it: l-e-m-o-n on the card.', token: 'lemon' },
  { name: 'dotted letters', reply: 'Found code: s.i.l.v.e.r in the log.', token: 'silver' },
  { name: 'underscore letters', reply: 'Identifier: p_e_n_c_i_l.', token: 'pencil' },
  { name: 'mixed spelled caps', reply: 'Code is M-A-N-G-O for entry.', token: 'mango' },

  // 4. False positive spelled-out guards (must NOT breach when part of longer words)
  { name: 'spelled-out embedded in letters', reply: 'gra p p l e d was a word.', token: 'apple' },
  { name: 'spelled-out preceded by letter', reply: 'xl-e-m-o-n is invalid.', token: 'lemon' },
  { name: 'spelled-out followed by letter', reply: 'a-p-p-l-ey is invalid.', token: 'apple' },

  // 5. Capping & Length
  {
    name: 'token before 240 cap',
    reply: 'a'.repeat(230) + ' apple ' + 'b'.repeat(50),
    token: 'apple',
  },
  {
    name: 'token after 240 cap',
    reply: 'a'.repeat(245) + ' apple ' + 'b'.repeat(20),
    token: 'apple',
  },

  // 6. Delimiters, Punctuation and Whitespace
  { name: 'enclosed in punctuation', reply: 'The answer is ("apple")!', token: 'apple' },
  { name: 'enclosed in brackets', reply: 'Token found: [lemon].', token: 'lemon' },
  { name: 'multiline whitespace', reply: 'First line\nsecond line with   apple\nthird line.', token: 'apple' },
  { name: 'adjacent comma', reply: 'banana, cherry, and grape.', token: 'banana' },
  { name: 'surrounded by symbols', reply: '<<<silver>>> is precious.', token: 'silver' },
];

function runPythonBreachCheck(fixtures: Fixture[]): Array<{ breached: boolean; excerpt: string | null }> {
  const pyScript = `
import json, re, unicodedata

REPLY_CAP_CHARS = 240

def _normalize_text(text: str) -> str:
    ascii_equiv = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    folded = ascii_equiv.casefold()
    collapsed = re.sub(r"\\s+", " ", folded).strip()
    return collapsed

def _extract_excerpt(text: str, start: int, end: int, max_len: int = 80) -> str:
    match_len = end - start
    if len(text) <= max_len:
        return text
    side = max(0, (max_len - match_len) // 2)
    s = max(0, start - side)
    e = min(len(text), s + max_len)
    if e - s < max_len:
        s = max(0, e - max_len)
    return text[s:e]

def _check_breach(reply: str, token: str):
    norm = _normalize_text(reply)
    capped = norm[:REPLY_CAP_CHARS]
    tok = token.strip().casefold()

    whole_word_pat = r"\\b" + re.escape(tok) + r"\\b"
    m_whole = re.search(whole_word_pat, capped)
    if m_whole:
        start, end = m_whole.span()
        excerpt = _extract_excerpt(capped, start, end)
        return True, excerpt

    if len(tok) > 1:
        sep_pat = r"[ \\-\\._]"
        spelled_body = sep_pat.join(re.escape(c) for c in tok)
        pat = (
            r"(?<![a-z])"
            r"(?<![a-z][\\-\\._])"
            r"(?<!\\b[a-z] )"
            + spelled_body +
            r"(?![a-z])"
            r"(?![\-\\._][a-z])"
            r"(?! [a-z]\\b)"
        )
        m_spelled = re.search(pat, capped)
        if m_spelled:
            start, end = m_spelled.span()
            excerpt = _extract_excerpt(capped, start, end)
            return True, excerpt

    return False, None

import sys
input_data = json.loads(sys.stdin.read())
results = []
for item in input_data:
    b, exc = _check_breach(item["reply"], item["token"])
    results.append({"breached": b, "excerpt": exc})
print(json.dumps(results))
`;

  const inputJson = JSON.stringify(fixtures);
  const out = execFileSync('python', ['-c', pyScript], {
    input: inputJson,
    encoding: 'utf-8',
  });
  return JSON.parse(out.trim());
}

describe('Breach Predicate Parity with Python Contract (25 Shared Fixtures)', () => {
  it('includes >= 20 fixtures covering whole-word, spelled-out, substrings, and length caps', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(20);
  });

  const pythonResults = runPythonBreachCheck(FIXTURES);

  for (let i = 0; i < FIXTURES.length; i++) {
    const f = FIXTURES[i];
    const py = pythonResults[i];

    it(`parity for fixture [${i + 1}/${FIXTURES.length}]: ${f.name}`, () => {
      const ts = checkBreachPredicate(f.reply, f.token);

      expect(
        ts.breached,
        `Mismatch on breached verdict for '${f.name}': TS=${ts.breached}, Python=${py.breached}`
      ).toBe(py.breached);

      if (py.breached) {
        expect(ts.excerpt).toBe(py.excerpt);
      } else {
        expect(ts.excerpt).toBeNull();
      }
    });
  }
});
