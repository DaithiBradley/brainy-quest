// Shapes & Space: positions (above/below/left/right/between, grid moves),
// naming shapes, sides and corners, 3D shapes, turning and mirroring,
// symmetry, patterns, counting blocks (including hidden ones), shadows.
(() => {
  'use strict';
  const { rand, pick, span, shuffle, cap, withDistractors, nearNumbers, choicesFor, pickType } = Quest;

  const COLORS = ['#1b98e0', '#f15bb5', '#ff8a3d', '#9b5de5', '#06c48f', '#f4b400'];
  // Top / left / right face shades for 3D drawings.
  const SHADES = [
    ['#8fd0f7', '#1b98e0', '#11699c'], ['#f9a8d8', '#f15bb5', '#b8357f'], ['#ffc29a', '#ff8a3d', '#c45f1a'],
    ['#cbb0f3', '#9b5de5', '#6a35ad'], ['#7ce6c4', '#06c48f', '#028a63'],
  ];

  // ---------- Drawing ----------
  const svg = (inner, viewBox = '0 0 100 100') =>
    `<svg class="shape-svg" viewBox="${viewBox}" aria-hidden="true">${inner}</svg>`;
  const pts = (arr) => arr.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const style = (fill) => `fill="${fill}" stroke="rgba(0,0,0,.2)" stroke-width="2.5" stroke-linejoin="round"`;
  function regular(n, r, cy = 50) {
    return Array.from({ length: n }, (_, i) => {
      const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
      return [50 + r * Math.cos(a), cy + r * Math.sin(a)];
    });
  }
  function starPoints() {
    return Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 ? 19 : 45;
      const a = ((-90 + i * 36) * Math.PI) / 180;
      return [50 + r * Math.cos(a), 53 + r * Math.sin(a)];
    });
  }

  const SHAPES = {
    circle: { draw: (f) => `<circle cx="50" cy="50" r="40" ${style(f)}/>` },
    oval: { draw: (f) => `<ellipse cx="50" cy="50" rx="45" ry="27" ${style(f)}/>` },
    square: { sides: 4, draw: (f) => `<rect x="14" y="14" width="72" height="72" rx="2" ${style(f)}/>` },
    rectangle: { sides: 4, draw: (f) => `<rect x="5" y="27" width="90" height="46" rx="2" ${style(f)}/>` },
    triangle: { sides: 3, draw: (f) => `<polygon points="${pts(regular(3, 47, 59))}" ${style(f)}/>` },
    diamond: { sides: 4, draw: (f) => `<polygon points="50,5 83,50 50,95 17,50" ${style(f)}/>` },
    pentagon: { sides: 5, draw: (f) => `<polygon points="${pts(regular(5, 45, 53))}" ${style(f)}/>` },
    hexagon: { sides: 6, draw: (f) => `<polygon points="${pts(regular(6, 45))}" ${style(f)}/>` },
    octagon: { sides: 8, draw: (f) => `<polygon points="${pts(regular(8, 45))}" ${style(f)}/>` },
    star: { draw: (f) => `<polygon points="${pts(starPoints())}" ${style(f)}/>` },
    heart: { draw: (f) => `<path d="M50 88 C14 62 4 38 22 22 C36 10 48 20 50 30 C52 20 64 10 78 22 C96 38 86 62 50 88 Z" ${style(f)}/>` },
  };
  const shapeSvg = (name, fill = pick(COLORS)) => svg(SHAPES[name].draw(fill));
  const SHAPES_BY_AGE = {
    4: ['circle', 'square', 'triangle', 'star', 'heart'],
    5: ['circle', 'square', 'triangle', 'star', 'heart', 'rectangle', 'oval'],
    6: ['circle', 'square', 'triangle', 'rectangle', 'oval', 'diamond', 'pentagon', 'hexagon', 'star', 'heart'],
  };
  const POLYGONS = { 7: ['triangle', 'square', 'rectangle', 'pentagon', 'hexagon'], 8: ['triangle', 'square', 'pentagon', 'hexagon', 'octagon'] };

  // Puzzle pieces with no mirror symmetry and no turning symmetry, so every
  // turned copy looks different from every flipped copy.
  const PIECES = {
    L: [[0, 0], [0, 1], [0, 2], [1, 2]],
    P: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]],
    F: [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]],
    N: [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3]],
    Y: [[1, 0], [0, 1], [1, 1], [1, 2], [1, 3]],
  };
  function pieceSvg(cells, fill, deg = 0, flip = false) {
    const w = Math.max(...cells.map((c) => c[0])) + 1;
    const h = Math.max(...cells.map((c) => c[1])) + 1;
    const size = 78 / Math.max(w, h);
    const ox = 50 - (w * size) / 2;
    const oy = 50 - (h * size) / 2;
    const rects = cells.map(([x, y]) =>
      `<rect x="${ox + x * size}" y="${oy + y * size}" width="${size}" height="${size}" rx="3" fill="${fill}" stroke="#fff" stroke-width="3"/>`).join('');
    return svg(`<g transform="translate(50 50) rotate(${deg}) scale(${flip ? -1 : 1} 1) translate(-50 -50)">${rects}</g>`);
  }

  // Isometric boxes. iso() maps (x, y, z) to the screen.
  const A = 14;
  const iso = (x, y, z) => [(x - y) * A, ((x + y) * A) / 2 - z * A];
  function isoBox(x, y, z, w, d, h, shade) {
    const P = (px, py, pz) => iso(px, py, pz);
    const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    const right = [P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)];
    const left = [P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)];
    const face = (p, fill) => `<polygon points="${pts(p)}" fill="${fill}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>`;
    return { svg: face(top, shade[0]) + face(left, shade[1]) + face(right, shade[2]), points: [...top, ...right, ...left] };
  }
  function isoScene(boxes) {
    const all = boxes.flatMap((b) => b.points);
    const xs = all.map((p) => p[0]);
    const ys = all.map((p) => p[1]);
    const pad = 4;
    const minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
    const w = Math.max(...xs) - minX + pad, h = Math.max(...ys) - minY + pad;
    return svg(boxes.map((b) => b.svg).join(''), `${minX.toFixed(1)} ${minY.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  }
  // heights[i][j] = how many cubes stacked in that spot. Back spots are drawn first.
  function blocks3d(heights, shade) {
    const cells = [];
    heights.forEach((row, i) => row.forEach((hgt, j) => cells.push({ i, j, hgt })));
    cells.sort((p, q) => (p.i + p.j) - (q.i + q.j));
    const boxes = [];
    for (const c of cells) for (let z = 0; z < c.hgt; z++) boxes.push(isoBox(c.i, c.j, z, 1, 1, 1, shade));
    return isoScene(boxes);
  }
  function blocks2d(columns, fill) {
    const s = 20;
    const maxH = Math.max(...columns);
    const rects = columns.flatMap((hgt, c) => span(0, hgt - 1).map((k) =>
      `<rect x="${c * s + 2}" y="${(maxH - 1 - k) * s + 2}" width="${s - 2}" height="${s - 2}" rx="3" fill="${fill}" stroke="rgba(0,0,0,.2)" stroke-width="1.5"/>`));
    return svg(rects.join(''), `0 0 ${columns.length * s + 4} ${maxH * s + 4}`);
  }

  const SOLIDS = {
    cube: { faces: 6, edges: 12, corners: 8, draw: (sh) => isoScene([isoBox(0, 0, 0, 2, 2, 2, sh)]) },
    cuboid: { faces: 6, edges: 12, corners: 8, draw: (sh) => isoScene([isoBox(0, 0, 0, 3, 1.4, 1.6, sh)]) },
    sphere: {
      draw: (sh) => svg(`<defs><radialGradient id="sph${sh[1].slice(1)}" cx="35%" cy="32%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${sh[0]}"/><stop offset="1" stop-color="${sh[2]}"/></radialGradient></defs><circle cx="50" cy="50" r="40" fill="url(#sph${sh[1].slice(1)})"/>`),
    },
    cylinder: {
      draw: (sh) => svg(`<path d="M22 26 V74 A28 9 0 0 0 78 74 V26 Z" fill="${sh[1]}"/><ellipse cx="50" cy="26" rx="28" ry="9" fill="${sh[0]}" stroke="#fff" stroke-width="1.5"/>`),
    },
    cone: {
      draw: (sh) => svg(`<path d="M50 8 L80 76 A30 9 0 0 1 20 76 Z" fill="${sh[1]}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M50 8 L80 76 A30 9 0 0 1 50 85 Z" fill="${sh[2]}" opacity=".55"/>`),
    },
    pyramid: {
      faces: 5, edges: 8, corners: 5,
      draw: (sh) => svg(`<polygon points="50,8 14,70 50,88" fill="${sh[1]}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><polygon points="50,8 50,88 86,70" fill="${sh[2]}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>`),
    },
  };

  // ---------- Small helpers ----------
  const htmlOpts = (entries) => entries.map(([value, html, label]) => ({ value, html, label }));
  const textOpts = (values) => values.map((v) => ({ value: v, label: String(v) }));
  const ANIMALS = ['🐱', '🐶', '🐰', '🐤', '🐸', '🐻', '🦊', '🐼', '🐨', '🐵'];
  const THINGS = ['📦', '🏠', '🌳', '🚗', '🪑'];
  const GRID_ITEMS = ['⭐', '🍎', '🐱', '🌙', '🎈', '🐟', '🌸', '🚗', '🍌', '🐶', '⚽', '🍓', '🦋', '🎁', '🐢', '🍪'];
  const ARROWS4 = ['⬆️', '➡️', '⬇️', '⬅️'];
  const ARROWS8 = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'];
  const PATTERN_SETS = [['🔴', '🔵', '🟢', '🟡'], ['🍎', '🍌', '🍇', '🍓'], ['🐱', '🐶', '🐰', '🐸'], ['⭐', '🌙', '☀️', '☁️'], ['🟥', '🟦', '🟩', '🟨']];
  const SHADOW_ITEMS = ['🐘', '🦒', '🐢', '🦋', '🐟', '🐌', '🦀', '🐇', '🚗', '✈️', '⛵', '🌳', '🍄', '🎸', '🔑', '☂️', '⭐', '🌙', '🐓', '🦕', '🚲', '🏠', '🍐', '🦆'];
  const SYM_LETTERS = ['A', 'H', 'I', 'M', 'O', 'T', 'U', 'V', 'W', 'X', 'Y'];
  const NO_LINE_LETTERS = ['F', 'G', 'J', 'L', 'N', 'P', 'Q', 'R', 'S', 'Z'];
  const ANY_LINE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'H', 'I', 'K', 'M', 'O', 'T', 'U', 'V', 'W', 'X', 'Y'];

  function grid(cells, size) {
    return `<div class="grid-board" style="--n:${size}">${cells.map((c) => `<span>${c || ''}</span>`).join('')}</div>`;
  }

  const GEN = {
    position(s) {
      const words = s.age === 4 ? ['above', 'below'] : s.age === 5 ? ['above', 'below', 'next to'] : ['above', 'below', 'on the left', 'on the right'];
      const answer = pick(words);
      const animal = pick(ANIMALS);
      const thing = pick(THINGS);
      const at = { above: 1, below: 7, 'on the left': 3, 'on the right': 5, 'next to': pick([3, 5]) }[answer];
      const cells = Array(9).fill('');
      cells[4] = thing;
      cells[at] = animal;
      const n = Math.min(s.n, words.length);
      return {
        instruction: `Where is the ${animal}?`,
        visual: grid(cells, 3),
        question: '',
        options: textOpts(withDistractors(answer, words, n)).sort((a, b) => words.indexOf(a.value) - words.indexOf(b.value)),
        answer,
        explain: `The ${animal} is ${answer.startsWith('on the') ? `${answer} of` : answer} the ${thing}.`,
        say: 'Where is the animal?',
        optionStyle: 'word',
      };
    },
    between(s) {
      const len = s.age === 5 ? 3 : rand(4, 5);
      const row = shuffle(ANIMALS).slice(0, len);
      const i = rand(1, len - 2);
      return {
        instruction: `Which one is <em>between</em> the ${row[i - 1]} and the ${row[i + 1]}?`,
        visual: `<div class="row-board">${row.map((a) => `<span>${a}</span>`).join('')}</div>`,
        question: '',
        options: row.length <= s.n ? row.map((v) => ({ value: v, label: v })) : withDistractors(row[i], row, s.n, [row[i - 1], row[i + 1]]).map((v) => ({ value: v, label: v })),
        answer: row[i],
        explain: `The ${row[i]} is between the ${row[i - 1]} and the ${row[i + 1]}.`,
        optionStyle: 'emoji',
      };
    },
    gridMove(s) {
      const size = s.age === 7 ? 3 : 4;
      const items = shuffle(GRID_ITEMS).slice(0, size * size);
      const dirs = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
      let move, from, to;
      for (let guard = 0; guard < 200; guard++) {
        if (s.age === 9 && s.level >= 2) {
          const v = pick(['up', 'down']), hz = pick(['left', 'right']);
          move = [[v, rand(1, 2)], [hz, rand(1, 2)]];
        } else {
          move = [[pick(Object.keys(dirs)), s.age === 7 ? 1 : rand(1, 2)]];
        }
        from = [rand(0, size - 1), rand(0, size - 1)];
        to = move.reduce(([r, c], [d, k]) => [r + dirs[d][0] * k, c + dirs[d][1] * k], from);
        if (to.every((v) => v >= 0 && v < size)) break;
      }
      const at = (r, c) => items[r * size + c];
      const anchor = at(...from);
      const answer = at(...to);
      const neighbours = Object.values(dirs).map(([dr, dc]) => [from[0] + dr, from[1] + dc])
        .filter(([r, c]) => r >= 0 && c >= 0 && r < size && c < size).map(([r, c]) => at(r, c));
      const words = move.map(([d, k]) => `${k} ${d}`).join(' and ');
      return {
        instruction: move.length === 1 && move[0][1] === 1
          ? `What is <em>${{ up: 'above', down: 'below', left: 'to the left of', right: 'to the right of' }[move[0][0]]}</em> the ${anchor}?`
          : `Start at the ${anchor}. Go <em>${words}</em>. What do you find?`,
        visual: grid(items, size),
        question: '',
        options: withDistractors(answer, items.filter((x) => x !== anchor), s.n, neighbours.filter((x) => x !== answer)).map((v) => ({ value: v, label: v })),
        answer,
        explain: `From the ${anchor}, ${words} gets you to the ${answer}.`,
        optionStyle: 'emoji',
      };
    },
    shapeName(s) {
      const pool = SHAPES_BY_AGE[Math.min(s.age, 6)];
      const name = pick(pool);
      return {
        instruction: 'What shape is this?',
        visual: `<div class="shape-big">${shapeSvg(name)}</div>`,
        question: '',
        options: textOpts(withDistractors(name, pool, s.n)),
        answer: name,
        explain: `It's ${Quest.article(name)} ${name}.`,
        say: 'What shape is this?',
        optionStyle: 'word',
      };
    },
    findShape(s) {
      const pool = SHAPES_BY_AGE[Math.min(s.age, 6)];
      const name = pick(pool);
      const tricky = { square: ['rectangle', 'diamond'], rectangle: ['square'], circle: ['oval'], oval: ['circle'], pentagon: ['hexagon'], hexagon: ['pentagon', 'octagon'] }[name] || [];
      const values = withDistractors(name, pool, s.n, tricky.filter((t) => pool.includes(t)));
      return {
        instruction: `Find the <em>${name}</em>!`,
        visual: '',
        question: '',
        options: htmlOpts(values.map((v) => [v, shapeSvg(v), v])),
        answer: name,
        explain: `That's the ${name}.`,
        say: `Find the ${name}.`,
        optionStyle: 'shape',
      };
    },
    sides(s) {
      const pool = POLYGONS[s.age >= 8 ? 8 : 7];
      const name = pick(pool);
      const count = SHAPES[name].sides;
      if (Math.random() < 0.5) {
        const what = pick(['sides', 'corners']);
        return {
          instruction: `How many <em>${what}</em> does this shape have?`,
          visual: `<div class="shape-big">${shapeSvg(name)}</div>`,
          question: '',
          options: textOpts(withDistractors(count, span(3, 8), s.n, [count - 1, count + 1])),
          answer: count,
          explain: `${cap(Quest.article(name))} ${name} has ${count} ${what}.`,
          optionStyle: 'number',
        };
      }
      const others = pool.filter((p) => SHAPES[p].sides !== count);
      const values = withDistractors(name, others, s.n);
      return {
        instruction: `Which shape has <em>${count} sides</em>?`,
        visual: '',
        question: '',
        options: htmlOpts(values.map((v) => [v, shapeSvg(v), v])),
        answer: name,
        explain: `The ${name} has ${count} sides.`,
        optionStyle: 'shape',
      };
    },
    solids(s) {
      const pool = s.age === 7 ? ['cube', 'sphere', 'cylinder', 'cone'] : ['cube', 'cuboid', 'sphere', 'cylinder', 'cone', 'pyramid'];
      const shade = pick(SHADES);
      if (s.age === 9 && Math.random() < 0.6) {
        const name = pick(['cube', 'cuboid', 'pyramid']);
        const what = pick(['faces', 'edges', 'corners']);
        const answer = SOLIDS[name][what];
        return {
          instruction: `How many <em>${what}</em> does a ${name} have?`,
          visual: `<div class="shape-big">${SOLIDS[name].draw(shade)}</div>`,
          question: '',
          options: textOpts(withDistractors(answer, [4, 5, 6, 8, 9, 10, 12], s.n, [answer - 1, answer + 1, answer + 2])),
          answer,
          explain: `A ${name} has ${SOLIDS[name].faces} faces, ${SOLIDS[name].edges} edges and ${SOLIDS[name].corners} corners.`,
          optionStyle: 'number',
        };
      }
      const name = pick(pool);
      return {
        instruction: 'What is this 3D shape called?',
        visual: `<div class="shape-big">${SOLIDS[name].draw(shade)}</div>`,
        question: '',
        options: textOpts(withDistractors(name, pool, s.n)),
        answer: name,
        explain: `It's ${Quest.article(name)} ${name}.`,
        optionStyle: 'word',
      };
    },
    turn(s) {
      const piece = pick(s.age <= 7 ? ['L', 'P'] : Object.keys(PIECES));
      const cells = PIECES[piece];
      const fill = pick(COLORS);
      const right = `r${pick([90, 180, 270])}`;
      const wrongs = shuffle([0, 90, 180, 270]).slice(0, s.n - 1).map((d) => `m${d}`);
      const draw = (key) => pieceSvg(cells, fill, Number(key.slice(1)), key[0] === 'm');
      const values = shuffle([right, ...wrongs]);
      return {
        instruction: 'Which one is the same shape, just <em>turned</em>?',
        visual: `<div class="shape-big">${pieceSvg(cells, fill)}</div>`,
        question: '',
        options: htmlOpts(values.map((v, i) => [v, draw(v), `shape ${i + 1}`])),
        answer: right,
        explain: 'The others are flipped over, like in a mirror. You can\'t make them just by turning.',
        optionStyle: 'shape',
      };
    },
    mirror(s) {
      const piece = pick(s.age <= 7 ? ['L', 'P'] : Object.keys(PIECES));
      const cells = PIECES[piece];
      const fill = pick(COLORS);
      const values = withDistractors('m0', ['r0', 'r180', 'r90', 'r270'], s.n);
      const draw = (key) => pieceSvg(cells, fill, Number(key.slice(1)), key[0] === 'm');
      return {
        instruction: 'Which one is its <em>mirror image</em>?',
        visual: `<div class="mirror-row"><div class="shape-mid">${pieceSvg(cells, fill)}</div><span class="mirror-line" aria-hidden="true"></span><div class="shape-mid ghost">?</div></div>`,
        question: '',
        options: htmlOpts(values.map((v, i) => [v, draw(v), `shape ${i + 1}`])),
        answer: 'm0',
        explain: 'In a mirror, left and right swap over.',
        optionStyle: 'shape',
      };
    },
    symmetry(s) {
      if (s.age === 6) {
        const answer = pick(['heart', 'star', 'triangle', 'circle', 'square', 'diamond']);
        const fill = pick(COLORS);
        const pieces = shuffle(Object.keys(PIECES)).slice(0, s.n - 1);
        const values = shuffle([answer, ...pieces]);
        return {
          instruction: 'Which shape is the <em>same on both sides</em>?',
          visual: '',
          question: '',
          options: htmlOpts(values.map((v, i) => [v, PIECES[v] ? pieceSvg(PIECES[v], fill, pick([0, 90])) : shapeSvg(v, fill), `shape ${i + 1}`])),
          answer,
          explain: `The ${answer} is symmetrical: fold it down the middle and both halves match.`,
          optionStyle: 'shape',
        };
      }
      if (s.age === 9 && Math.random() < 0.5) {
        const answer = pick(NO_LINE_LETTERS);
        return {
          instruction: 'Which letter has <em>no</em> line of symmetry?',
          visual: '',
          question: '',
          options: textOpts(withDistractors(answer, ANY_LINE_LETTERS, s.n)),
          answer,
          explain: `${answer} can't be folded so both halves match.`,
          optionStyle: 'letter',
        };
      }
      const answer = pick(SYM_LETTERS);
      return {
        instruction: 'Which letter looks the <em>same in a mirror</em>?',
        visual: '',
        question: '',
        options: textOpts(withDistractors(answer, NO_LINE_LETTERS, s.n)),
        answer,
        explain: `${answer} is the same on its left and right sides.`,
        optionStyle: 'letter',
      };
    },
    pattern(s) {
      if (s.age === 7 || (s.age === 8 && s.level < 3)) {
        const step = pick([1, -1]);
        const start = rand(0, 3);
        const shown = span(0, 4).map((k) => ARROWS4[(((start + k * step) % 4) + 4) % 4]);
        const answer = ARROWS4[(((start + 5 * step) % 4) + 4) % 4];
        return {
          instruction: 'The arrow is turning. What comes next?',
          visual: '',
          question: `<span class="seq">${shown.join(' ')} ${Quest.box}</span>`,
          options: withDistractors(answer, ARROWS4, s.n).map((v) => ({ value: v, label: v })),
          answer,
          explain: `It turns a quarter each time, so ${answer} is next.`,
          optionStyle: 'emoji',
        };
      }
      if (s.age === 8) {
        const step = pick([1, -1, 3, -3]);
        const start = rand(0, 7);
        const at = (k) => ARROWS8[(((start + k * step) % 8) + 8) % 8];
        const shown = span(0, 3).map(at);
        const answer = at(4);
        return {
          instruction: 'The arrow is turning. What comes next?',
          visual: '',
          question: `<span class="seq">${shown.join(' ')} ${Quest.box}</span>`,
          options: withDistractors(answer, ARROWS8, s.n, [at(3), at(5), ARROWS8[(ARROWS8.indexOf(answer) + 1) % 8]]).map((v) => ({ value: v, label: v })),
          answer,
          explain: `It turns the same amount each time, so ${answer} is next.`,
          optionStyle: 'emoji',
        };
      }
      if (s.age === 9) {
        // Colour and shape change on different beats.
        const colors = shuffle(COLORS).slice(0, pick([2, 3]));
        const shapes = shuffle(['circle', 'square', 'triangle', 'star', 'heart']).slice(0, colors.length === 2 ? 3 : 2);
        const item = (k) => [colors[k % colors.length], shapes[k % shapes.length]];
        const shown = span(0, 4).map(item);
        const [c, sh] = item(5);
        const key = (cc, ss) => `${ss}-${cc}`;
        const answer = key(c, sh);
        const wrongColor = colors.find((x) => x !== c);
        const wrongShape = shapes.find((x) => x !== sh);
        const values = shuffle([answer, key(wrongColor, sh), key(c, wrongShape), key(wrongColor, wrongShape)].slice(0, s.n));
        const mini = ([cc, ss]) => `<span class="mini-shape">${shapeSvg(ss, cc)}</span>`;
        return {
          instruction: 'Watch the colour <em>and</em> the shape. What comes next?',
          visual: '',
          question: `<span class="seq shapes-seq">${shown.map(mini).join('')}${Quest.box}</span>`,
          options: htmlOpts(values.map((v, i) => { const [ss, cc] = v.split('-'); return [v, shapeSvg(ss, cc), `shape ${i + 1}`]; })),
          answer,
          explain: 'The colours and the shapes each repeat on their own beat.',
          optionStyle: 'shape',
        };
      }
      const kinds = { 4: ['AB'], 5: ['AB', 'ABB', 'AAB'], 6: ['ABC', 'AABB', 'ABB'] }[s.age];
      const kind = pick(kinds);
      const set = shuffle(pick(PATTERN_SETS));
      const unit = kind.split('').map((ch) => set[ch.charCodeAt(0) - 65]);
      const len = unit.length * 2 + rand(0, unit.length - 1);
      const shown = span(0, len - 1).map((k) => unit[k % unit.length]);
      const answer = unit[len % unit.length];
      const used = [...new Set(unit)];
      return {
        instruction: 'What comes next in the pattern?',
        visual: '',
        question: `<span class="seq emoji-seq">${shown.join('')}${Quest.box}</span>`,
        options: withDistractors(answer, set, s.n, used).map((v) => ({ value: v, label: v })),
        answer,
        explain: `The pattern goes ${unit.join(' ')}, so ${answer} comes next.`,
        say: 'What comes next in the pattern?',
        optionStyle: 'emoji',
      };
    },
    countBlocks(s) {
      let picture, answer;
      if (s.age <= 6) {
        const cols = s.age === 5 ? rand(2, 3) : rand(3, 4);
        const maxH = s.age === 5 ? (s.level < 3 ? 3 : 4) : 4;
        const columns = span(1, cols).map(() => rand(1, maxH));
        answer = columns.reduce((a, b) => a + b, 0);
        picture = blocks2d(columns, pick(COLORS));
      } else {
        const [rows, cols, maxH] = { 7: [2, 2, 3], 8: [2, 3, 3], 9: [3, 3, s.level >= 3 ? 4 : 3] }[s.age];
        const minH = s.age === 7 ? 1 : 0;
        // Taller at the back, so every stack's top can be seen.
        const h = span(0, rows - 1).map(() => Array(cols).fill(0));
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const limit = Math.min(i > 0 ? h[i - 1][j] : maxH, j > 0 ? h[i][j - 1] : maxH);
            h[i][j] = i === 0 && j === 0 ? rand(2, maxH) : rand(Math.min(minH, limit), limit);
          }
        }
        answer = h.flat().reduce((a, b) => a + b, 0);
        picture = blocks3d(h, pick(SHADES));
      }
      return {
        instruction: s.age <= 6 ? 'How many blocks are there?' : 'How many blocks? Some are hiding underneath!',
        visual: `<div class="blocks">${picture}</div>`,
        question: '',
        options: textOpts(nearNumbers(answer, s.n, s.age <= 6 ? 2 : 3, 1)),
        answer,
        explain: `There are ${answer} blocks.`,
        say: 'How many blocks are there?',
        optionStyle: 'number',
      };
    },
    shadow(s) {
      const item = pick(SHADOW_ITEMS);
      const values = withDistractors(item, SHADOW_ITEMS, s.n);
      const turned = s.age === 6 && s.level >= 3;
      return {
        instruction: 'Which shadow matches?',
        visual: `<div class="pic-card"><span class="big-pic">${item}</span></div>`,
        question: '',
        options: htmlOpts(values.map((v, i) => [v, `<span class="shadow"${turned ? ` style="transform:scaleX(-1)"` : ''}>${v}</span>`, `shadow ${i + 1}`])),
        answer: item,
        explain: 'That shadow has the same outline.',
        say: 'Which shadow matches?',
        optionStyle: 'emoji',
      };
    },
  };

  function types(age, level) {
    const extra = (cond, list) => (cond ? list : []);
    return {
      4: ['position', 'shapeName', 'findShape', 'pattern', 'shadow'],
      5: ['position', 'between', 'shapeName', 'findShape', 'pattern', 'shadow', ...extra(level >= 3, ['countBlocks'])],
      6: ['position', 'between', 'shapeName', 'findShape', 'pattern', 'countBlocks', 'symmetry', 'shadow', ...extra(level >= 3, ['turn'])],
      7: ['gridMove', 'sides', 'solids', 'pattern', 'turn', 'mirror', 'symmetry', 'countBlocks'],
      8: ['gridMove', 'sides', 'solids', 'pattern', 'turn', 'mirror', 'symmetry', 'countBlocks'],
      9: ['gridMove', 'solids', 'pattern', 'turn', 'turn', 'mirror', 'symmetry', 'countBlocks'],
    }[age];
  }

  Quest.subjects.shapes = {
    make(age, level, previousType) {
      const s = { age, level, n: choicesFor(age, level) };
      const type = pickType(types(age, level), previousType);
      return { type, optionStyle: 'word', ...GEN[type](s) };
    },
  };
})();
