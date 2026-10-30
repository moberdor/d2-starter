# Sticker Sketchpad

A browser sketchpad with markers, emoji stickers, make-your-own tools, undo/redo, and png exports.

**Play it** https://moberdor.github.io/d2-starter/

## How to use

- **Markers:** use thin or thick marker for size. Press, drag, and release on canvas
- **Stickers:** Click a sticker and click on the canvas to place it
- **Custom tools:** type a tool name to organize the name of what you want, and then type in the sticker itself on the right, then click Create sticker tool. New tool appears on top to the right of the current ones
- **Undo/Redo:** each stroke, sticker, or clear is one step. Undoing goes back a step, redoing goes forward a step
- **Clear:** makes the picture blank, fresh to draw from a blank canvas
- **Export PNG:** downloads sticker-sketchpad.png at 512x512 (2x canvas size). Only shows what is currently on the canvas. Background is transparent as white page isn't part of canvas
- **Redraw:** Use after clear pixels(test) to return temporarily cleared strokes

Mouse input and touch-device supported.

## Run it locally

Needs [Deno](https://deno.com/) and git. The first run downloads Vite, which needs an internet connection. After that the app builds and runs offline, and it makes no network requests while running.

```bash
git clone https://github.com/moberdor/d2-starter
cd d2-starter
deno task setup
deno task dev
deno task build
deno task preview
```

## How it works

All code in `src/main.ts`

- **Document:** drawing.commands is an ordered list of drawing commands
- **Interaction state:** interaction holds the selected tool and the in-progress stroke (currentStroke). A stroke becomes part of the document only on pointerup, via commit. pointercancel and lostpointercapture discard it. Stickers commit immediately on press.
- **Tools:** tools array holds markers and stickers as plain data, and presets and user-created tools share it
- **Rendering:** every command has a draw(target) method. drawCommand wraps it in save()/restore(), and drawDocument replays the commands in order. Rendering is requested by explicit update()/redraw() calls after each state change, only does work when something changes.
- **Export:** exportPng creates a second 512x512 canvas, applies scale(2, 2) and replays same commands as drawDocument. Doesn't copy the visible canvas or touch document, tools, or history

## Dev guide: adding rectangle tool

1. **Tool:** add a RectangleTool type to the Tool union and an entry in tools
2. **Command:** add a Rectangle type with a draw(target) method to DrawingCommand, plus a factory like startStroke
3. **Input:** add a rectangle branch in pointerdown, update it in pointermove, and commit it in pointerup. Clear it in pointercancel and lostpointercapture. Add the in-progress shape to InteractionState, updateHistoryControls, and redraw

**Paths that work unchanged**

- Undo/redo: commit, undo, and redo handle any command and a finished rectangle is committed once
- Display: drawCommand and drawDocument only call command.draw(target), so rectangles keep their stacking order and come back on Redraw
- Export: rectangles export at 2x b/c exportPng replays same commands on a scaled context
- Clear: ClearCommand wipes everything before it

## Credits

Tooling adapted from the [CMPM 121 Fall 2026 D1 starter](https://github.com/ucsc-cmpm-121-f26/d1-starter/tree/d949e744b0f9fb7c133a5316f86f2b7fe54529ad), derived from the [S01 starter](https://github.com/ucsc-cmpm-121-f26/s01-starter/tree/8974888efb6537be82e8eb069db139ea885039da). Those repositories have no explicit repository license; no new license is assigned to that material. The D2 scaffold was authored with OpenCode/OpenAI GPT-6.1 Sol assistance. Dependencies retain their respective licenses.
