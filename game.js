(() => {
  'use strict';
  const { pick, shuffle, esc } = Quest;

  // ---------- Config ----------
  const SUBJECTS = [
    { id: 'numbers', name: 'Numbers', emoji: '🔢', color: 'var(--sea)' },
    { id: 'letters', name: 'Letters', emoji: '🔤', color: 'var(--pink)' },
    { id: 'words', name: 'Words', emoji: '📖', color: 'var(--mint)' },
    { id: 'phonics', name: 'Sounds', emoji: '👂', color: 'var(--grape)' },
  ];
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
  const PRAISE = ['Great job!', 'Super!', 'You got it!', 'Brilliant!', 'Amazing!', 'Fantastic!', 'Well done!', 'Wow!'];
  const STORE_KEY = 'numberQuest.v1';

  const $ = (s) => document.querySelector(s);

  // ---------- Saved data (best scores, sound, last subject) ----------
  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
  }
  function saveStore(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
  }
  const store = Object.assign({ best: {}, muted: false, subject: 'numbers' }, loadStore());
  // Best scores used to be keyed by age only (numbers was the only subject).
  for (const k of Object.keys(store.best)) {
    if (/^\d$/.test(k)) {
      store.best[`numbers:${k}`] = Math.max(store.best[`numbers:${k}`] || 0, store.best[k]);
      delete store.best[k];
    }
  }
  if (!SUBJECTS.some((s) => s.id === store.subject)) store.subject = 'numbers';
  const bestKey = (subject, age) => `${subject}:${age}`;

  // ---------- Sound effects ----------
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

  // ---------- Read aloud (browser speech) ----------
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  function voice() {
    const voices = speechSynthesis.getVoices();
    return voices.find((v) => /en[-_]IE/i.test(v.lang))
      || voices.find((v) => /en[-_]GB/i.test(v.lang))
      || voices.find((v) => /^en/i.test(v.lang));
  }
  function speak(text) {
    if (!canSpeak || !text) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = voice();
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'en-GB';
      u.rate = 0.85;
      u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch { /* speech unavailable */ }
  }
  // Read questions out automatically for children who are still learning to read.
  const autoSpeak = () => !store.muted && state.subject !== 'numbers' && (state.age <= 5 || (state.subject === 'phonics' && state.age <= 6));

  // ---------- State ----------
  const state = {
    subject: store.subject, age: 4, level: 1, score: 0, lives: MAX_LIVES, streak: 0,
    inLevel: 0, correct: 0, q: null, locked: false, timer: null, shownAt: 0,
  };

  // ---------- Screens ----------
  function show(id) {
    document.querySelectorAll('.screen').forEach((el) => el.classList.toggle('active', el.id === `screen-${id}`));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderSubjects() {
    $('#subjectTabs').innerHTML = SUBJECTS.map((s) => `
      <button class="subject-tab" type="button" data-subject="${s.id}" style="--c:${s.color}"
        aria-pressed="${s.id === state.subject}">
        <span class="subject-emoji" aria-hidden="true">${s.emoji}</span> ${s.name}
      </button>`).join('');
  }

  function renderAgeGrid() {
    $('#ageGrid').innerHTML = AGES.map((a) => {
      const best = store.best[bestKey(state.subject, a.age)] || 0;
      return `
      <button class="age-card" type="button" data-age="${a.age}" style="--c:${a.color}"
        aria-label="Age ${a.age}, ${a.name}. Best score ${best}">
        <span class="emoji" aria-hidden="true">${a.emoji}</span>
        <span class="age">Age ${a.age}</span>
        <span class="name">${a.name}</span>
        <span class="best">Best: ${best}</span>
      </button>`;
    }).join('');
  }

  // ---------- Game flow ----------
  function startGame(age) {
    clearTimeout(state.timer);
    Object.assign(state, { age, level: 1, score: 0, lives: MAX_LIVES, streak: 0, inLevel: 0, correct: 0, q: null, locked: false });
    $('#mascot').textContent = AGES.find((a) => a.age === age).emoji;
    $('#subjectIcon').textContent = SUBJECTS.find((s) => s.id === state.subject).emoji;
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
    const q = Quest.subjects[state.subject].make(state.age, state.level, state.q && state.q.type);
    state.q = q;
    state.locked = false;
    state.shownAt = performance.now();

    setBubble(state.streak >= 3 ? "You're on fire!" : pick(['You can do it!', 'Have a think...', "Let's go!", 'Take your time.']));
    $('#instruction').innerHTML = q.instruction;
    $('#visual').innerHTML = q.visual;
    $('#question').innerHTML = q.question;
    $('#sayBtn').hidden = !(canSpeak && q.say);

    const opts = $('#options');
    opts.classList.remove('done');
    opts.style.setProperty('--cols', q.options.length === 3 ? 3 : 2);
    const colors = shuffle(OPTION_COLORS);
    opts.innerHTML = q.options.map((o, i) => `
      <button class="option ${q.optionStyle || ''}" type="button" data-index="${i}" style="--c:${colors[i % colors.length]}"
        aria-label="${esc(o.caption ? `${o.label}, ${o.caption}` : o.label)}">
        <span class="key" aria-hidden="true">${i + 1}</span>
        <span class="label">${esc(o.label)}</span>
        ${o.caption ? `<span class="caption">${esc(o.caption)}</span>` : ''}
        ${o.dots ? `<span class="dots" aria-hidden="true">${'<i></i>'.repeat(o.dots)}</span>` : ''}
      </button>`).join('');
    renderHud();
    if (canSpeak) speechSynthesis.cancel();
    if (q.say && autoSpeak()) setTimeout(() => { if (state.q === q) speak(q.say); }, 250);
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
      if (autoSpeak()) speak(q.explain);
      renderHud(state.lives);
      state.timer = setTimeout(state.lives <= 0 ? gameOver : nextQuestion, 2600);
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
    const key = bestKey(state.subject, state.age);
    const prevBest = store.best[key] || 0;
    const isBest = state.score > prevBest;
    if (isBest) { store.best[key] = state.score; saveStore(store); }
    const stars = state.level >= 5 ? 3 : state.level >= 3 ? 2 : state.correct > 0 ? 1 : 0;
    const subject = SUBJECTS.find((s) => s.id === state.subject);
    $('#overMascot').textContent = AGES.find((a) => a.age === state.age).emoji;
    $('#overTitle').textContent = ['Good try!', 'Nice work!', 'Great playing!', 'Superstar!'][stars];
    $('#overSub').textContent = `${subject.emoji} ${subject.name} · Age ${state.age}`;
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
    if (canSpeak) speechSynthesis.cancel();
    $('#banner').hidden = true;
    state.q = null;
    renderSubjects();
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

  $('#subjectTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.subject-tab');
    if (!tab) return;
    state.subject = store.subject = tab.dataset.subject;
    saveStore(store);
    sfx.tap();
    renderSubjects();
    renderAgeGrid();
  });
  $('#ageGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.age-card');
    if (card) { sfx.tap(); startGame(Number(card.dataset.age)); }
  });
  $('#options').addEventListener('click', (e) => {
    const btn = e.target.closest('.option');
    if (btn) choose(Number(btn.dataset.index));
  });
  // The Hear it button always speaks, even when sound effects are muted.
  $('#sayBtn').addEventListener('click', () => state.q && speak(state.q.say));
  $('#againBtn').addEventListener('click', () => startGame(state.age));
  $('#ageBtn').addEventListener('click', goHome);
  $('#homeBtn').addEventListener('click', goHome);
  $('#muteBtn').addEventListener('click', () => {
    store.muted = !store.muted;
    saveStore(store);
    if (store.muted && canSpeak) speechSynthesis.cancel();
    renderMute();
    sfx.tap();
  });
  document.addEventListener('keydown', (e) => {
    if (!$('#screen-game').classList.contains('active')) return;
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[1-4]$/.test(e.key)) choose(Number(e.key) - 1);
  });

  renderSubjects();
  renderAgeGrid();
  renderMute();

  // Exposed for quick checks in the browser console.
  Quest.debug = { state };
})();
