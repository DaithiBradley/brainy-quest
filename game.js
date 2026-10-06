(() => {
  'use strict';

  // ---------- Config ----------
  const AGES = [
    { age: 4, name: 'Little Chick', emoji: '🐣', color: 'var(--pink)' },
    { age: 5, name: 'Busy Bee', emoji: '🐝', color: 'var(--orange)' },
    { age: 6, name: 'Clever Fox', emoji: '🦊', color: 'var(--sun)' },
    { age: 7, name: 'Brave Turtle', emoji: '🐢', color: 'var(--mint)' },
    { age: 8, name: 'Swift Dolphin', emoji: '🐬', color: 'var(--sea)' },
    { age: 9, name: 'Wise Owl', emoji: '🦉', color: 'var(--grape)' },
  ];
  const OPTION_COLORS = ['var(--sea)', 'var(--pink)', 'var(--orange)', 'var(--grape)'];
  const MAX_LIVES = 3;
  const PER_LEVEL = 5;
  const ITEMS = [
    { e: '🍎', name: 'apples' }, { e: '⭐', name: 'stars' }, { e: '🐟', name: 'fish' },
    { e: '🌸', name: 'flowers' }, { e: '🍓', name: 'strawberries' }, { e: '🐞', name: 'ladybirds' },
    { e: '🎈', name: 'balloons' }, { e: '🧁', name: 'cupcakes' }, { e: '🐥', name: 'chicks' },
  ];
  const PRAISE = ['Great job!', 'Super!', 'You got it!', 'Brilliant!', 'Amazing!', 'Fantastic!', 'Well done!', 'Wow!'];
  const STORE_KEY = 'numberQuest.v1';

  // ---------- Helpers ----------
  const $ = (s) => document.querySelector(s);
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

  // ---------- Saved data (best scores, sound) ----------
  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
  }
  function saveStore(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
  }
  const store = Object.assign({ best: {}, muted: false }, loadStore());

  // ---------- Sound ----------
  let audio;
  function tone(freq, dur, type = 'sine', when = 0, vol = 0.12) {
    if (store.muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime + when;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch { /* audio unavailable */ }
  }
  const sfx = {
    good: () => { tone(660, 0.15); tone(990, 0.22, 'sine', 0.1); },
    bad: () => { tone(260, 0.2, 'triangle'); tone(196, 0.3, 'triangle', 0.15); },
    level: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'sine', i * 0.12)),
    over: () => [523, 440, 392, 523].forEach((f, i) => tone(f, 0.3, 'triangle', i * 0.18)),
    tap: () => tone(520, 0.06, 'sine', 0, 0.06),
  };

  // ---------- Difficulty ----------
  // Each age has its own ranges; within an age the numbers grow level by level
  // until they reach the full range at about level 6.
  function settings(age, level) {
    const i = age - 4;
    const grow = Math.min(1, 0.45 + 0.11 * (level - 1));
    const numMax = Math.max(5, Math.round([10, 20, 50, 100, 500, 1000][i] * grow));
    const sumMax = Math.max(3, Math.round([5, 10, 20, 50, 100, 1000][i] * grow));
    const choices = age === 4 ? (level < 3 ? 2 : 3) : age <= 6 ? (level < 3 ? 3 : 4) : 4;
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
    return { age, level, numMax, sumMax, choices, tables, types, pictures: age <= 5 };
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

  // ---------- Question generators ----------
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
      };
    },
    bigger(s) { return GEN._pickOne(s, true); },
    smaller(s) { return GEN._pickOne(s, false); },
    _pickOne(s, bigger) {
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
      };
    },
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
        question: `${a} + ${b} = <span class="box">?</span>`,
        options: numOptions(nearChoices(total, s.choices, spreadFor(total, s)), s),
        answer: total,
        explain: `${a} + ${b} = ${total}`,
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
        question: `${a} − ${b} = <span class="box">?</span>`,
        options: numOptions(nearChoices(answer, s.choices, spreadFor(answer, s)), s),
        answer,
        explain: `${a} − ${b} = ${answer}`,
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
        question: `${t} × ${k} = <span class="box">?</span>`,
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
        question: `${t * k} ÷ ${t} = <span class="box">?</span>`,
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
          question: `<span class="box">?</span> × ${t} = ${t * k}`,
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
        question: plus ? `${a} + <span class="box">?</span> = ${c}` : `${c} − <span class="box">?</span> = ${a}`,
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
        question: `${leftLabel} <span class="box">?</span> ${right}`,
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

  function makeQuestion(s, previousType) {
    // Avoid the same kind of question three times running.
    let type = pick(s.types);
    if (type === previousType && Math.random() < 0.5) type = pick(s.types);
    return { type, ...GEN[type](s) };
  }

  // ---------- State ----------
  const state = {
    age: 4, level: 1, score: 0, lives: MAX_LIVES, streak: 0,
    inLevel: 0, correct: 0, q: null, locked: false, timer: null, shownAt: 0,
  };

  // ---------- Screens ----------
  function show(id) {
    document.querySelectorAll('.screen').forEach((el) => el.classList.toggle('active', el.id === `screen-${id}`));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderAgeGrid() {
    $('#ageGrid').innerHTML = AGES.map((a) => `
      <button class="age-card" type="button" data-age="${a.age}" style="--c:${a.color}"
        aria-label="Age ${a.age}, ${a.name}. Best score ${store.best[a.age] || 0}">
        <span class="emoji" aria-hidden="true">${a.emoji}</span>
        <span class="age">Age ${a.age}</span>
        <span class="name">${a.name}</span>
        <span class="best">Best: ${store.best[a.age] || 0}</span>
      </button>`).join('');
  }

  // ---------- Game flow ----------
  function startGame(age) {
    clearTimeout(state.timer);
    Object.assign(state, { age, level: 1, score: 0, lives: MAX_LIVES, streak: 0, inLevel: 0, correct: 0, q: null, locked: false });
    const meta = AGES.find((a) => a.age === age);
    $('#mascot').textContent = meta.emoji;
    renderHud();
    show('game');
    nextQuestion();
  }

  function renderHud(lostIndex = -1) {
    $('#lives').innerHTML = Array.from({ length: MAX_LIVES }, (_, i) =>
      `<span class="heart${i >= state.lives ? ' lost' : ''}${i === lostIndex ? ' pop' : ''}">❤️</span>`).join('');
    $('#lives').setAttribute('aria-label', `${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left`);
    $('#level').textContent = state.level;
    $('#score').textContent = state.score;
    $('#progress').style.width = `${(state.inLevel / PER_LEVEL) * 100}%`;
    $('#streak').textContent = state.streak >= 3 ? `🔥 ${state.streak} in a row! Bonus points!` : '';
  }

  function setBubble(text, mood = '') {
    const b = $('#bubble');
    b.textContent = text;
    b.className = `bubble ${mood}`;
  }

  function nextQuestion() {
    const s = settings(state.age, state.level);
    const q = makeQuestion(s, state.q && state.q.type);
    state.q = q;
    state.locked = false;
    state.shownAt = performance.now();

    setBubble(state.streak >= 3 ? "You're on fire!" : pick(['You can do it!', 'Have a think...', "Let's go!", 'Take your time.']));
    $('#instruction').innerHTML = q.instruction;
    $('#visual').innerHTML = q.visual;
    $('#question').innerHTML = q.question;

    const opts = $('#options');
    opts.classList.remove('done');
    opts.style.setProperty('--cols', q.options.length === 3 ? 3 : 2);
    const colors = shuffle(OPTION_COLORS);
    opts.innerHTML = q.options.map((o, i) => `
      <button class="option" type="button" data-index="${i}" style="--c:${colors[i % colors.length]}"
        aria-label="${o.caption ? `${o.label}, ${o.caption}` : o.label}">
        <span class="key" aria-hidden="true">${i + 1}</span>
        <span>${o.label}</span>
        ${o.caption ? `<span class="caption">${o.caption}</span>` : ''}
        ${o.dots ? `<span class="dots" aria-hidden="true">${'<i></i>'.repeat(o.dots)}</span>` : ''}
      </button>`).join('');
    renderHud();
  }

  function choose(index) {
    if (state.locked || !state.q) return;
    // Ignore taps/keys in the first moment of a new question, so a key held or
    // mashed on the last question doesn't answer this one by accident.
    if (performance.now() - state.shownAt < 350) return;
    const btn = $(`#options .option[data-index="${index}"]`);
    if (!btn) return;
    state.locked = true;
    const q = state.q;
    const chosen = q.options[index].value;
    const buttons = [...document.querySelectorAll('#options .option')];
    buttons.forEach((b) => { b.disabled = true; });
    $('#options').classList.add('done');

    if (chosen === q.answer) {
      state.streak += 1;
      state.correct += 1;
      state.inLevel += 1;
      const points = 10 + (state.level - 1) * 5 + (state.streak >= 3 ? 5 : 0);
      state.score += points;
      btn.classList.add('correct');
      setBubble(`${pick(PRAISE)} +${points}`, 'good');
      cheer();
      sfx.good();
      const r = btn.getBoundingClientRect();
      confetti(r.left + r.width / 2, r.top + r.height / 2, 40);
      const pill = $('.score-pill');
      pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
      renderHud();
      state.timer = setTimeout(state.inLevel >= PER_LEVEL ? levelUp : nextQuestion, 1000);
    } else {
      state.streak = 0;
      state.lives -= 1;
      btn.classList.add('wrong');
      const right = buttons[q.options.findIndex((o) => o.value === q.answer)];
      if (right) right.classList.add('reveal');
      setBubble(`Oops! ${q.explain}`, 'bad');
      sfx.bad();
      renderHud(state.lives);
      state.timer = setTimeout(state.lives <= 0 ? gameOver : nextQuestion, 2200);
    }
  }

  function cheer() {
    const m = $('#mascot');
    m.classList.remove('cheer'); void m.offsetWidth; m.classList.add('cheer');
  }

  function levelUp() {
    state.level += 1;
    state.inLevel = 0;
    const gotLife = state.lives < MAX_LIVES;
    if (gotLife) state.lives += 1;
    renderHud();
    $('#bannerTitle').textContent = `Level ${state.level}!`;
    $('#bannerSub').textContent = gotLife ? 'You earned a life back ❤️' : 'Getting a little trickier...';
    $('#banner').hidden = false;
    sfx.level();
    confetti(window.innerWidth / 2, window.innerHeight / 3, 120);
    state.timer = setTimeout(() => { $('#banner').hidden = true; nextQuestion(); }, 1800);
  }

  function gameOver() {
    const prevBest = store.best[state.age] || 0;
    const isBest = state.score > prevBest;
    if (isBest) { store.best[state.age] = state.score; saveStore(store); }
    const stars = state.level >= 5 ? 3 : state.level >= 3 ? 2 : state.correct > 0 ? 1 : 0;
    $('#overMascot').textContent = AGES.find((a) => a.age === state.age).emoji;
    $('#overTitle').textContent = ['Good try!', 'Nice work!', 'Great playing!', 'Superstar!'][stars];
    $('#overStars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? '' : 'off'}">⭐</span>`).join('');
    $('#overStars').setAttribute('aria-label', `${stars} out of 3 stars`);
    $('#overScore').textContent = state.score;
    $('#overLevel').textContent = state.level;
    $('#overCorrect').textContent = state.correct;
    $('#overBest').textContent = Math.max(prevBest, state.score);
    $('#newBest').hidden = !isBest;
    show('over');
    sfx.over();
    if (isBest && state.score > 0) setTimeout(() => confetti(window.innerWidth / 2, window.innerHeight / 3, 160), 250);
    $('#againBtn').focus();
  }

  function goHome() {
    clearTimeout(state.timer);
    $('#banner').hidden = true;
    state.q = null;
    renderAgeGrid();
    show('start');
  }

  // ---------- Confetti ----------
  const canvas = $('#confetti');
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#f15bb5', '#ff8a3d', '#ffc53d', '#06c48f', '#1b98e0', '#9b5de5'];
  let particles = [];
  let running = false;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function confetti(x, y, count) {
    if (reduceMotion) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 6 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: pick(COLORS),
        life: 70 + Math.random() * 40,
        round: Math.random() < 0.3,
      });
    }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }

  function tick() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.vy += 0.25; p.vx *= 0.99;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 1;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (particles.length) requestAnimationFrame(tick);
    else { running = false; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  }

  // ---------- Events ----------
  function renderMute() {
    const b = $('#muteBtn');
    b.textContent = store.muted ? '🔇' : '🔊';
    b.setAttribute('aria-label', store.muted ? 'Turn sound on' : 'Turn sound off');
  }

  $('#ageGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.age-card');
    if (card) { sfx.tap(); startGame(Number(card.dataset.age)); }
  });
  $('#options').addEventListener('click', (e) => {
    const btn = e.target.closest('.option');
    if (btn) choose(Number(btn.dataset.index));
  });
  $('#againBtn').addEventListener('click', () => startGame(state.age));
  $('#ageBtn').addEventListener('click', goHome);
  $('#homeBtn').addEventListener('click', goHome);
  $('#muteBtn').addEventListener('click', () => {
    store.muted = !store.muted;
    saveStore(store);
    renderMute();
    sfx.tap();
  });
  document.addEventListener('keydown', (e) => {
    if (!$('#screen-game').classList.contains('active')) return;
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[1-4]$/.test(e.key)) choose(Number(e.key) - 1);
  });

  renderAgeGrid();
  renderMute();

  // Exposed for quick checks in the browser console.
  window.NumberQuest = { settings, makeQuestion, state };
})();
