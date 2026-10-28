type Point = { x: number; y: number };

type Stroke = {
  points: Point[];
  color: string;
  width: number;
};

const strokes: Stroke[] = [];
let currentStroke: Stroke | null = null;

const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "Sketchpad";

const redrawButton = document.createElement("button");
redrawButton.textContent = "Redraw";
redrawButton.addEventListener("click", redraw);

const clearPixelsButton = document.createElement("button");
clearPixelsButton.textContent = "Clear pixels (test)";

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;

const controls = document.createElement("div");
controls.append(clearPixelsButton, redrawButton);

canvas.style.display = "block";
canvas.style.border = "1px solid #333";
app.append(heading, canvas, controls);

const ctx = canvas.getContext("2d")!;
ctx.lineCap = "round";

function drawStroke(stroke: Stroke) {
  if (stroke.points.length === 0) return;

  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();

  const first = stroke.points[0];
  ctx.moveTo(first.x, first.y);

  for (let i = 1; i < stroke.points.length; i++) {
    const point = stroke.points[i];
    ctx.lineTo(point.x, point.y);
  }

  if (stroke.points.length === 1) {
    ctx.lineTo(first.x, first.y);
  }

  ctx.stroke();
  ctx.restore();
}

//(Step 3 choice made:) explicit update call for redraw
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of strokes) {
    drawStroke(stroke);
  }

  if (currentStroke) {
    drawStroke(currentStroke);
  }
}

clearPixelsButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  currentStroke = {
    points: [{ x: e.offsetX, y: e.offsetY }],
    color: "black",
    width: 3,
  };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});

canvas.addEventListener("pointermove", (e) => {
  if (!currentStroke) return;

  const point = { x: e.offsetX, y: e.offsetY };
  currentStroke.points.push(point);

  redraw();
});

canvas.addEventListener("pointerup", () => {
  if (!currentStroke) return;
  if (currentStroke.points.length > 1) {
    strokes.push(currentStroke);
  }
  currentStroke = null;
  redraw();
});

canvas.addEventListener("pointercancel", () => {
  currentStroke = null;
  redraw();
});
