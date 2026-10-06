// Letters: recognising letters, capital/small, first and last letters,
// alphabet order, vowels, letter patterns.
(() => {
  'use strict';
  const { rand, pick, shuffle, cap, withDistractors, choicesFor, pickType, picture, box } = Quest;

  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const abc = ABC.map((l) => l.toLowerCase());
  const VOWELS = ['A', 'E', 'I', 'O', 'U'];
  const CONSONANTS = ABC.filter((l) => !VOWELS.includes(l) && l !== 'Y');

  // Small letters children often mix up, used as tricky wrong answers.
  const LOOKALIKE = {
    a: 'oe', b: 'dpq', c: 'eo', d: 'bpq', e: 'ca', f: 't', g: 'qj', h: 'nb', i: 'lj', j: 'ig', k: 'hx',
    l: 'it', m: 'nw', n: 'mhu', o: 'ca', p: 'qbd', q: 'pdg', r: 'n', s: 'z', t: 'f', u: 'nv', v: 'wuy',
    w: 'mv', x: 'k', y: 'v', z: 's',
  };

  // Pictures whose first letter is clear to a young child.
  const START = [
    ['apple', '🍎'], ['banana', '🍌'], ['bee', '🐝'], ['cat', '🐱'], ['car', '🚗'], ['dog', '🐶'], ['duck', '🦆'],
    ['egg', '🥚'], ['elephant', '🐘'], ['fish', '🐟'], ['frog', '🐸'], ['grapes', '🍇'], ['giraffe', '🦒'],
    ['house', '🏠'], ['horse', '🐴'], ['ice cream', '🍦'], ['juice', '🧃'], ['key', '🔑'], ['lion', '🦁'],
    ['lemon', '🍋'], ['moon', '🌙'], ['monkey', '🐵'], ['nose', '👃'], ['octopus', '🐙'], ['owl', '🦉'],
    ['pig', '🐷'], ['pizza', '🍕'], ['rabbit', '🐰'], ['rocket', '🚀'], ['sun', '☀️'], ['star', '⭐'],
    ['tree', '🌳'], ['tiger', '🐯'], ['umbrella', '☂️'], ['violin', '🎻'], ['whale', '🐳'], ['watch', '⌚'],
    ['yo-yo', '🪀'], ['zebra', '🦓'],
  ];
  // Short words with a clear last letter.
  const END = [
    ['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['bus', '🚌'], ['pig', '🐷'], ['fox', '🦊'], ['bed', '🛏️'],
    ['car', '🚗'], ['owl', '🦉'], ['bat', '🦇'], ['web', '🕸️'], ['map', '🗺️'], ['leg', '🦵'], ['drum', '🥁'],
    ['frog', '🐸'], ['star', '⭐'], ['moon', '🌙'], ['ring', '💍'], ['bell', '🔔'], ['ant', '🐜'], ['crab', '🦀'],
  ];
  // Longer words for counting vowels (no Ys, to keep it fair).
  const VOWEL_WORDS = ['elephant', 'banana', 'dinosaur', 'umbrella', 'penguin', 'octopus', 'giraffe', 'crocodile',
    'tomato', 'potato', 'rainbow', 'camel', 'tiger', 'pirate', 'robot', 'sandwich', 'chocolate', 'avocado',
    'unicorn', 'computer', 'kangaroo', 'helicopter', 'caterpillar', 'spaghetti'];

  const ordinal = (n) => {
    const t = n % 100;
    if (t >= 11 && t <= 13) return `${n}th`;
    return n + ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  };
  const big = (l) => `<span class="big-letter">${l}</span>`;
  const seq = (items) => `<span class="seq">${items.map((x) => (x === '?' ? box : x)).join(' ')}</span>`;
  const opts = (values) => values.map((v) => ({ value: v, label: String(v) }));
  const near = (i, exclude = []) =>
    ABC.slice(Math.max(0, i - 2), Math.min(26, i + 3)).filter((l) => !exclude.includes(l));

  const GEN = {
    matchLetter(s) {
      const t = pick(s.level < 3 ? ABC.slice(0, 13) : ABC);
      return {
        instruction: 'Find the same letter!',
        visual: '',
        question: big(t),
        options: opts(withDistractors(t, ABC, s.n)),
        answer: t,
        explain: `That's the letter ${t}.`,
        say: `Find the letter ${t}.`,
      };
    },
    matchCase(s) {
      const U = pick(ABC);
      const l = U.toLowerCase();
      const tricky = s.level >= 2 ? LOOKALIKE[l].split('') : [];
      if (s.age >= 6 && Math.random() < 0.4) {
        return {
          instruction: 'Find the <em>capital</em> letter that matches!',
          visual: '',
          question: big(l),
          options: opts(withDistractors(U, ABC, s.n, tricky.map((x) => x.toUpperCase()))),
          answer: U,
          explain: `Small ${l} and capital ${U} are the same letter.`,
          say: `Find the capital letter ${U}.`,
        };
      }
      return {
        instruction: 'Find the <em>small</em> letter that matches!',
        visual: '',
        question: big(U),
        options: opts(withDistractors(l, abc, s.n, tricky)),
        answer: l,
        explain: `Capital ${U} and small ${l} are the same letter.`,
        say: `Find the small letter ${U}.`,
      };
    },
    startsWith(s) {
      const [word, emoji] = pick(START);
      const lower = s.age >= 6;
      const answer = lower ? word[0] : word[0].toUpperCase();
      return {
        instruction: 'What letter does this start with?',
        visual: picture(emoji, `${box}${word.slice(1)}`),
        question: '',
        options: opts(withDistractors(answer, lower ? abc : ABC, s.n)),
        answer,
        explain: `${cap(word)} starts with ${answer}.`,
        say: word,
      };
    },
    endsWith(s) {
      const [word, emoji] = pick(END);
      const answer = word[word.length - 1];
      return {
        instruction: 'What letter does this end with?',
        visual: picture(emoji, `${word.slice(0, -1)}${box}`),
        question: '',
        options: opts(withDistractors(answer, abc, s.n)),
        answer,
        explain: `${cap(word)} ends with ${answer}.`,
        say: word,
      };
    },
    nextLetter(s) {
      const i = rand(0, s.age === 5 && s.level < 3 ? 6 : 22);
      const shown = ABC.slice(i, i + 3);
      const answer = ABC[i + 3];
      return {
        instruction: 'What letter comes next?',
        visual: '',
        question: seq([...shown, '?']),
        options: opts(withDistractors(answer, ABC.filter((l) => !shown.includes(l)), s.n, near(i + 3, shown))),
        answer,
        explain: `After ${shown[2]} comes ${answer}.`,
        say: `${shown.join(', ')}. What comes next?`,
      };
    },
    beforeLetter(s) {
      const i = rand(1, 23);
      const shown = ABC.slice(i, i + 3);
      const answer = ABC[i - 1];
      return {
        instruction: 'What letter comes before?',
        visual: '',
        question: seq(['?', ...shown]),
        options: opts(withDistractors(answer, ABC.filter((l) => !shown.includes(l)), s.n, near(i - 1, shown))),
        answer,
        explain: `${answer} comes just before ${shown[0]}.`,
      };
    },
    missingMid(s) {
      const len = s.age >= 8 ? 4 : 3;
      const i = rand(0, 26 - len);
      const run = ABC.slice(i, i + len);
      const pos = rand(1, len - 2);
      const answer = run[pos];
      const shown = run.map((l, k) => (k === pos ? '?' : l));
      return {
        instruction: 'Which letter is missing?',
        visual: '',
        question: seq(shown),
        options: opts(withDistractors(answer, ABC.filter((l) => !run.includes(l)), s.n, near(i + pos, run))),
        answer,
        explain: `${run.join(' ')}: the missing letter is ${answer}.`,
      };
    },
    vowel(s) {
      if (s.age >= 7 && Math.random() < 0.4) {
        const answer = pick(CONSONANTS);
        return {
          instruction: 'Which letter is <em>not</em> a vowel?',
          visual: '',
          question: '',
          options: opts(withDistractors(answer, VOWELS, s.n)),
          answer,
          explain: `${answer} is a consonant. The vowels are A, E, I, O and U.`,
        };
      }
      const answer = pick(VOWELS);
      return {
        instruction: 'Which letter is a <em>vowel</em>?',
        visual: '',
        question: '',
        options: opts(withDistractors(answer, CONSONANTS, s.n)),
        answer,
        explain: `${answer} is a vowel. The vowels are A, E, I, O and U.`,
      };
    },
    alphaFirst(s) {
      const width = s.age >= 8 ? 6 : 26;
      const start = rand(0, 26 - width);
      const letters = shuffle(ABC.slice(start, start + width)).slice(0, s.n);
      const first = Math.random() < 0.6;
      const sorted = [...letters].sort();
      const answer = first ? sorted[0] : sorted[sorted.length - 1];
      return {
        instruction: `Which letter comes <em>${first ? 'first' : 'last'}</em> in the alphabet?`,
        visual: '',
        question: '',
        options: opts(letters),
        answer,
        explain: `In ABC order: ${sorted.join(', ')}.`,
      };
    },
    skipSeq(s) {
      const step = s.age === 9 ? pick([2, 3]) : 2;
      const i = rand(0, 25 - 3 * step);
      const shown = [0, 1, 2].map((k) => ABC[i + k * step]);
      const answer = ABC[i + 3 * step];
      const misses = [ABC[i + 3 * step - 1], ABC[i + 3 * step + 1], ABC[i + 2 * step + 1], ABC[i + 4 * step]].filter(Boolean);
      return {
        instruction: 'What comes next? Look at the jumps!',
        visual: '',
        question: seq([...shown, '?']),
        options: opts(withDistractors(answer, ABC.filter((l) => !shown.includes(l)), s.n, misses.filter((l) => !shown.includes(l)))),
        answer,
        explain: `It jumps ${step} letters each time, so ${answer} is next.`,
      };
    },
    reverse(s) {
      const i = rand(3, 25);
      const shown = [ABC[i], ABC[i - 1], ABC[i - 2]];
      const answer = ABC[i - 3];
      return {
        instruction: 'Going backwards! What comes next?',
        visual: '',
        question: seq([...shown, '?']),
        options: opts(withDistractors(answer, ABC.filter((l) => !shown.includes(l)), s.n, near(i - 3, shown))),
        answer,
        explain: `Backwards: ${shown.join(', ')}, ${answer}.`,
      };
    },
    position(s) {
      const idx = rand(0, 25);
      const L = ABC[idx];
      if (Math.random() < 0.5) {
        const nearNums = [idx, idx + 2, idx - 1, idx + 3].filter((v) => v >= 1 && v <= 26);
        return {
          instruction: `What number is ${L} in the alphabet? (A is 1)`,
          visual: '',
          question: big(L),
          options: opts(withDistractors(idx + 1, Quest.span(1, 26), s.n, nearNums)),
          answer: idx + 1,
          explain: `${L} is letter number ${idx + 1}.`,
          optionStyle: 'number',
        };
      }
      return {
        instruction: `Which is the ${ordinal(idx + 1)} letter of the alphabet?`,
        visual: '',
        question: '',
        options: opts(withDistractors(L, ABC, s.n, near(idx, [L]))),
        answer: L,
        explain: `${L} is the ${ordinal(idx + 1)} letter.`,
      };
    },
    countVowels(s) {
      const word = pick(VOWEL_WORDS);
      const found = word.split('').filter((c) => 'aeiou'.includes(c));
      const answer = found.length;
      return {
        instruction: 'How many vowels are in this word?',
        visual: '',
        question: `<span class="word-big">${word.toUpperCase()}</span>`,
        options: opts(withDistractors(answer, Quest.span(1, 6), s.n, [answer - 1, answer + 1].filter((v) => v > 0))),
        answer,
        explain: `${word.toUpperCase()} has ${answer} vowels: ${found.join(', ').toUpperCase()}.`,
        optionStyle: 'number',
      };
    },
  };

  function types(age, level) {
    const extra = (cond, list) => (cond ? list : []);
    return {
      4: ['matchLetter', 'matchLetter', 'startsWith', 'startsWith', ...extra(level >= 3, ['matchCase'])],
      5: ['matchCase', 'matchCase', 'startsWith', 'startsWith', 'nextLetter', ...extra(level >= 3, ['beforeLetter'])],
      6: ['matchCase', 'startsWith', 'nextLetter', 'beforeLetter', 'vowel', ...extra(level >= 3, ['missingMid', 'endsWith'])],
      7: ['nextLetter', 'beforeLetter', 'missingMid', 'vowel', 'alphaFirst', 'endsWith'],
      8: ['alphaFirst', 'alphaFirst', 'missingMid', 'skipSeq', 'position', 'vowel'],
      9: ['skipSeq', 'reverse', 'position', 'position', 'countVowels', 'alphaFirst'],
    }[age];
  }

  Quest.subjects.letters = {
    make(age, level, previousType) {
      const s = { age, level, n: choicesFor(age, level) };
      const type = pickType(types(age, level), previousType);
      const q = GEN[type](s);
      return { type, optionStyle: 'letter', ...q };
    },
  };
})();
