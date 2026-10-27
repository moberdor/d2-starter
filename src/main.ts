const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "Sketchpad";

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;

app.append(heading, canvas);

const ctx = canvas.getContext("2d")!;
ctx.lineWidth = 3;
ctx.lineCap = "round";

let drawing = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  drawing = true;
  lastX = e.offsetX;
  lastY = e.offsetY;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  lastX = e.offsetX;
  lastY = e.offsetY;
});

canvas.addEventListener("pointerup", () => {
  drawing = false;
});

canvas.addEventListener("pointercancel", () => {
  drawing = false;
});
