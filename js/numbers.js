// Numbers: counting, bigger/smaller, + − × ÷, < > =, missing numbers.
(() => {
  'use strict';
  const { rand, pick, span, shuffle, choicesFor, pickType, box } = Quest;

  const ITEMS = [
    { e: '🍎', name: 'apples' }, { e: '⭐', name: 'stars' }, { e: '🐟', name: 'fish' },
    { e: '🌸', name: 'flowers' }, { e: '🍓', name: 'strawberries' }, { e: '🐞', name: 'ladybirds' },
    { e: '🎈', name: 'balloons' }, { e: '🧁', name: 'cupcakes' }, { e: '🐥', name: 'chicks' },
  ];

  // Each age has its own ranges; within an age the numbers grow level by level
  // until they reach the full range at about level 6.
  function settings(age, level) {
    const i = age - 4;
    const grow = Math.min(1, 0.45 + 0.11 * (level - 1));
    const numMax = Math.max(5, Math.round([10, 20, 50, 100, 500, 1000][i] * grow));
    const sumMax = Math.max(3, Math.round([5, 10, 20, 50, 100, 1000][i] * grow));
    const tables = age === 8
      ? (level < 3 ? [2, 5, 10] : span(2, Math.min(10, 3 + level)))
      : span(2, Math.min(12, 5 + level));
    const extra = (cond, list) => (cond ? list : []);
    const types = {
      4: ['count', 'count', 'bigger', 'smaller', ...extra(level >= 3, ['add', 'add'])],
      5: ['count', 'bigger', 'smaller', 'add', 'add', ...extra(level >= 3, ['sub', 'sub'])],
      6: ['bigger', 'smaller', 'add', 'add', 'sub', 'sub', ...extra(level >= 3, ['compare'])],
      7: ['bigger', 'smaller', 'compare', 'add', 'add', 'sub', 'sub', ...extra(level >= 3, ['missing'])],
      8: ['compare', 'bigger', 'add', 'sub', 'mul', 'mul', 'missing', ...extra(level >= 3, ['div'])],
      9: ['compare', 'add', 'sub', 'mul', 'mul', 'div', 'div', 'missing'],
    }[age];
    return { age, level, numMax, sumMax, choices: choicesFor(age, level), tables, types, pictures: age <= 5 };
  }

  // Wrong answers that sit close to the right one, so the child has to think.
  function nearChoices(answer, n, spread, min = 0) {
    const set = new Set([answer]);
    let guard = 0;
    while (set.size < n && guard++ < 300) {
      const d = answer + rand(-spread, spread);
      if (d >= min) set.add(d);
    }
    let k = 1;
    while (set.size < n) set.add(answer + k++);
    return shuffle([...set]);
  }
  const spreadFor = (answer, s) => (s.age <= 5 ? 2 : Math.max(3, Math.min(12, Math.round(answer * 0.2))));

  function distinctNumbers(s, n) {
    const min = s.age <= 5 ? 1 : 0;
    const set = new Set();
    if (s.age >= 7 && s.level >= 3) {
      // Older kids at higher levels: numbers close together (e.g. 47 vs 52).
      const w = Math.max(5, Math.round(s.numMax / 8));
      const centre = rand(w, s.numMax - w);
      while (set.size < n) set.add(rand(centre - w, centre + w));
    } else {
      while (set.size < n) set.add(rand(min, s.numMax));
    }
    return shuffle([...set]);
  }

  const pictureRow = (count, emoji, goneFrom = Infinity) =>
    `<div class="group">${Array.from({ length: count }, (_, i) =>
      `<span class="item${i >= goneFrom ? ' gone' : ''}" style="animation-delay:${i * 40}ms">${emoji}</span>`).join('')}</div>`;

  const numOptions = (values, s, dots = false) =>
    values.map((v) => ({ value: v, label: String(v), dots: dots && s.pictures && v <= 10 ? v : 0 }));


  const GEN = {
    count(s) {
      const n = rand(1, Math.min(s.numMax, 10));
      const it = pick(ITEMS);
      return {
        instruction: `How many ${it.name} can you count?`,
        visual: pictureRow(n, it.e),
        question: '',
        options: numOptions(nearChoices(n, s.choices, 2, 1), s),
        answer: n,
        explain: `There are ${n} ${it.name}.`,
        say: `How many ${it.name} can you count?`,
      };
    },
    bigger(s) { return pickOne(s, true); },
    smaller(s) { return pickOne(s, false); },
    add(s) {
      const min = s.age <= 5 ? 1 : 0;
      const total = rand(Math.max(2, min * 2), s.sumMax);
      const a = rand(min, total - min);
      const b = total - a;
      const it = pick(ITEMS);
      return {
        instruction: 'Add them together!',
        visual: s.pictures && total <= 10
          ? `${pictureRow(a, it.e)}<span class="op">+</span>${pictureRow(b, it.e)}` : '',
        question: `${a} + ${b} = ${box}`,
        options: numOptions(nearChoices(total, s.choices, spreadFor(total, s)), s),
        answer: total,
        explain: `${a} + ${b} = ${total}`,
        say: `What is ${a} plus ${b}?`,
      };
    },
    sub(s) {
      const a = rand(2, Math.max(2, s.sumMax));
      const b = rand(1, a);
      const it = pick(ITEMS);
      const answer = a - b;
      return {
        instruction: 'Take away!',
        visual: s.pictures && a <= 10 ? pictureRow(a, it.e, a - b) : '',
        question: `${a} − ${b} = ${box}`,
        options: numOptions(nearChoices(answer, s.choices, spreadFor(answer, s)), s),
        answer,
        explain: `${a} − ${b} = ${answer}`,
        say: `What is ${a} take away ${b}?`,
      };
    },
    mul(s) {
      const t = pick(s.tables);
      const k = rand(1, s.age === 9 ? Math.min(12, 8 + s.level) : 10);
      const answer = t * k;
      const pool = shuffle([t * (k - 1), t * (k + 1), answer + 1, answer - 1, (t + 1) * k, answer + 2, answer - t - 1]
        .filter((v) => v >= 0 && v !== answer));
      const values = shuffle([answer, ...[...new Set(pool)].slice(0, s.choices - 1)]);
      return {
        instruction: 'Times tables!',
        visual: '',
        question: `${t} × ${k} = ${box}`,
        options: numOptions(values, s),
        answer,
        explain: `${t} × ${k} = ${answer}`,
      };
    },
    div(s) {
      const t = pick(s.tables);
      const k = rand(1, 10);
      return {
        instruction: 'Share it out!',
        visual: '',
        question: `${t * k} ÷ ${t} = ${box}`,
        options: numOptions(nearChoices(k, s.choices, 3, 1), s),
        answer: k,
        explain: `${t * k} ÷ ${t} = ${k}`,
      };
    },
    missing(s) {
      if (s.age === 9 && Math.random() < 0.4) {
        const t = pick(s.tables);
        const k = rand(2, 10);
        return {
          instruction: 'Find the missing number!',
          visual: '',
          question: `${box} × ${t} = ${t * k}`,
          options: numOptions(nearChoices(k, s.choices, 3, 1), s),
          answer: k,
          explain: `${k} × ${t} = ${t * k}`,
        };
      }
      const c = rand(3, s.sumMax);
      const a = rand(1, c - 1);
      const b = c - a;
      const plus = Math.random() < 0.6;
      return {
        instruction: 'Find the missing number!',
        visual: '',
        question: plus ? `${a} + ${box} = ${c}` : `${c} − ${box} = ${a}`,
        options: numOptions(nearChoices(b, s.choices, spreadFor(b, s), 1), s),
        answer: b,
        explain: plus ? `${a} + ${b} = ${c}` : `${c} − ${b} = ${a}`,
      };
    },
    compare(s) {
      let left, leftLabel;
      if (s.age >= 8 && s.level >= 3 && Math.random() < 0.6) {
        // Left side is a sum or product: work it out, then compare.
        if (s.age === 9 && Math.random() < 0.5) {
          const t = pick(s.tables), k = rand(2, 10);
          left = t * k; leftLabel = `${t} × ${k}`;
        } else {
          const a = rand(1, Math.round(s.sumMax / 2)), b = rand(1, Math.round(s.sumMax / 2));
          left = a + b; leftLabel = `${a} + ${b}`;
        }
      } else {
        left = rand(0, s.numMax); leftLabel = String(left);
      }
      const roll = Math.random();
      const right = roll < 0.25 ? left : Math.max(0, left + (roll < 0.62 ? -1 : 1) * rand(1, Math.max(2, Math.round(s.numMax / 10))));
      const answer = left < right ? '<' : left > right ? '>' : '=';
      const word = { '<': 'smaller than', '>': 'bigger than', '=': 'equal to' };
      return {
        instruction: 'Which sign goes in the box?',
        visual: '',
        question: `${leftLabel} ${box} ${right}`,
        options: [
          { value: '<', label: '<', caption: 'smaller' },
          { value: '=', label: '=', caption: 'equal' },
          { value: '>', label: '>', caption: 'bigger' },
        ],
        answer,
        explain: `${leftLabel} is ${word[answer]} ${right}.`,
      };
    },
  };

  function pickOne(s, bigger) {
    const values = distinctNumbers(s, s.choices);
    const answer = bigger ? Math.max(...values) : Math.min(...values);
    const word = bigger ? (values.length > 2 ? 'biggest' : 'bigger') : (values.length > 2 ? 'smallest' : 'smaller');
    return {
      instruction: `Which number is <em>${word}</em>?`,
      visual: '',
      question: '',
      options: numOptions(values, s, true),
      answer,
      explain: `${answer} is the ${bigger ? 'biggest' : 'smallest'} number.`,
      say: `Which number is ${word}?`,
    };
  }

  Quest.subjects.numbers = {
    make(age, level, previousType) {
      const s = settings(age, level);
      const type = pickType(s.types, previousType);
      return { type, optionStyle: 'number', ...GEN[type](s) };
    },
  };
})();
