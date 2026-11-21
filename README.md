# The Thirteenth Chime

[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)
[![Rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/vinnvv/spot-the-difference-01/rank.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)
[![Reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/vinnvv/spot-the-difference-01/reward.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)

A spot the difference game set in a midnight clockmaker's canal-side workshop. A rogue thirteenth chime has fractured time, leaving two nearly identical realities side by side with **8 temporal glitches** to find and repair.

Entered in [Make the best spot the difference game](https://make.fun/c/best-spot-the-difference-game-20261121-0451) on make.fun.

## How to play

Open `game/index.html` in a desktop browser, or serve the `game/` folder with any static server. The game needs no network and no build step.

- Click a difference on either picture. A coral ring appears on both panels at once, a dashed amber arc links them, and the chime tracker lights a gear.
- The HUD shows how many glitches remain, the timer, and your score. A misclick costs points and shakes the stage.
- The **Hint** button highlights an unfound difference for a few seconds.
- Pick a difficulty on the start screen: Apprentice (untimed, 5 hints), Journeyman (5 minutes, 3 hints), or Master (3 minutes, 1 hint, misclicks cost 25).
- Find all 8 to restore time and earn a horologist rank.

Keyboard: arrow keys move the crosshair, Enter or Space marks a spot, H asks for a hint, R resets.

## The 8 glitches

1. The cuckoo clock pendulum tilts left in one reality, right in the other.
2. A crescent moon hangs over the canal in one, a full moon in the other.
3. A teal apothecary bottle sits on the shelf in one, a brass hourglass in the other.
4. A wrench hangs on the pegboard in one, a magnifying glass in the other.
5. The desk clock reads 10:10 in one, 3:45 in the other.
6. Coral blossoms bloom on the fern in one, and are gone in the other.
7. The sleeping cat's tail curls up in one, and hangs down in the other.
8. A brass key rests beside the teacup in one, and is missing in the other.

## How it is built

- `game/index.html`, the page shell with HUD, stage, tracker, and overlays.
- `game/src/scene.js`, draws both SVG workshop scenes, layer by layer.
- `game/src/differences.js`, the 8 difference definitions with coordinates and names.
- `game/src/game.js`, clicks, keyboard, markers, counter, timer, score, hints, win state.
- `game/src/audio.js`, WebAudio chimes generated in code, no audio files.
- `game/src/main.js`, bootstrap and deterministic screenshot modes (`?shot=play`, `?shot=hint`, `?shot=win`).
- `game/styles.css`, the midnight indigo and lantern amber styling.
- `main.ts`, the Node 22 program that hands the game in to make.fun.
- All art is original vector work drawn in code. All sound is generated in code. System fonts only.

## License

MIT. See [LICENSE](LICENSE).
