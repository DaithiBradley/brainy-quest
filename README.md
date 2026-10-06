# Number Quest 🔢

A colourful browser number game for children aged **4 to 9**. Children pick their age, then answer
questions that get a little harder with every level: bigger and smaller, counting, adding, taking away,
comparing with < > =, missing numbers, times tables and sharing (division).

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
| 🏆 Best scores | Saved per age in the browser (`localStorage`). |
| 🔊 Sound | Simple Web Audio sound effects; the speaker button mutes them. |

Points per right answer: `10 + 5 × (level − 1)`, plus the streak bonus.

## What each age practises

| Age | Character | Questions | Number range (level 1 → level 6+) |
|---|---|---|---|
| 4 | 🐣 Little Chick | Counting pictures, bigger/smaller (2 choices); adding within 5 from level 3 | up to 5 → 10 |
| 5 | 🐝 Busy Bee | Counting, bigger/smaller, adding with pictures; taking away from level 3 | up to 9 → 20 |
| 6 | 🦊 Clever Fox | Bigger/smaller, adding and taking away; < > = from level 3 | up to 23 → 50 |
| 7 | 🐢 Brave Turtle | Close-together numbers, < > =, + and −; missing numbers from level 3 | up to 45 → 100 |
| 8 | 🐬 Swift Dolphin | 2, 5 and 10 times tables (more tables each level), + − to 100, missing numbers; division from level 3 | up to 225 → 500 |
| 9 | 🦉 Wise Owl | Times tables to 12, division, missing factors, comparing sums and products | up to 450 → 1000 |

For ages 4 and 5, picture groups (🍎🍎 + 🍎) and dots under each number help children who are still learning
to read numerals.

## Files

- `index.html`: the screens (start, game, game over)
- `styles.css`: palette, layout, animations, phone layout
- `game.js`: question generators, difficulty curve, scoring, sound, confetti
- `serve.mjs`: tiny zero-dependency static server for `npm start`
