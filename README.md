# Brainy Quest 🌟

A colourful browser learning game for children aged **4 to 9**. Pick a subject (**Numbers**, **Letters**,
**Words**, **Sounds**, **Shapes**, **Time** or **Memory**), pick your age, and answer questions that get a little
harder with every level. Every new level earns a sticker for the sticker book.

## Play

No install or build step needed.

- **Quickest:** double-click `index.html` to open it in a browser.
- **Local server:** `npm start`, then open <http://localhost:5173>.

You can use the mouse, touch, or keys **1–4** to pick an answer.

## How the game works

| | |
|---|---|
| ❤️ Lives | 3 lives. A wrong answer costs one, and the right answer is shown with a short explanation. |
| ⭐ Levels | 5 right answers moves you up a level and gives back a lost life. |
| 📒 Sticker book | Each new level (in any subject) earns a sticker: 60 to collect across 6 pages. A full book earns bonus stars. |
| 🔥 Streaks | 3 or more right in a row earns +5 bonus points per answer. |
| 🏆 Best scores | Saved per subject and age in the browser (`localStorage`), with the sticker book. |
| 🔈 Hear it | Reads the word or question aloud using the browser's built-in voice (Irish or British English when available). For ages 4–5 in Letters/Words and up to age 6 in Sounds, questions are read out automatically. |
| 🔊 Sound | The speaker button mutes sound effects and automatic reading. The Hear it button still works. |

Points per right answer: `10 + 5 × (level − 1)`, plus the streak bonus.

## What each age practises

### 🔢 Numbers
| Age | Questions |
|---|---|
| 4 | Counting pictures, bigger/smaller (2 choices); adding within 5 from level 3 |
| 5 | Counting, bigger/smaller to 20, adding with pictures; taking away from level 3 |
| 6 | Bigger/smaller to 50, + and −; < > = from level 3 |
| 7 | Close-together numbers to 100, < > =, + and −; missing numbers from level 3 |
| 8 | 2, 5 and 10 times tables (more each level), + − to 100, missing numbers; division from level 3 |
| 9 | Times tables to 12, division, missing factors, comparing sums and products, numbers to 1000 |

### 🔤 Letters
| Age | Questions |
|---|---|
| 4 | Find the same letter, what letter does the picture start with; capital → small from level 3 |
| 5 | Capital ↔ small (with look-alikes like b/d/p/q), first letters, what comes next |
| 6 | Next/before, vowels, first letters; missing letter and last letters from level 3 |
| 7 | Missing letters, ABC order, vowel or not, last letters |
| 8 | ABC order (close letters), skip patterns (B D F ?), letter positions |
| 9 | Skip-by-2/3 patterns, going backwards, nth letter of the alphabet, counting vowels |

### 📖 Words
| Age | Questions |
|---|---|
| 4 | Match the picture to the word, and the word to the picture |
| 5 | Picture ↔ word, missing first letter (?at); rhymes and missing vowel from level 3 |
| 6 | Picture ↔ word, missing vowels (c?t), first letters, rhymes |
| 7 | Rhymes, spelling (friend, people), opposites, missing vowels |
| 8 | Spelling (because, Wednesday), opposites, plurals (boxes, leaves), ABC order |
| 9 | Spelling (necessary, separate), synonyms, irregular plurals (mice, geese), ABC order by 2nd/3rd letter |

### 👂 Sounds (phonics)
| Age | Questions |
|---|---|
| 4 | Which picture starts with the same sound, rhyming pictures; clapping syllables from level 3 |
| 5 | Same sound, rhyming pictures, syllables; odd one out from level 3 |
| 6 | sh / ch / th, odd one out, rhymes, syllables; blends (fr, st, sn...) from level 3 |
| 7 | Blends, ending sounds (sh, ck, ng), digraphs, syllables, magic e (kit/kite) |
| 8 | Magic e, vowel sounds (rain/play/cake), blends, ending sounds |
| 9 | Silent letters (knife, lamb), homophones (sea/see), vowel sounds, longer syllable words |

### 🔷 Shapes (spatial awareness)
| Age | Questions |
|---|---|
| 4 | Above or below, name the shape, find the shape, AB patterns, which shadow matches |
| 5 | Above/below/next to, what's in between, more shapes (rectangle, oval), patterns; counting blocks from level 3 |
| 6 | Left and right, between, pentagon/hexagon, AABB/ABC patterns, counting stacks, which shape is symmetrical; turning shapes from level 3 |
| 7 | Grid directions (what's to the left of ⭐?), sides and corners, 3D shapes, turning arrows, turn vs mirror, mirror letters, 3D blocks with hidden ones |
| 8 | 2-step grid moves, octagons, cuboid and pyramid, 45° arrow turns, harder puzzle pieces, bigger block towers |
| 9 | Two-part moves (1 up and 2 left), faces/edges/corners of 3D shapes, colour-and-shape patterns, lines of symmetry |

### 🕐 Time
| Age | Questions |
|---|---|
| 4 | O'clock, morning/afternoon/night, which comes first (🥚 or 🐣) |
| 5 | O'clock; half past and days of the week from level 3 |
| 6 | Half past, choose the right clock, days before/after |
| 7 | Quarter past/to, time in words, months |
| 8 | 5-minute times, how long until, months |
| 9 | Any minute (with minute marks), time before/after, 24-hour clock |

Wrong clock answers are the usual mistakes: hour hand one off (half past), past/to mixed up, hands swapped.

### 🧠 Memory
Look at a row of pictures, they hide, then answer: which one is missing, which one did you see, how many of each,
or what came before/after/first/last. More pictures and less time with each age and level. "I'm ready!" skips the wait.

Sounds questions group words by **sound, not spelling**: *cat* and *key* both start with a "k" sound.
Picture choices show the word underneath and are read aloud, so children who can't read yet can still play.
Spellings follow Irish/UK English (e.g. favourite).

## Files

- `index.html`: the screens (start, game, game over)
- `styles.css`: palette, layout, animations, phone layout
- `game.js`: game engine (lives, levels, scoring, read-aloud, sound, confetti)
- `js/core.js`: shared helpers
- `js/numbers.js`, `js/letters.js`, `js/words.js`, `js/phonics.js`, `js/shapes.js`, `js/time.js`, `js/memory.js`:
  question generators and word lists per subject (shapes, clocks and blocks are drawn as SVG)
- `serve.mjs`: tiny zero-dependency static server for `npm start`
