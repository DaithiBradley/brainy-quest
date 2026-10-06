# Brainy Quest 🌟

A colourful browser learning game for children aged **4 to 9**. Pick a subject (**Numbers**, **Letters**,
**Words** or **Sounds**), pick your age, and answer questions that get a little harder with every level.

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
| 🔥 Streaks | 3 or more right in a row earns +5 bonus points per answer. |
| 🏆 Best scores | Saved per subject and age in the browser (`localStorage`). |
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

Sounds questions group words by **sound, not spelling**: *cat* and *key* both start with a "k" sound.
Picture choices show the word underneath and are read aloud, so children who can't read yet can still play.
Spellings follow Irish/UK English (e.g. favourite).

## Files

- `index.html`: the screens (start, game, game over)
- `styles.css`: palette, layout, animations, phone layout
- `game.js`: game engine (lives, levels, scoring, read-aloud, sound, confetti)
- `js/core.js`: shared helpers
- `js/numbers.js`, `js/letters.js`, `js/words.js`, `js/phonics.js`: question generators and word lists per subject
- `serve.mjs`: tiny zero-dependency static server for `npm start`
