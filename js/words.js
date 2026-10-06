// Words: match picture and word, missing letters, rhymes, spelling,
// opposites, synonyms, plurals, ABC order.
(() => {
  'use strict';
  const { pick, shuffle, cap, article, withDistractors, choicesFor, pickType, picture, box } = Quest;

  // Picture words, grouped by length. Pictures are chosen so there is one obvious name.
  const W3 = [
    ['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['bus', '🚌'], ['pig', '🐷'], ['fox', '🦊'], ['bed', '🛏️'],
    ['bee', '🐝'], ['egg', '🥚'], ['car', '🚗'], ['owl', '🦉'], ['ant', '🐜'], ['bat', '🦇'], ['cow', '🐮'],
    ['box', '📦'], ['key', '🔑'], ['hat', '🎩'], ['web', '🕸️'], ['map', '🗺️'], ['leg', '🦵'], ['ear', '👂'],
  ];
  const W4 = [
    ['fish', '🐟'], ['frog', '🐸'], ['duck', '🦆'], ['bear', '🐻'], ['star', '⭐'], ['moon', '🌙'], ['cake', '🎂'],
    ['tree', '🌳'], ['ship', '🚢'], ['bird', '🐦'], ['milk', '🥛'], ['lion', '🦁'], ['boat', '⛵'], ['book', '📖'],
    ['door', '🚪'], ['hand', '✋'], ['sock', '🧦'], ['corn', '🌽'], ['drum', '🥁'], ['ring', '💍'], ['bell', '🔔'],
    ['crab', '🦀'], ['goat', '🐐'],
  ];
  const W5 = [
    ['apple', '🍎'], ['horse', '🐴'], ['mouse', '🐭'], ['snake', '🐍'], ['house', '🏠'], ['train', '🚆'],
    ['clock', '🕐'], ['bread', '🍞'], ['chair', '🪑'], ['sheep', '🐑'], ['tiger', '🐯'], ['zebra', '🦓'],
    ['whale', '🐳'], ['pizza', '🍕'], ['robot', '🤖'], ['crown', '👑'], ['snail', '🐌'],
  ];
  const W6 = [
    ['carrot', '🥕'], ['banana', '🍌'], ['rabbit', '🐰'], ['monkey', '🐵'], ['rocket', '🚀'], ['turtle', '🐢'],
    ['flower', '🌸'], ['pencil', '✏️'], ['spider', '🕷️'], ['castle', '🏰'], ['rainbow', '🌈'], ['penguin', '🐧'],
    ['octopus', '🐙'], ['elephant', '🐘'], ['giraffe', '🦒'], ['umbrella', '☂️'], ['butterfly', '🦋'],
  ];
  const ALL_PICS = [...W3, ...W4, ...W5, ...W6];

  const RHYMES = [
    { end: 'at', words: ['cat', 'hat', 'bat', 'mat', 'rat', 'sat'] },
    { end: 'og', words: ['dog', 'log', 'frog', 'fog', 'jog'] },
    { end: 'un', words: ['sun', 'fun', 'run', 'bun'] },
    { end: 'ig', words: ['pig', 'big', 'dig', 'wig'] },
    { end: 'en', words: ['hen', 'pen', 'ten', 'men'] },
    { end: 'ed', words: ['bed', 'red', 'fed', 'shed'] },
    { end: 'op', words: ['hop', 'mop', 'top', 'shop', 'stop'] },
    { end: 'ake', words: ['cake', 'lake', 'make', 'snake', 'bake'] },
    { end: 'ing', words: ['ring', 'king', 'sing', 'wing', 'swing'] },
    { end: 'ee', words: ['bee', 'tree', 'see', 'three', 'free'] },
    { end: 'ar', words: ['car', 'star', 'far', 'jar'] },
    { end: 'ell', words: ['bell', 'shell', 'well', 'tell'] },
    { end: 'ock', words: ['sock', 'rock', 'clock', 'lock'] },
    { end: 'ail', words: ['snail', 'tail', 'mail', 'sail'] },
  ];

  const OPPOSITES = [
    ['big', 'small'], ['hot', 'cold'], ['up', 'down'], ['happy', 'sad'], ['fast', 'slow'], ['day', 'night'],
    ['open', 'shut'], ['wet', 'dry'], ['full', 'empty'], ['old', 'new'], ['tall', 'short'], ['in', 'out'],
    ['yes', 'no'], ['light', 'dark'], ['loud', 'quiet'], ['hard', 'soft'], ['top', 'bottom'], ['near', 'far'],
    ['first', 'last'], ['early', 'late'], ['push', 'pull'], ['win', 'lose'], ['clean', 'dirty'], ['thick', 'thin'],
    ['always', 'never'], ['awake', 'asleep'], ['before', 'after'], ['over', 'under'],
  ];
  const SYNONYMS = [
    ['big', 'large'], ['small', 'tiny'], ['happy', 'glad'], ['sad', 'unhappy'], ['fast', 'quick'], ['begin', 'start'],
    ['shout', 'yell'], ['shut', 'close'], ['clever', 'smart'], ['scared', 'afraid'], ['angry', 'cross'],
    ['stone', 'rock'], ['gift', 'present'], ['end', 'finish'], ['jump', 'leap'], ['tired', 'sleepy'],
    ['easy', 'simple'], ['below', 'under'],
  ];

  // [correct, ...common misspellings]. Irish/UK spellings.
  const SPELL = {
    7: [
      ['friend', 'freind', 'frend', 'friand'], ['house', 'hous', 'howse', 'huose'], ['school', 'skool', 'schol', 'shcool'],
      ['they', 'thay', 'tey', 'thye'], ['was', 'wos', 'waz', 'wsa'], ['come', 'cume', 'comm', 'kome'],
      ['people', 'peeple', 'poeple', 'peple'], ['water', 'warter', 'watter', 'woter'], ['pretty', 'prety', 'pritty', 'pretey'],
      ['little', 'littel', 'litle', 'lettle'], ['night', 'nigth', 'nihgt', 'niht'], ['again', 'agen', 'agian', 'agin'],
      ['many', 'meny', 'mani', 'manny'], ['said', 'sed', 'siad', 'sayd'],
    ],
    8: [
      ['because', 'becos', 'becuase', 'becouse'], ['different', 'diffrent', 'diferent', 'differant'],
      ['beautiful', 'beutiful', 'beautifull', 'butiful'], ['favourite', 'favrite', 'favourit', 'faverite'],
      ['surprise', 'suprise', 'surprize', 'serprise'], ['Wednesday', 'Wensday', 'Wednsday', 'Wedensday'],
      ['library', 'libary', 'liberry', 'librery'], ['answer', 'anser', 'answar', 'arnswer'],
      ['enough', 'enuff', 'enouf', 'enogh'], ['island', 'iland', 'islend', 'ilsand'], ['busy', 'bizzy', 'busey', 'bizy'],
    ],
    9: [
      ['necessary', 'neccessary', 'necesary', 'nessesary'], ['separate', 'seperate', 'separet', 'seprate'],
      ['definitely', 'definately', 'definitly', 'defenitely'], ['rhythm', 'rythm', 'rhythem', 'rythym'],
      ['occasion', 'ocassion', 'occassion', 'ocasion'], ['knowledge', 'knowlege', 'nowledge', 'knowlegde'],
      ['restaurant', 'resturant', 'restaraunt', 'restarant'], ['environment', 'enviroment', 'envirnoment', 'environmant'],
      ['government', 'goverment', 'govermant', 'guvernment'], ['calendar', 'calandar', 'calendor', 'callendar'],
      ['embarrass', 'embarass', 'embarras', 'embaress'], ['disappear', 'dissapear', 'disapear', 'dissappear'],
      ['beginning', 'begining', 'beggining', 'beginnig'], ['tomorrow', 'tommorow', 'tomorow', 'tommorrow'],
    ],
  };

  const PLURALS = {
    8: [
      ['box', 'boxes', '📦', ['boxs', 'boxies', 'boxen']], ['bus', 'buses', '🚌', ['buss', 'busies', 'busen']],
      ['fox', 'foxes', '🦊', ['foxs', 'foxies', 'foxen']], ['dish', 'dishes', '🍽️', ['dishs', 'dishies', 'dishen']],
      ['baby', 'babies', '👶', ['babys', 'babyes', 'babis']], ['party', 'parties', '🎉', ['partys', 'partyes', 'partis']],
      ['leaf', 'leaves', '🍃', ['leafs', 'leafes', 'leavs']], ['wolf', 'wolves', '🐺', ['wolfs', 'wolfes', 'wolvs']],
      ['church', 'churches', '⛪', ['churchs', 'churchies', 'churchen']], ['key', 'keys', '🔑', ['kies', 'keyes', 'keies']],
      ['toy', 'toys', '🧸', ['toies', 'toyes', 'tois']], ['potato', 'potatoes', '🥔', ['potatos', 'potatoe', 'potatoies']],
    ],
    9: [
      ['mouse', 'mice', '🐭', ['mouses', 'mices', 'mousen']], ['child', 'children', '🧒', ['childs', 'childrens', 'childen']],
      ['foot', 'feet', '🦶', ['foots', 'feets', 'footen']], ['tooth', 'teeth', '🦷', ['tooths', 'teeths', 'toothes']],
      ['man', 'men', '👨', ['mans', 'mens', 'menn']], ['woman', 'women', '👩', ['womans', 'womens', 'womanes']],
      ['sheep', 'sheep', '🐑', ['sheeps', 'sheepes', 'shoop']], ['ox', 'oxen', '🐂', ['oxes', 'oxs', 'oxies']],
      ['deer', 'deer', '🦌', ['deers', 'deeres', 'deeren']], ['goose', 'geese', '🦢', ['gooses', 'geeses', 'goosen']],
    ],
  };

  // Words that share a start, for harder ABC-order questions.
  const ALPHA_GROUPS = [
    ['cake', 'camel', 'candle', 'carrot', 'castle'], ['bread', 'brick', 'bridge', 'brown', 'brush'],
    ['plant', 'plate', 'play', 'please', 'plum'], ['star', 'stone', 'stop', 'story', 'storm'],
    ['sheep', 'shell', 'ship', 'shoe', 'shop'], ['train', 'tree', 'trick', 'truck', 'trumpet'],
    ['monkey', 'moon', 'more', 'morning', 'mouse'],
  ];

  const VOWELS = ['a', 'e', 'i', 'o', 'u'];
  const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const bigWord = (w) => `<span class="word-big">${w}</span>`;
  const wordOpts = (values) => values.map((v) => ({ value: v, label: v }));
  const spellOut = (w, i) => `<span class="word-big">${w.slice(0, i)}${box}${w.slice(i + 1)}</span>`;

  function picPool(age, level) {
    if (age === 4) return W3;
    if (age === 5) return level < 3 ? W3 : [...W3, ...W4];
    if (age === 6) return level < 3 ? W4 : [...W4, ...W5];
    return [...W4, ...W5, ...W6];
  }

  const GEN = {
    picToWord(s) {
      const [word, emoji] = pick(picPool(s.age, s.level));
      // Wrong answers of the same length (or close to it) so length isn't a giveaway.
      const sameLen = ALL_PICS.filter(([w]) => Math.abs(w.length - word.length) <= (word.length > 6 ? 2 : 0)).map(([w]) => w);
      const sameStart = sameLen.filter((w) => w[0] === word[0]);
      return {
        instruction: 'Which word matches the picture?',
        visual: picture(emoji),
        question: '',
        options: wordOpts(withDistractors(word, sameLen, s.n, s.level >= 3 ? sameStart : [])),
        answer: word,
        explain: `That's ${article(word)} ${word}.`,
      };
    },
    wordToPic(s) {
      const pool = picPool(s.age, s.level);
      const [word] = pick(pool);
      const values = withDistractors(word, pool.map(([w]) => w), s.n);
      const emojiOf = Object.fromEntries(ALL_PICS);
      return {
        instruction: 'Which picture matches the word?',
        visual: '',
        question: bigWord(word),
        options: values.map((v) => ({ value: v, label: emojiOf[v] })),
        answer: word,
        explain: `${cap(word)} ${emojiOf[word]}`,
        optionStyle: 'emoji',
      };
    },
    firstMissing(s) {
      const [word, emoji] = pick(s.age <= 5 ? W3 : [...W3, ...W4]);
      return {
        instruction: 'Which letter is missing?',
        visual: picture(emoji),
        question: spellOut(word, 0),
        options: wordOpts(withDistractors(word[0], LETTERS, s.n)),
        answer: word[0],
        explain: `${cap(word)} starts with ${word[0]}.`,
        say: word,
        optionStyle: 'letter',
      };
    },
    missingVowel(s) {
      const pool = s.age <= 5 ? W3 : s.age === 6 ? (s.level < 3 ? W3 : [...W3, ...W4]) : [...W4, ...W5];
      const [word, emoji] = pick(pool);
      const spots = word.split('').map((c, i) => (VOWELS.includes(c) ? i : -1)).filter((i) => i >= 0);
      const at = pick(spots);
      return {
        instruction: 'Which vowel is missing?',
        visual: picture(emoji),
        question: spellOut(word, at),
        options: wordOpts(withDistractors(word[at], VOWELS, s.n)),
        answer: word[at],
        explain: `The missing vowel is ${word[at]}: ${word}.`,
        say: word,
        optionStyle: 'letter',
      };
    },
    rhyme(s) {
      const fam = pick(RHYMES);
      const [target, answer] = shuffle(fam.words);
      const others = RHYMES.filter((f) => f !== fam).map((f) => pick(f.words));
      return {
        instruction: 'Which word rhymes with this one?',
        visual: '',
        question: bigWord(target),
        options: wordOpts(withDistractors(answer, others, s.n)),
        answer,
        explain: `${cap(target)} and ${answer} rhyme. They both end in "${fam.end}".`,
        say: target,
      };
    },
    spelling(s) {
      const lists = s.age === 7 ? SPELL[7] : s.level < 3 ? SPELL[s.age - 1] : SPELL[s.age];
      const [right, ...wrong] = pick(lists);
      return {
        instruction: 'Which word is spelled correctly?',
        visual: '',
        question: '',
        options: wordOpts(shuffle([right, ...shuffle(wrong).slice(0, s.n - 1)])),
        answer: right,
        explain: `It's spelled "${right}".`,
        say: right,
      };
    },
    opposite(s) {
      const pair = pick(OPPOSITES);
      const [target, answer] = shuffle(pair);
      const others = OPPOSITES.filter((p) => p !== pair).map((p) => pick(p));
      return {
        instruction: 'What is the <em>opposite</em>?',
        visual: '',
        question: bigWord(target),
        options: wordOpts(withDistractors(answer, others, s.n)),
        answer,
        explain: `The opposite of ${target} is ${answer}.`,
        say: target,
      };
    },
    synonym(s) {
      const pair = pick(SYNONYMS);
      const [target, answer] = shuffle(pair);
      const others = SYNONYMS.filter((p) => p !== pair).map((p) => pick(p));
      return {
        instruction: 'Which word means the <em>same</em>?',
        visual: '',
        question: bigWord(target),
        options: wordOpts(withDistractors(answer, others, s.n)),
        answer,
        explain: `${cap(target)} and ${answer} mean the same thing.`,
        say: target,
      };
    },
    plural(s) {
      const list = s.age === 8 || s.level < 3 ? PLURALS[8] : [...PLURALS[9], ...PLURALS[9], ...PLURALS[8]];
      const [one, many, emoji, wrong] = pick(list);
      return {
        instruction: `One ${one}, two...?`,
        visual: `<div class="group"><span class="item">${emoji}</span></div><span class="op">→</span><div class="group"><span class="item">${emoji}</span><span class="item">${emoji}</span></div>`,
        question: '',
        options: wordOpts(shuffle([many, ...shuffle(wrong).slice(0, s.n - 1)])),
        answer: many,
        explain: `One ${one}, two ${many}.`,
      };
    },
    alphaWord(s) {
      let words;
      if (s.age === 9 && s.level >= 2) {
        words = shuffle(pick(ALPHA_GROUPS)).slice(0, s.n);
      } else {
        const byLetter = new Map();
        for (const [w] of shuffle([...W4, ...W5, ...W6])) if (!byLetter.has(w[0])) byLetter.set(w[0], w);
        words = [...byLetter.values()].slice(0, s.n);
      }
      const first = Math.random() < 0.6;
      const sorted = [...words].sort();
      const answer = first ? sorted[0] : sorted[sorted.length - 1];
      return {
        instruction: `Which word comes <em>${first ? 'first' : 'last'}</em> in ABC order?`,
        visual: '',
        question: '',
        options: wordOpts(words),
        answer,
        explain: `In ABC order: ${sorted.join(', ')}.`,
      };
    },
  };

  function types(age, level) {
    const extra = (cond, list) => (cond ? list : []);
    return {
      4: ['picToWord', 'picToWord', 'wordToPic', 'wordToPic', ...extra(level >= 3, ['firstMissing'])],
      5: ['picToWord', 'wordToPic', 'firstMissing', 'firstMissing', ...extra(level >= 3, ['rhyme', 'missingVowel'])],
      6: ['picToWord', 'wordToPic', 'missingVowel', 'missingVowel', 'firstMissing', 'rhyme'],
      7: ['rhyme', 'spelling', 'spelling', 'opposite', 'missingVowel', 'picToWord'],
      8: ['spelling', 'spelling', 'opposite', 'plural', 'alphaWord'],
      9: ['spelling', 'spelling', 'synonym', 'plural', 'alphaWord', 'opposite'],
    }[age];
  }

  Quest.subjects.words = {
    make(age, level, previousType) {
      const s = { age, level, n: choicesFor(age, level) };
      const type = pickType(types(age, level), previousType);
      return { type, optionStyle: 'word', ...GEN[type](s) };
    },
  };
})();
