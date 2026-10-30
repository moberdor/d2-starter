type Point = { x: number; y: number };

type Stroke = {
  kind: "stroke";
  points: Point[];
  color: string;
  width: number;
  draw(target: CanvasRenderingContext2D): void;
};

type Sticker = {
  kind: "sticker";
  x: number;
  y: number;
  text: string;
  size: number;
  draw(target: CanvasRenderingContext2D): void;
};

type ClearCommand = {
  kind: "clear";
  draw(target: CanvasRenderingContext2D): void;
};

type DrawingCommand = Stroke | Sticker | ClearCommand;

type MarkerTool = {
  kind: "marker";
  id: string;
  label: string;
  color: string;
  width: number;
};

type StickerTool = {
  kind: "sticker";
  id: string;
  label: string;
  text: string;
  size: number;
};

type Tool = MarkerTool | StickerTool;

type DrawingDocument = {
  commands: DrawingCommand[];
  redoCommands: DrawingCommand[];
};

type InteractionState = {
  selectedTool: Tool;
  currentStroke: Stroke | null;
};

const DEFAULT_STICKER_SIZE = 38;

const tools: Tool[] = [
  {
    kind: "marker",
    id: "thin-marker",
    label: "Thin marker",
    color: "#222222",
    width: 3,
  },
  {
    kind: "marker",
    id: "thick-marker",
    label: "Thick marker",
    color: "#222222",
    width: 8,
  },
  {
    kind: "sticker",
    id: "skull",
    label: "💀 Skull",
    text: "💀",
    size: DEFAULT_STICKER_SIZE,
  },
  {
    kind: "sticker",
    id: "heart",
    label: "❤️ Heart",
    text: "❤️",
    size: DEFAULT_STICKER_SIZE,
  },
  {
    kind: "sticker",
    id: "shark",
    label: "🦈 Shark",
    text: "🦈",
    size: DEFAULT_STICKER_SIZE,
  },
  {
    kind: "sticker",
    id: "star",
    label: "⭐ Star",
    text: "⭐",
    size: DEFAULT_STICKER_SIZE,
  },
];

const drawing: DrawingDocument = {
  commands: [],
  redoCommands: [],
};

const interaction: InteractionState = {
  selectedTool: tools[0],
  currentStroke: null,
};

const toolButtons = new Map<string, HTMLButtonElement>();
let nextCustomToolId = 1;

function getPoint(event: PointerEvent): Point {
  return { x: event.offsetX, y: event.offsetY };
}

function makeSticker(tool: StickerTool, at: Point): Sticker {
  return {
    kind: "sticker",
    x: at.x,
    y: at.y,
    text: tool.text,
    size: tool.size,
    draw(target) {
      drawSticker(this, target);
    },
  };
}

function startStroke(tool: MarkerTool, at: Point): Stroke {
  return {
    kind: "stroke",
    points: [at],
    color: tool.color,
    width: tool.width,
    draw(target) {
      drawStroke(this, target);
    },
  };
}

function makeClear(): ClearCommand {
  return {
    kind: "clear",
    draw(target) {
      target.setTransform(1, 0, 0, 1, 0, 0);
      target.clearRect(0, 0, target.canvas.width, target.canvas.height);
    },
  };
}

function commit(command: DrawingCommand) {
  drawing.commands.push(command);
  drawing.redoCommands.length = 0;
}

function undo() {
  const command = drawing.commands.pop();
  if (command) {
    drawing.redoCommands.push(command);
  }
}

function redo() {
  const command = drawing.redoCommands.pop();
  if (command) {
    drawing.commands.push(command);
  }
}

const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "Sketchpad";

const palette = document.createElement("div");
const selectedToolLabel = document.createElement("p");

function updateToolButtons() {
  for (const tool of tools) {
    const button = toolButtons.get(tool.id);
    if (button) {
      button.setAttribute(
        "aria-pressed",
        String(tool.id === interaction.selectedTool.id),
      );
    }
  }

  selectedToolLabel.textContent =
    `Selected tool: ${interaction.selectedTool.label}`;
}

function addToolButton(tool: Tool) {
  const button = document.createElement("button");
  button.textContent = tool.label;
  button.setAttribute("aria-pressed", "false");

  button.style.height = "24px";
  button.style.boxSizing = "border-box";
  button.style.display = "inline-flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.lineHeight = "1.2";
  button.style.padding = "0 12px";

  button.addEventListener("click", () => {
    interaction.selectedTool = tool;
    updateToolButtons();
  });

  toolButtons.set(tool.id, button);
  palette.append(button);
}

for (const tool of tools) {
  addToolButton(tool);
}

const toolCreationForm = document.createElement("form");

const nameLabel = document.createElement("label");
nameLabel.textContent = "Tool name ";
const nameInput = document.createElement("input");
nameInput.type = "text";
nameInput.setAttribute("aria-label", "New tool name");
nameLabel.append(nameInput);

const textLabel = document.createElement("label");
textLabel.textContent = " Emoji or short text ";
const textInput = document.createElement("input");
textInput.type = "text";
textInput.maxLength = 10;
textInput.setAttribute("aria-label", "Emoji or short text");
textLabel.append(textInput);

const createToolSubmitButton = document.createElement("button");
createToolSubmitButton.type = "submit";
createToolSubmitButton.textContent = "Create sticker tool";

const cancelToolButton = document.createElement("button");
cancelToolButton.type = "button";
cancelToolButton.textContent = "Cancel";

const toolCreationMessage = document.createElement("p");
toolCreationMessage.setAttribute("aria-live", "polite");

toolCreationForm.append(
  nameLabel,
  textLabel,
  createToolSubmitButton,
  cancelToolButton,
  toolCreationMessage,
);

const redrawButton = document.createElement("button");
redrawButton.textContent = "Redraw";
redrawButton.addEventListener("click", redraw);

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.addEventListener("click", () => {
  undo();
  update();
});

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.addEventListener("click", () => {
  redo();
  update();
});

const exportButton = document.createElement("button");
exportButton.textContent = "Export PNG";
exportButton.addEventListener("click", exportPng);

const exportMessage = document.createElement("p");
exportMessage.setAttribute("aria-live", "polite");

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.addEventListener("click", () => {
  if (interaction.currentStroke) return;

  const last = drawing.commands[drawing.commands.length - 1];
  if (!last || last.kind === "clear") return;

  commit(makeClear());
  update();
});

const clearPixelsButton = document.createElement("button");
clearPixelsButton.textContent = "Clear pixels (test)";
clearPixelsButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.style.display = "block";
canvas.style.border = "1px solid #333";
canvas.style.touchAction = "none";

const controls = document.createElement("div");
controls.append(
  clearButton,
  clearPixelsButton,
  redrawButton,
  undoButton,
  redoButton,
  exportButton,
);

app.append(
  heading,
  palette,
  selectedToolLabel,
  toolCreationForm,
  canvas,
  controls,
  exportMessage,
);

const ctx = canvas.getContext("2d")!;

function updateHistoryControls() {
  const gestureInProgress = interaction.currentStroke !== null;

  undoButton.disabled = gestureInProgress || drawing.commands.length === 0;
  redoButton.disabled = gestureInProgress ||
    drawing.redoCommands.length === 0;
}

function drawStroke(stroke: Stroke, target: CanvasRenderingContext2D) {
  if (stroke.points.length === 0) return;

  target.strokeStyle = stroke.color;
  target.lineWidth = stroke.width;
  target.lineCap = "round";
  target.lineJoin = "round";
  target.beginPath();

  const [first, ...rest] = stroke.points;
  target.moveTo(first.x, first.y);
  for (const point of rest) {
    target.lineTo(point.x, point.y);
  }
  if (rest.length === 0) {
    target.lineTo(first.x, first.y);
  }

  target.stroke();
}

function drawSticker(sticker: Sticker, target: CanvasRenderingContext2D) {
  target.font = `${sticker.size}px sans-serif`;
  target.textAlign = "center";
  target.textBaseline = "middle";
  target.fillText(sticker.text, sticker.x, sticker.y);
}

function drawCommand(
  command: DrawingCommand,
  target: CanvasRenderingContext2D,
) {
  target.save();
  command.draw(target);
  target.restore();
}

function drawDocument(target: CanvasRenderingContext2D) {
  for (const command of drawing.commands) {
    drawCommand(command, target);
  }
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawDocument(ctx);

  if (interaction.currentStroke) {
    drawCommand(interaction.currentStroke, ctx);
  }
}

function update() {
  updateHistoryControls();
  redraw();
}

function exportPng() {
  const scale = 2;
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width * scale;
  exportCanvas.height = canvas.height * scale;

  const exportContext = exportCanvas.getContext("2d");
  if (!exportContext) {
    exportMessage.textContent = "Could not create the export canvas.";
    return;
  }

  exportContext.scale(scale, scale);
  drawDocument(exportContext);

  exportCanvas.toBlob((blob) => {
    if (!blob) {
      exportMessage.textContent = "Could not create the PNG file.";
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sticker-sketchpad.png";
    document.body.append(link);
    link.click();
    link.remove();

    globalThis.setTimeout(() => URL.revokeObjectURL(url), 1000);
    exportMessage.textContent = "PNG exported.";
  }, "image/png");
}

toolCreationForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const text = textInput.value.trim();

  if (!name || !text) {
    toolCreationMessage.textContent =
      "Enter both a tool name and emoji or short text.";
    return;
  }

  const newTool: StickerTool = {
    kind: "sticker",
    id: `custom-${nextCustomToolId}`,
    label: `${name} ${text}`,
    text,
    size: DEFAULT_STICKER_SIZE,
  };

  nextCustomToolId++;
  tools.push(newTool);
  addToolButton(newTool);

  interaction.selectedTool = newTool;
  updateToolButtons();

  toolCreationMessage.textContent = `Created ${name}.`;
  nameInput.value = "";
  textInput.value = "";
});

cancelToolButton.addEventListener("click", () => {
  nameInput.value = "";
  textInput.value = "";
  toolCreationMessage.textContent = "";
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;

  const at = getPoint(event);
  const tool = interaction.selectedTool;

  if (tool.kind === "sticker") {
    commit(makeSticker(tool, at));
  } else {
    interaction.currentStroke = startStroke(tool, at);
    canvas.setPointerCapture(event.pointerId);
  }

  update();
});

canvas.addEventListener("pointermove", (event) => {
  if (!interaction.currentStroke) return;

  interaction.currentStroke.points.push(getPoint(event));

  redraw();
});

canvas.addEventListener("pointerup", () => {
  const stroke = interaction.currentStroke;
  if (!stroke) return;

  interaction.currentStroke = null;

  commit(stroke);

  update();
});

canvas.addEventListener("pointercancel", () => {
  interaction.currentStroke = null;
  update();
});

canvas.addEventListener("lostpointercapture", () => {
  if (!interaction.currentStroke) return;
  interaction.currentStroke = null;
  update();
});

updateToolButtons();
updateHistoryControls();
