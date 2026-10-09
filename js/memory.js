// Memory: look at some pictures, they hide, then answer a question about
// them. Uses `study` (shown first, then hidden) before the question.
(() => {
  'use strict';
  const { rand, pick, shuffle, withDistractors, nearNumbers, choicesFor, pickType } = Quest;

  const SETS = [
    ['🐱', '🐶', '🐰', '🐸', '🐻', '🦊', '🐼', '🐵', '🐷', '🐮', '🦁', '🐯', '🐨', '🐔'],
    ['🍎', '🍌', '🍇', '🍓', '🍒', '🍐', '🍊', '🍉', '🍋', '🥕', '🌽', '🍕', '🧁', '🍪'],
    ['🚗', '🚌', '🚲', '✈️', '🚀', '⛵', '🚂', '🚁', '🚜', '🛴', '🚒', '🚑'],
    ['⚽', '🎈', '🎁', '🧸', '🪁', '🎨', '🎸', '📚', '🔑', '☂️', '⏰', '🎩', '👑', '🧦'],
  ];

  // How many things to remember, and for how long.
  function sizes(age, level) {
    const base = { 4: 3, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7 }[age];
    const count = base + (level >= 3 ? 1 : 0) + (level >= 6 ? 1 : 0);
    const perItem = age <= 5 ? 1300 : age <= 7 ? 1000 : 800;
    const ms = Math.max(2500, count * perItem - (level - 1) * 150);
    return { count, ms };
  }
  const row = (items) => `<div class="memory-row">${items.map((x, i) => `<span style="animation-delay:${i * 60}ms">${x}</span>`).join('')}</div>`;
  const emojiOpts = (values) => values.map((v) => ({ value: v, label: v }));

  const GEN = {
    missing(s) {
      const set = pick(SETS);
      const pool = shuffle(set);
      const shown = pool.slice(0, s.count);
      const gone = pick(shown);
      const left = shuffle(shown.filter((x) => x !== gone));
      return {
        study: { instruction: 'Look carefully! Remember them all.', visual: row(shown) },
        instruction: 'One has gone! Which one is <em>missing</em>?',
        visual: row(left),
        question: '',
        options: emojiOpts(withDistractors(gone, pool.slice(s.count), s.n)),
        answer: gone,
        explain: `The ${gone} was missing.`,
        say: 'One has gone! Which one is missing?',
      };
    },
    seen(s) {
      const set = pick(SETS);
      const pool = shuffle(set);
      const shown = pool.slice(0, s.count);
      const answer = pick(shown);
      return {
        study: { instruction: 'Look carefully! Remember them all.', visual: row(shown) },
        instruction: 'Which one did you <em>see</em>?',
        visual: '',
        question: '',
        options: emojiOpts(withDistractors(answer, pool.slice(s.count), s.n)),
        answer,
        explain: `The ${answer} was there.`,
        say: 'Which one did you see?',
      };
    },
    order(s) {
      const shown = shuffle(pick(SETS)).slice(0, s.count);
      const kind = pick(s.age >= 8 ? ['after', 'before', 'first', 'last'] : ['after', 'first', 'last']);
      let answer, ask;
      if (kind === 'first' || kind === 'last') {
        answer = kind === 'first' ? shown[0] : shown[shown.length - 1];
        ask = `Which one was <em>${kind}</em> in the line?`;
      } else {
        const i = kind === 'after' ? rand(0, shown.length - 2) : rand(1, shown.length - 1);
        answer = shown[kind === 'after' ? i + 1 : i - 1];
        ask = `Which one came just <em>${kind}</em> the ${shown[i]}?`;
      }
      return {
        study: { instruction: 'Remember the order, from left to right!', visual: row(shown) },
        instruction: ask,
        visual: '',
        question: '',
        options: emojiOpts(withDistractors(answer, shown, s.n)),
        answer,
        explain: `The line was ${shown.join(' ')}.`,
      };
    },
    count(s) {
      const set = shuffle(pick(SETS));
      const kinds = set.slice(0, s.age <= 5 ? 2 : 3);
      const counts = kinds.map(() => rand(1, s.age <= 5 ? 3 : 4));
      const items = shuffle(kinds.flatMap((k, i) => Array(counts[i]).fill(k)));
      const ask = rand(0, kinds.length - 1);
      return {
        study: { instruction: 'Count them while you can!', visual: row(items) },
        instruction: `How many ${kinds[ask]} were there?`,
        visual: '',
        question: '',
        options: nearNumbers(counts[ask], s.n, 2, 1).map((v) => ({ value: v, label: String(v) })),
        answer: counts[ask],
        explain: `There were ${counts[ask]} ${kinds[ask]}.`,
        say: 'How many were there?',
        optionStyle: 'number',
      };
    },
  };

  function types(age, level) {
    return {
      4: ['missing', 'seen', 'seen'],
      5: ['missing', 'seen', ...(level >= 3 ? ['count'] : [])],
      6: ['missing', 'seen', 'count', 'order'],
      7: ['missing', 'missing', 'seen', 'count', 'order'],
      8: ['missing', 'missing', 'count', 'order', 'order'],
      9: ['missing', 'missing', 'count', 'order', 'order'],
    }[age];
  }

  Quest.subjects.memory = {
    make(age, level, previousType) {
      const { count, ms } = sizes(age, level);
      const s = { age, level, count, n: choicesFor(age, level) };
      const type = pickType(types(age, level), previousType);
      const q = GEN[type](s);
      q.study.ms = type === 'count' ? ms + 1000 : ms;
      return { type, optionStyle: 'emoji', ...q };
    },
  };
})();
