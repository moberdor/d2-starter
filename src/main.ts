type Point = { x: number; y: number };

type Stroke = {
  kind: "stroke";
  points: Point[];
  color: string;
  width: number;
};

type Sticker = {
  kind: "sticker";
  x: number;
  y: number;
  text: string;
  size: number;
};

type DrawingCommand = Stroke | Sticker;

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

const tools: Tool[] = [
  {
    kind: "marker",
    id: "thin-marker",
    label: "Thin marker",
    color: "#222222",
    width: 2,
  },
  {
    kind: "marker",
    id: "thick-marker",
    label: "Thick marker",
    color: "#222222",
    width: 7,
  },
  {
    kind: "sticker",
    id: "skull",
    label: "💀 Skull",
    text: "💀",
    size: 32,
  },
  {
    kind: "sticker",
    id: "heart",
    label: "❤️ Heart",
    text: "❤️",
    size: 32,
  },
  {
    kind: "sticker",
    id: "shark",
    label: "🦈 Shark",
    text: "🦈",
    size: 32,
  },
];

const commands: DrawingCommand[] = [];
const redoCommands: DrawingCommand[] = [];
const toolButtons = new Map<string, HTMLButtonElement>();

let currentStroke: Stroke | null = null;
let selectedTool: Tool = tools[0];
let nextCustomToolId = 1;

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
        String(tool.id === selectedTool.id),
      );
    }
  }

  selectedToolLabel.textContent = `Selected tool: ${selectedTool.label}`;
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
    selectedTool = tool;
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
textInput.maxLength = 12;
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
undoButton.addEventListener("click", undo);

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.addEventListener("click", redo);

const exportButton = document.createElement("button");
exportButton.textContent = "Export PNG";
exportButton.addEventListener("click", exportPng);

const exportMessage = document.createElement("p");
exportMessage.setAttribute("aria-live", "polite");

const clearPixelsButton = document.createElement("button");
clearPixelsButton.textContent = "Clear pixels (test)";

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.style.display = "block";
canvas.style.border = "1px solid #333";
canvas.style.touchAction = "none";

const controls = document.createElement("div");
controls.append(
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
  const gestureInProgress = currentStroke !== null;

  undoButton.disabled = gestureInProgress || commands.length === 0;
  redoButton.disabled = gestureInProgress || redoCommands.length === 0;
}

function undo() {
  if (currentStroke || commands.length === 0) return;

  const command = commands.pop();
  if (!command) return;

  redoCommands.push(command);
  updateHistoryControls();
  redraw();
}

function redo() {
  if (currentStroke || redoCommands.length === 0) return;

  const command = redoCommands.pop();
  if (!command) return;

  commands.push(command);
  updateHistoryControls();
  redraw();
}

function drawCommand(
  command: DrawingCommand,
  target: CanvasRenderingContext2D,
) {
  target.save();

  if (command.kind === "stroke") {
    if (command.points.length === 0) {
      target.restore();
      return;
    }

    target.strokeStyle = command.color;
    target.lineWidth = command.width;
    target.lineCap = "round";
    target.lineJoin = "round";
    target.beginPath();

    const first = command.points[0];
    target.moveTo(first.x, first.y);

    for (let i = 1; i < command.points.length; i++) {
      const point = command.points[i];
      target.lineTo(point.x, point.y);
    }

    if (command.points.length === 1) {
      target.lineTo(first.x, first.y);
    }

    target.stroke();
  } else {
    target.font = `${command.size}px sans-serif`;
    target.textAlign = "center";
    target.textBaseline = "middle";
    target.fillText(command.text, command.x, command.y);
  }

  target.restore();
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const command of commands) {
    drawCommand(command, ctx);
  }

  if (currentStroke) {
    drawCommand(currentStroke, ctx);
  }
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

  for (const command of commands) {
    drawCommand(command, exportContext);
  }

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
    size: 32,
  };

  nextCustomToolId++;
  tools.push(newTool);
  addToolButton(newTool);

  selectedTool = newTool;
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

clearPixelsButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;

  const x = event.offsetX;
  const y = event.offsetY;

  if (selectedTool.kind === "sticker") {
    commands.push({
      kind: "sticker",
      x,
      y,
      text: selectedTool.text,
      size: selectedTool.size,
    });

    redoCommands.length = 0;
    updateHistoryControls();
    redraw();
    return;
  }

  currentStroke = {
    kind: "stroke",
    points: [{ x, y }],
    color: selectedTool.color,
    width: selectedTool.width,
  };

  canvas.setPointerCapture(event.pointerId);
  updateHistoryControls();
  redraw();
});

canvas.addEventListener("pointermove", (event) => {
  if (!currentStroke) return;

  currentStroke.points.push({
    x: event.offsetX,
    y: event.offsetY,
  });

  redraw();
});

canvas.addEventListener("pointerup", () => {
  if (!currentStroke) return;

  if (currentStroke.points.length > 1) {
    commands.push(currentStroke);
    redoCommands.length = 0;
  }

  currentStroke = null;
  updateHistoryControls();
  redraw();
});

canvas.addEventListener("pointercancel", () => {
  currentStroke = null;
  updateHistoryControls();
  redraw();
});

updateToolButtons();
updateHistoryControls();
