// Time: reading clocks (o'clock → any minute), choosing the right clock,
// time in words, time passing, 24-hour times, parts of the day, what
// happens first, days of the week and months.
(() => {
  'use strict';
  const { rand, pick, span, shuffle, cap, withDistractors, choicesFor, pickType } = Quest;

  const HOUR_WORDS = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
  const NUM_WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'quarter', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const pad = (m) => String(m).padStart(2, '0');
  const fix = (h) => ((h - 1 + 1200) % 12) + 1; // keep hours 1–12
  const digital = (h, m) => `${h}:${pad(m)}`;
  function minuteWords(m) {
    if (m <= 20) return m === 15 ? 'quarter' : `${NUM_WORDS[m]}${m % 5 ? (m === 1 ? ' minute' : ' minutes') : ''}`;
    return `twenty-${NUM_WORDS[m - 20]}${m % 5 ? ' minutes' : ''}`;
  }
  function inWords(h, m) {
    if (m === 0) return `${HOUR_WORDS[h % 12]} o'clock`;
    if (m === 30) return `half past ${HOUR_WORDS[h % 12]}`;
    if (m < 30) return `${minuteWords(m)} past ${HOUR_WORDS[h % 12]}`;
    return `${minuteWords(60 - m)} to ${HOUR_WORDS[fix(h + 1) % 12]}`;
  }
  // Short labels for young children: "3 o'clock", "half past 3".
  function shortWords(h, m) {
    if (m === 0) return `${h} o'clock`;
    if (m === 30) return `half past ${h}`;
    if (m === 15) return `quarter past ${h}`;
    if (m === 45) return `quarter to ${fix(h + 1)}`;
    return digital(h, m);
  }

  function clock(h, m, { ticks = false } = {}) {
    const hourA = ((h % 12) + m / 60) * 30;
    const minA = m * 6;
    const nums = span(1, 12).map((n) => {
      const a = (n * 30 * Math.PI) / 180;
      return `<text x="${(50 + 36 * Math.sin(a)).toFixed(1)}" y="${(50 - 36 * Math.cos(a) + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#2b2d42">${n}</text>`;
    }).join('');
    const marks = ticks
      ? span(0, 59).map((k) => `<line x1="50" y1="4.5" x2="50" y2="${k % 5 ? 7 : 9}" stroke="#9aa0b8" stroke-width="${k % 5 ? 0.8 : 1.6}" transform="rotate(${k * 6} 50 50)"/>`).join('')
      : '';
    return `<svg class="clock-svg" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="47" fill="#fff" stroke="#1b98e0" stroke-width="4"/>
      ${marks}${nums}
      <line x1="50" y1="50" x2="50" y2="27" stroke="#2b2d42" stroke-width="5" stroke-linecap="round" transform="rotate(${hourA} 50 50)"/>
      <line x1="50" y1="50" x2="50" y2="13" stroke="#f15bb5" stroke-width="3" stroke-linecap="round" transform="rotate(${minA} 50 50)"/>
      <circle cx="50" cy="50" r="3.5" fill="#2b2d42"/>
    </svg>`;
  }
  const bigClock = (h, m, ticks) => `<div class="clock-big">${clock(h, m, { ticks })}</div>`;

  // Which minutes this age reads.
  const minutesFor = (s) => ({
    oclock: [0], half: [0, 30], quarter: [0, 15, 30, 45],
    five: span(0, 11).map((k) => k * 5), any: span(0, 59),
  });

  // Typical mistakes: hour one off (esp. half past), past/to mixed up, hands swapped.
  function mistakes(h, m, minutes) {
    const out = [[fix(h + 1), m], [fix(h - 1), m]];
    if (m !== 0) out.push([h, (60 - m) % 60], [fix(h + 1), (60 - m) % 60]);
    if (m === 0) out.push([12, 0], [h, 30]);
    if (m % 5 === 0 && m !== 0) out.push([fix(m / 5), (h % 12) * 5]);
    out.push([h, (m + 30) % 60]);
    return out.filter(([hh, mm]) => minutes.includes(mm) && !(hh === h && mm === m));
  }
  const uniqTimes = (arr) => [...new Map(arr.map(([hh, mm]) => [`${hh}:${mm}`, [hh, mm]])).values()];
  function timeChoices(h, m, n, minutes) {
    const preferred = uniqTimes(mistakes(h, m, minutes));
    const out = [[h, m]];
    for (const t of shuffle(preferred)) if (out.length < n) out.push(t);
    while (out.length < n) {
      const t = [rand(1, 12), pick(minutes)];
      if (!out.some(([a, b]) => a === t[0] && b === t[1])) out.push(t);
    }
    return shuffle(out);
  }

  const ROUTINES = [
    ['🥣', 'eating breakfast', 'morning'], ['⏰', 'waking up', 'morning'], ['🎒', 'going to school', 'morning'],
    ['🌅', 'the sun coming up', 'morning'], ['⚽', 'playing after school', 'afternoon'], ['🛝', 'the playground after lunch', 'afternoon'],
    ['🛏️', 'going to bed', 'night'], ['😴', 'fast asleep', 'night'], ['🌙', 'the moon and stars', 'night'], ['🦉', 'owls hooting', 'night'],
  ];
  const DAY_PARTS = [['morning', '🌅'], ['afternoon', '☀️'], ['night', '🌙']];
  const SEQUENCES = [
    ['🥚', '🐣', 'egg', 'chick'], ['🐛', '🦋', 'caterpillar', 'butterfly'], ['🌱', '🌻', 'seedling', 'flower'],
    ['🧦', '👟', 'socks', 'shoes'], ['🌧️', '🌈', 'rain', 'rainbow'], ['👶', '🧒', 'baby', 'child'],
    ['🌰', '🌳', 'acorn', 'tree'], ['🍞', '🥪', 'bread', 'sandwich'], ['🥚', '🍳', 'egg', 'fried egg'], ['🧊', '💧', 'ice', 'water'],
  ];

  const GEN = {
    readClock(s) {
      const minutes = minutesFor(s)[s.kind];
      const h = rand(1, 12);
      // Lean towards the newest kind of time for this age (e.g. half past at 6).
      const m = s.kind === 'half' || s.kind === 'quarter' ? pick([...minutes, ...minutes.filter((x) => x !== 0)]) : pick(minutes);
      const label = s.age >= 8 ? digital : shortWords;
      const values = timeChoices(h, m, s.n, minutes);
      return {
        instruction: 'What time is it?',
        visual: bigClock(h, m, s.kind === 'five' || s.kind === 'any'),
        question: '',
        options: values.map(([hh, mm]) => ({ value: digital(hh, mm), label: label(hh, mm) })),
        answer: digital(h, m),
        explain: m === 0
          ? `The long hand points to 12 and the short hand to ${h}: ${h} o'clock.`
          : `It's ${inWords(h, m)} (${digital(h, m)}).`,
        say: 'What time is it?',
        optionStyle: 'word',
      };
    },
    pickClock(s) {
      const minutes = minutesFor(s)[s.kind];
      const h = rand(1, 12);
      const m = pick(minutes);
      const values = timeChoices(h, m, s.n, minutes);
      return {
        instruction: `Which clock shows <em>${s.age >= 8 ? inWords(h, m) : shortWords(h, m)}</em>?`,
        visual: '',
        question: '',
        options: values.map(([hh, mm], i) => ({ value: digital(hh, mm), label: `clock ${i + 1}`, html: clock(hh, mm) })),
        answer: digital(h, m),
        explain: `${cap(inWords(h, m))}: the long hand points to ${m === 0 ? 12 : m / 5}.`,
        say: `Which clock shows ${inWords(h, m)}?`,
        optionStyle: 'clock',
      };
    },
    wording(s) {
      const minutes = minutesFor(s)[s.kind].filter((x) => x !== 0);
      const h = rand(1, 12);
      const m = pick(minutes);
      const values = timeChoices(h, m, s.n, minutes);
      return {
        instruction: 'How do we say this time?',
        visual: '',
        question: `<span class="digital">${digital(h, m)}</span>`,
        options: values.map(([hh, mm]) => ({ value: digital(hh, mm), label: inWords(hh, mm) })),
        answer: digital(h, m),
        explain: `${digital(h, m)} is ${inWords(h, m)}.`,
        optionStyle: 'word',
      };
    },
    elapsed(s) {
      const steps = s.age === 8 ? [15, 30, 60] : [20, 45, 75, 90, -30, -15];
      const step = pick(steps);
      const h = rand(1, 12);
      const m = s.age === 8 ? pick([0, 15, 30, 45]) : pick(span(0, 11).map((k) => k * 5));
      const total = (h % 12) * 60 + m + step;
      const nh = fix(Math.floor((((total % 720) + 720) % 720) / 60) || 12);
      const nm = (((total % 60) + 60) % 60);
      const values = timeChoices(nh, nm, s.n, span(0, 11).map((k) => k * 5));
      const say = step >= 60 ? `${step === 60 ? '1 hour' : `1 hour ${step - 60} minutes`}` : `${Math.abs(step)} minutes`;
      return {
        instruction: step > 0 ? `What time will it be in <em>${say}</em>?` : `What time was it <em>${say} ago</em>?`,
        visual: bigClock(h, m, true),
        question: '',
        options: values.map(([hh, mm]) => ({ value: digital(hh, mm), label: digital(hh, mm) })),
        answer: digital(nh, nm),
        explain: `${digital(h, m)} ${step > 0 ? '+' : '−'} ${say} = ${digital(nh, nm)}.`,
        optionStyle: 'word',
      };
    },
    clock24(s) {
      const h24 = rand(13, 23);
      const m = pick([0, 15, 30, 45]);
      const h = h24 - 12;
      const right = `${digital(h, m)} pm`;
      const wrongs = [`${digital(h, m)} am`, `${digital(fix(h24 - 10), m)} pm`, `${digital(fix(h + 2), m)} pm`, `${digital(fix(h - 2), m)} pm`];
      return {
        instruction: 'This is a 24-hour time. What is it on a normal clock?',
        visual: '',
        question: `<span class="digital">${h24}:${pad(m)}</span>`,
        options: Quest.withDistractors(right, wrongs, s.n).map((v) => ({ value: v, label: v })),
        answer: right,
        explain: `Take away 12: ${h24}:${pad(m)} is ${right}.`,
        optionStyle: 'word',
      };
    },
    dayPart(s) {
      const [emoji, what, part] = pick(ROUTINES);
      const names = DAY_PARTS.map(([p]) => p);
      const chosen = withDistractors(part, names, Math.min(s.n, 3));
      const opts = DAY_PARTS.filter(([p]) => chosen.includes(p));
      return {
        instruction: `When is this? <em>${what}</em>`,
        visual: Quest.picture(emoji),
        question: '',
        options: opts.map(([p, e]) => ({ value: p, label: e, caption: p })),
        answer: part,
        explain: `${cap(what)} happens in the ${part}.`,
        say: `When is this? ${what}. ${opts.map(([p]) => p).join(', or ')}?`,
        optionStyle: 'emoji',
      };
    },
    firstThen(s) {
      const seq = pick(SEQUENCES);
      if (s.age === 4 || Math.random() < 0.5) {
        const entries = shuffle([[seq[0], seq[2]], [seq[1], seq[3]]]);
        return {
          instruction: 'Which comes <em>first</em>?',
          visual: '',
          question: '',
          options: entries.map(([e, w]) => ({ value: w, label: e, caption: w })),
          answer: seq[2],
          explain: `First the ${seq[2]}, then the ${seq[3]}.`,
          say: `Which comes first? ${entries.map((x) => x[1]).join(', or ')}?`,
          optionStyle: 'emoji',
        };
      }
      const others = shuffle(SEQUENCES.filter((x) => x !== seq && x[3] !== seq[3])).slice(0, s.n - 1);
      const entries = shuffle([[seq[1], seq[3]], ...others.map((x) => [x[1], x[3]])]);
      return {
        instruction: 'What comes <em>next</em>?',
        visual: Quest.picture(seq[0], seq[2]),
        question: '',
        options: entries.map(([e, w]) => ({ value: w, label: e, caption: w })),
        answer: seq[3],
        explain: `After the ${seq[2]} comes the ${seq[3]}.`,
        say: `What comes after the ${seq[2]}? ${entries.map((x) => x[1]).join(', or ')}?`,
        optionStyle: 'emoji',
      };
    },
    days(s) {
      const i = rand(0, 6);
      const k = s.age >= 7 ? pick([1, 2, 3]) : 1;
      const after = s.age === 5 ? true : Math.random() < 0.6;
      const answer = DAYS[(i + (after ? k : -k) + 7) % 7];
      const ask = k === 1 ? (after ? 'comes after' : 'comes before') : `is ${k} days ${after ? 'after' : 'before'}`;
      return {
        instruction: `What day ${ask} <em>${DAYS[i]}</em>?`,
        visual: '',
        question: '',
        options: withDistractors(answer, DAYS.filter((d) => d !== DAYS[i]), s.n, [DAYS[(i + 1) % 7], DAYS[(i + 6) % 7], DAYS[(i + 2) % 7]]).map((v) => ({ value: v, label: v })),
        answer,
        explain: `${answer} ${ask} ${DAYS[i]}.`,
        say: `What day ${ask} ${DAYS[i]}?`,
        optionStyle: 'word',
      };
    },
    months(s) {
      if (Math.random() < 0.35) {
        const i = rand(0, 11);
        const ord = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'][i];
        return {
          instruction: `Which is the <em>${ord}</em> month of the year?`,
          visual: '',
          question: '',
          options: withDistractors(MONTHS[i], MONTHS, s.n, [MONTHS[(i + 1) % 12], MONTHS[(i + 11) % 12]]).map((v) => ({ value: v, label: v })),
          answer: MONTHS[i],
          explain: `${MONTHS[i]} is month number ${i + 1}.`,
          optionStyle: 'word',
        };
      }
      const i = rand(0, 11);
      const after = Math.random() < 0.6;
      const answer = MONTHS[(i + (after ? 1 : 11)) % 12];
      return {
        instruction: `Which month comes ${after ? 'after' : 'before'} <em>${MONTHS[i]}</em>?`,
        visual: '',
        question: '',
        options: withDistractors(answer, MONTHS.filter((x) => x !== MONTHS[i]), s.n, [MONTHS[(i + 1) % 12], MONTHS[(i + 11) % 12], MONTHS[(i + 2) % 12]]).map((v) => ({ value: v, label: v })),
        answer,
        explain: `${answer} comes ${after ? 'after' : 'before'} ${MONTHS[i]}.`,
        optionStyle: 'word',
      };
    },
  };

  // Clock reading gets finer with age: o'clock → half past → quarters → 5 minutes → any minute.
  function plan(age, level) {
    const extra = (cond, list) => (cond ? list : []);
    return {
      4: { kind: 'oclock', types: ['readClock', 'dayPart', 'dayPart', 'firstThen', 'firstThen'] },
      5: { kind: level < 3 ? 'oclock' : 'half', types: ['readClock', 'readClock', 'dayPart', 'firstThen', ...extra(level >= 3, ['days', 'pickClock'])] },
      6: { kind: 'half', types: ['readClock', 'readClock', 'pickClock', 'days', 'firstThen'] },
      7: { kind: 'quarter', types: ['readClock', 'readClock', 'pickClock', 'wording', 'days', 'months'] },
      8: { kind: level < 3 ? 'quarter' : 'five', types: ['readClock', 'readClock', 'pickClock', 'wording', 'elapsed', 'months'] },
      9: { kind: level < 3 ? 'five' : 'any', types: ['readClock', 'readClock', 'pickClock', 'wording', 'elapsed', 'elapsed', 'clock24'] },
    }[age];
  }

  Quest.subjects.time = {
    make(age, level, previousType) {
      const p = plan(age, level);
      const s = { age, level, n: choicesFor(age, level), kind: p.kind };
      const type = pickType(p.types, previousType);
      return { type, optionStyle: 'word', ...GEN[type](s) };
    },
  };
})();
