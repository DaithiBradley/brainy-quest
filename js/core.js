// Shared helpers and the subject registry. Loaded before the subject files.
// Each subject registers Quest.subjects.<id> = { make(age, level, previousType) }
// and make() returns a question:
//   { type, instruction, visual, question, options: [{ value, label, caption?, dots?, aria? }],
//     answer, explain, say?, optionStyle? }
window.Quest = (() => {
  'use strict';

  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const span = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const article = (w) => (/^[aeiou]/i.test(w) ? 'an' : 'a');

  // The answer plus n-1 different wrong answers, shuffled. Wrong answers come
  // from `preferred` first (look-alikes, near misses), then from `pool`.
  function withDistractors(answer, pool, n, preferred = []) {
    const wrong = [];
    for (const p of [...shuffle(preferred), ...shuffle(pool)]) {
      if (wrong.length >= n - 1) break;
      if (p !== answer && !wrong.includes(p)) wrong.push(p);
    }
    return shuffle([answer, ...wrong]);
  }

  // How many answer buttons to show: fewer for the youngest, more as they level up.
  const choicesFor = (age, level) => (age === 4 ? (level < 3 ? 2 : 3) : age <= 6 ? (level < 3 ? 3 : 4) : 4);

  // Choose a question type, avoiding an immediate repeat half of the time.
  function pickType(types, previous) {
    let t = pick(types);
    if (t === previous && Math.random() < 0.5) t = pick(types);
    return t;
  }

  // A big picture with an optional hint (e.g. "?at") under it.
  const picture = (emoji, hint = '') =>
    `<div class="pic-card"><span class="big-pic">${emoji}</span>${hint ? `<span class="word-hint">${hint}</span>` : ''}</div>`;

  const box = '<span class="box">?</span>';

  return { rand, pick, span, shuffle, esc, cap, article, withDistractors, choicesFor, pickType, picture, box, subjects: {} };
})();
