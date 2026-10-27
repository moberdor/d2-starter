type Point = { x: number; y: number };

type Stroke = {
  points: Point[];
  color: string;
  width: number;
};

const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "Sketchpad";

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;

app.append(heading, canvas);

const ctx = canvas.getContext("2d")!;
ctx.lineCap = "round";

const strokes: Stroke[] = [];
let currentStroke: Stroke | null = null;

canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  currentStroke = {
    points: [{ x: e.offsetX, y: e.offsetY }],
    color: "black",
    width: 3,
  };
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (!currentStroke) return;
  const last = currentStroke.points[currentStroke.points.length - 1];
  const point = { x: e.offsetX, y: e.offsetY };
  currentStroke.points.push(point);
  ctx.strokeStyle = currentStroke.color;
  ctx.lineWidth = currentStroke.width;
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
});

canvas.addEventListener("pointerup", () => {
  if (!currentStroke) return;
  if (currentStroke.points.length > 1) {
    strokes.push(currentStroke);
  }
  currentStroke = null;
});

canvas.addEventListener("pointercancel", () => {
  currentStroke = null;
});
