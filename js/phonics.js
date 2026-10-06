// Phonics: hearing sounds in words. Starting sounds, rhyming pictures,
// syllables (claps), sh/ch/th, blends, magic e, vowel sounds, silent
// letters and homophones. Groups are by SOUND, not spelling (cat and key
// both start with a /k/ sound).
(() => {
  'use strict';
  const { pick, shuffle, cap, withDistractors, choicesFor, pickType, picture, box, span } = Quest;

  const SOUND_GROUPS = [
    { sound: 'b', words: [['bee', '🐝'], ['bus', '🚌'], ['bear', '🐻'], ['banana', '🍌'], ['bed', '🛏️'], ['boat', '⛵'], ['book', '📖'], ['bird', '🐦'], ['bell', '🔔']] },
    { sound: 'k', words: [['cat', '🐱'], ['cake', '🎂'], ['car', '🚗'], ['cow', '🐮'], ['key', '🔑'], ['carrot', '🥕'], ['castle', '🏰'], ['corn', '🌽']] },
    { sound: 'd', words: [['dog', '🐶'], ['duck', '🦆'], ['door', '🚪'], ['drum', '🥁'], ['dinosaur', '🦕']] },
    { sound: 'f', words: [['fish', '🐟'], ['fox', '🦊'], ['frog', '🐸'], ['flower', '🌸'], ['fire', '🔥']] },
    { sound: 'm', words: [['moon', '🌙'], ['mouse', '🐭'], ['monkey', '🐵'], ['milk', '🥛'], ['map', '🗺️']] },
    { sound: 'p', words: [['pig', '🐷'], ['pizza', '🍕'], ['penguin', '🐧'], ['pencil', '✏️'], ['pear', '🍐']] },
    { sound: 's', words: [['sun', '☀️'], ['snake', '🐍'], ['star', '⭐'], ['sock', '🧦'], ['spider', '🕷️']] },
    { sound: 't', words: [['tree', '🌳'], ['tiger', '🐯'], ['train', '🚆'], ['turtle', '🐢'], ['tent', '⛺']] },
    { sound: 'h', words: [['hat', '🎩'], ['horse', '🐴'], ['house', '🏠'], ['hand', '✋'], ['heart', '❤️']] },
    { sound: 'r', words: [['rabbit', '🐰'], ['robot', '🤖'], ['rocket', '🚀'], ['rainbow', '🌈'], ['ring', '💍']] },
    { sound: 'l', words: [['lion', '🦁'], ['lemon', '🍋'], ['leaf', '🍃'], ['leg', '🦵']] },
    { sound: 'g', words: [['goat', '🐐'], ['grapes', '🍇'], ['gift', '🎁'], ['ghost', '👻']] },
  ];

  const RHYME_PICS = [
    [['cat', '🐱'], ['hat', '🎩'], ['bat', '🦇'], ['rat', '🐀']],
    [['dog', '🐶'], ['frog', '🐸']],
    [['bee', '🐝'], ['tree', '🌳'], ['key', '🔑']],
    [['car', '🚗'], ['star', '⭐']],
    [['cake', '🎂'], ['snake', '🐍']],
    [['sock', '🧦'], ['clock', '🕐']],
    [['boat', '⛵'], ['goat', '🐐'], ['coat', '🧥']],
    [['house', '🏠'], ['mouse', '🐭']],
    [['bear', '🐻'], ['pear', '🍐'], ['chair', '🪑']],
    [['moon', '🌙'], ['spoon', '🥄'], ['balloon', '🎈']],
    [['bell', '🔔'], ['shell', '🐚']],
    [['train', '🚆'], ['rain', '🌧️'], ['plane', '✈️']],
  ];

  // [word, picture, syllables]
  const SYLLABLES = [
    ['cat', '🐱', 1], ['dog', '🐶', 1], ['sun', '☀️', 1], ['fish', '🐟', 1], ['frog', '🐸', 1], ['star', '⭐', 1],
    ['house', '🏠', 1], ['apple', '🍎', 2], ['monkey', '🐵', 2], ['rabbit', '🐰', 2], ['pencil', '✏️', 2],
    ['rainbow', '🌈', 2], ['rocket', '🚀', 2], ['tiger', '🐯', 2], ['zebra', '🦓', 2], ['pizza', '🍕', 2],
    ['robot', '🤖', 2], ['carrot', '🥕', 2], ['banana', '🍌', 3], ['elephant', '🐘', 3], ['butterfly', '🦋', 3],
    ['dinosaur', '🦕', 3], ['octopus', '🐙', 3], ['umbrella', '☂️', 3], ['kangaroo', '🦘', 3], ['tomato', '🍅', 3],
    ['potato', '🥔', 3], ['caterpillar', '🐛', 4], ['watermelon', '🍉', 4], ['helicopter', '🚁', 4],
    ['alligator', '🐊', 4], ['avocado', '🥑', 4], ['hippopotamus', '🦛', 5],
  ];

  // [word, picture, sound]
  const DIGRAPH_START = [
    ['sheep', '🐑', 'sh'], ['shell', '🐚', 'sh'], ['ship', '🚢', 'sh'], ['shoe', '👟', 'sh'], ['shark', '🦈', 'sh'], ['shirt', '👕', 'sh'],
    ['chair', '🪑', 'ch'], ['cheese', '🧀', 'ch'], ['chick', '🐥', 'ch'], ['cherry', '🍒', 'ch'], ['church', '⛪', 'ch'],
    ['thumb', '👍', 'th'], ['thread', '🧵', 'th'], ['three', '3️⃣', 'th'],
  ];
  const DIGRAPH_END = [
    ['fish', '🐟', 'sh'], ['dish', '🍽️', 'sh'], ['duck', '🦆', 'ck'], ['sock', '🧦', 'ck'], ['clock', '🕐', 'ck'],
    ['ring', '💍', 'ng'], ['peach', '🍑', 'ch'], ['watch', '⌚', 'ch'], ['tooth', '🦷', 'th'], ['bath', '🛁', 'th'],
  ];
  const BLENDS = [
    ['frog', '🐸', 'fr'], ['flower', '🌸', 'fl'], ['star', '⭐', 'st'], ['snake', '🐍', 'sn'], ['snail', '🐌', 'sn'],
    ['spider', '🕷️', 'sp'], ['spoon', '🥄', 'sp'], ['tree', '🌳', 'tr'], ['train', '🚆', 'tr'], ['crab', '🦀', 'cr'],
    ['crown', '👑', 'cr'], ['grapes', '🍇', 'gr'], ['plane', '✈️', 'pl'], ['drum', '🥁', 'dr'], ['dragon', '🐉', 'dr'],
    ['clock', '🕐', 'cl'], ['cloud', '☁️', 'cl'], ['bread', '🍞', 'br'], ['broom', '🧹', 'br'], ['swan', '🦢', 'sw'],
    ['globe', '🌍', 'gl'], ['glasses', '👓', 'gl'], ['sled', '🛷', 'sl'], ['smile', '😊', 'sm'],
  ];
  const ALL_BLENDS = [...new Set(BLENDS.map((b) => b[2]))];

  // [picture, right word, wrong word]: does it need a magic e or not?
  const MAGIC_E = [
    ['🪁', 'kite', 'kit'], ['🧊', 'cube', 'cub'], ['🌲', 'pine', 'pin'], ['🎵', 'note', 'not'], ['✈️', 'plane', 'plan'],
    ['🌍', 'globe', 'glob'], ['🧢', 'cap', 'cape'], ['📌', 'pin', 'pine'], ['🥫', 'can', 'cane'], ['🛁', 'tub', 'tube'],
    ['👨', 'man', 'mane'],
  ];

  // Words grouped by their vowel sound (different spellings, same sound).
  const VOWEL_SOUNDS = [
    { name: 'long a', words: ['rain', 'play', 'cake', 'train', 'snail', 'day', 'eight'] },
    { name: 'long e', words: ['tree', 'sea', 'leaf', 'key', 'sheep', 'me'] },
    { name: 'long i', words: ['night', 'kite', 'fly', 'pie', 'light', 'bike', 'my'] },
    { name: 'long o', words: ['boat', 'snow', 'bone', 'toe', 'goat', 'rope', 'go'] },
    { name: 'oo', words: ['moon', 'blue', 'spoon', 'glue', 'food', 'shoe', 'zoo'] },
  ];

  // [word, silent letter, other letters that ARE heard]
  const SILENT = [
    ['knife', 'k', ['n', 'i', 'f']], ['knee', 'k', ['n', 'e']], ['knot', 'k', ['n', 'o', 't']], ['lamb', 'b', ['l', 'a', 'm']],
    ['comb', 'b', ['c', 'o', 'm']], ['wrist', 'w', ['r', 'i', 's', 't']], ['wrong', 'w', ['r', 'o', 'n']],
    ['listen', 't', ['l', 'i', 's', 'n']], ['island', 's', ['i', 'l', 'n', 'd']], ['half', 'l', ['h', 'a', 'f']],
    ['calf', 'l', ['c', 'a', 'f']], ['walk', 'l', ['w', 'a', 'k']], ['hour', 'h', ['o', 'u', 'r']],
    ['honest', 'h', ['o', 'n', 's', 't']], ['ghost', 'h', ['g', 'o', 's', 't']], ['autumn', 'n', ['a', 't', 'm']],
    ['sign', 'g', ['s', 'i', 'n']], ['wrap', 'w', ['r', 'a', 'p']],
  ];

  const HOMOPHONES = [
    ['sea', 'see'], ['night', 'knight'], ['flower', 'flour'], ['son', 'sun'], ['pair', 'pear'], ['blue', 'blew'],
    ['eight', 'ate'], ['hear', 'here'], ['right', 'write'], ['tail', 'tale'], ['road', 'rode'], ['week', 'weak'],
    ['bear', 'bare'], ['hole', 'whole'], ['meet', 'meat'], ['one', 'won'], ['new', 'knew'], ['male', 'mail'],
  ];

  const picOpts = (entries) => entries.map(([w, e]) => ({ value: w, label: e, caption: w }));
  const textOpts = (values) => values.map((v) => ({ value: v, label: v }));
  const listSay = (entries) => entries.map(([w]) => w).join(', or ');
  const bigWord = (w) => `<span class="word-big">${w}</span>`;

  const GEN = {
    sameStart(s) {
      const group = pick(SOUND_GROUPS);
      const [target, answer] = shuffle(group.words);
      const others = shuffle(SOUND_GROUPS.filter((g) => g !== group)).map((g) => pick(g.words));
      const entries = shuffle([answer, ...others.slice(0, s.n - 1)]);
      return {
        instruction: `Which one starts with the same sound as <em>${target[0]}</em>?`,
        visual: picture(target[1], target[0]),
        question: '',
        options: picOpts(entries),
        answer: answer[0],
        explain: `${cap(target[0])} and ${answer[0]} both start with a "${group.sound}" sound.`,
        say: `Which one starts with the same sound as ${target[0]}? ${listSay(entries)}?`,
        optionStyle: 'emoji',
      };
    },
    oddStart(s) {
      const group = pick(SOUND_GROUPS);
      const same = shuffle(group.words).slice(0, s.n - 1);
      const odd = pick(pick(SOUND_GROUPS.filter((g) => g !== group)).words);
      const entries = shuffle([odd, ...same]);
      return {
        instruction: 'Which one starts with a <em>different</em> sound?',
        visual: '',
        question: '',
        options: picOpts(entries),
        answer: odd[0],
        explain: `The others start with a "${group.sound}" sound, but ${odd[0]} doesn't.`,
        say: `Which one starts with a different sound? ${listSay(entries)}?`,
        optionStyle: 'emoji',
      };
    },
    rhymePic(s) {
      const fam = pick(RHYME_PICS);
      const [target, answer] = shuffle(fam);
      const others = shuffle(RHYME_PICS.filter((f) => f !== fam)).map((f) => pick(f));
      const entries = shuffle([answer, ...others.slice(0, s.n - 1)]);
      return {
        instruction: `Which one rhymes with <em>${target[0]}</em>?`,
        visual: picture(target[1], target[0]),
        question: '',
        options: picOpts(entries),
        answer: answer[0],
        explain: `${cap(target[0])} and ${answer[0]} rhyme!`,
        say: `Which one rhymes with ${target[0]}? ${listSay(entries)}?`,
        optionStyle: 'emoji',
      };
    },
    syllables(s) {
      const max = s.age === 4 ? 2 : s.age <= 6 ? 3 : s.age === 9 ? 5 : 4;
      const [word, emoji, count] = pick(SYLLABLES.filter((x) => x[2] <= max));
      const n = Math.min(s.n, max);
      return {
        instruction: 'Clap it out! How many beats in this word?',
        visual: picture(emoji, word),
        question: '',
        options: textOpts(withDistractors(count, span(1, max), n, [count - 1, count + 1].filter((v) => v >= 1 && v <= max))).sort((a, b) => a.value - b.value),
        answer: count,
        explain: `${cap(word)} has ${count} beat${count > 1 ? 's' : ''}.`,
        say: `Clap it out. ${word}. How many beats?`,
        optionStyle: 'number',
      };
    },
    digraphStart(s) {
      const [word, emoji, sound] = pick(DIGRAPH_START);
      const n = Math.min(s.n, 4);
      return {
        instruction: 'Which sound does this start with?',
        visual: picture(emoji, `${box}${word.slice(2)}`),
        question: '',
        options: textOpts(withDistractors(sound, ['sh', 'ch', 'th', 'wh'], n, ['sh', 'ch', 'th'])),
        answer: sound,
        explain: `${cap(word)} starts with "${sound}".`,
        say: word,
        optionStyle: 'letter',
      };
    },
    digraphEnd(s) {
      const [word, emoji, sound] = pick(DIGRAPH_END);
      return {
        instruction: 'Which sound does this end with?',
        visual: picture(emoji, `${word.slice(0, -2)}${box}`),
        question: '',
        options: textOpts(withDistractors(sound, ['sh', 'ck', 'ng', 'ch', 'th'], s.n)),
        answer: sound,
        explain: `${cap(word)} ends with "${sound}".`,
        say: word,
        optionStyle: 'letter',
      };
    },
    blend(s) {
      const [word, emoji, sound] = pick(BLENDS);
      const sameFirst = ALL_BLENDS.filter((b) => b[0] === sound[0] || b[1] === sound[1]);
      return {
        instruction: 'Which two letters start this word?',
        visual: picture(emoji, `${box}${word.slice(2)}`),
        question: '',
        options: textOpts(withDistractors(sound, ALL_BLENDS, s.n, sameFirst)),
        answer: sound,
        explain: `${cap(word)} starts with "${sound}".`,
        say: word,
        optionStyle: 'letter',
      };
    },
    magicE() {
      const [emoji, right, wrong] = pick(MAGIC_E);
      const vowel = right.match(/[aeiou]/)[0];
      const hasE = right.endsWith('e');
      return {
        instruction: 'Magic e! Which word matches the picture?',
        visual: picture(emoji),
        question: '',
        options: textOpts(shuffle([right, wrong])),
        answer: right,
        explain: hasE
          ? `"${right}" has a magic e, so the ${vowel} says its name.`
          : `"${right}" has no magic e, so the ${vowel} makes its short sound.`,
        optionStyle: 'word',
      };
    },
    vowelSound(s) {
      const group = pick(VOWEL_SOUNDS);
      const [target, answer] = shuffle(group.words);
      const others = shuffle(VOWEL_SOUNDS.filter((g) => g !== group)).map((g) => pick(g.words));
      return {
        instruction: 'Which word has the same <em>vowel sound</em>?',
        visual: '',
        question: bigWord(target),
        options: textOpts(withDistractors(answer, others, s.n)),
        answer,
        explain: `${cap(target)} and ${answer} have the same ${group.name} sound.`,
        say: target,
        optionStyle: 'word',
      };
    },
    silent(s) {
      const [word, letter, heard] = pick(SILENT);
      return {
        instruction: 'Which letter is <em>silent</em>?',
        visual: '',
        question: bigWord(word),
        options: textOpts(withDistractors(letter, heard, Math.min(s.n, heard.length + 1))),
        answer: letter,
        explain: `In "${word}" you don't hear the ${letter}.`,
        say: word,
        optionStyle: 'letter',
      };
    },
    homophone(s) {
      const pair = pick(HOMOPHONES);
      const [target, answer] = shuffle(pair);
      const others = HOMOPHONES.filter((p) => p !== pair).map((p) => pick(p));
      return {
        instruction: 'Which word <em>sounds the same</em> but is spelled differently?',
        visual: '',
        question: bigWord(target),
        options: textOpts(withDistractors(answer, others, s.n)),
        answer,
        explain: `"${target}" and "${answer}" sound the same.`,
        say: target,
        optionStyle: 'word',
      };
    },
  };

  function types(age, level) {
    const extra = (cond, list) => (cond ? list : []);
    return {
      4: ['sameStart', 'sameStart', 'rhymePic', 'rhymePic', ...extra(level >= 3, ['syllables'])],
      5: ['sameStart', 'rhymePic', 'rhymePic', 'syllables', ...extra(level >= 3, ['oddStart'])],
      6: ['digraphStart', 'digraphStart', 'rhymePic', 'syllables', 'oddStart', ...extra(level >= 3, ['blend'])],
      7: ['blend', 'blend', 'digraphEnd', 'digraphStart', 'syllables', 'magicE'],
      8: ['magicE', 'vowelSound', 'vowelSound', 'blend', 'digraphEnd', 'syllables'],
      9: ['silent', 'silent', 'homophone', 'homophone', 'vowelSound', 'syllables'],
    }[age];
  }

  Quest.subjects.phonics = {
    make(age, level, previousType) {
      const s = { age, level, n: choicesFor(age, level) };
      const type = pickType(types(age, level), previousType);
      return { type, optionStyle: 'word', ...GEN[type](s) };
    },
  };
})();
