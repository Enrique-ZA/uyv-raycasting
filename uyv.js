const uyvType = {};
function uyvIsNumber(value) {
  return typeof value === "number" && isFinite(value);
}
uyvType.SetBit = function(value) {
  return value ? 1 : 0;
};
uyvType.NormalizeBits = function(value) {
  if (Array.isArray(value)) {
    return value.map(uyvType.NormalizeBits);
  } else {
    return uyvType.SetBit(value);
  }
};
uyvType.SetUint8 = function(value) {
  return Math.max(0, Math.min(255, Math.floor(value)));
};
uyvType.NormalizeUint8s = function(value) {
  if (Array.isArray(value)) {
    return value.map(uyvType.NormalizeUint8s);
  } else {
    return uyvType.SetUint8(value);
  }
};
uyvType.SetUint16 = function(value) {
  return Math.max(0, Math.min(65535, Math.floor(value)));
};
uyvType.NormalizeUint16s = function(value) {
  if (Array.isArray(value)) {
    return value.map(uyvType.NormalizeUint16s);
  } else {
    return uyvType.SetUint16(value);
  }
};
const uyvInfinity = Number.MAX_VALUE;
const uyvInfinityMax = Number.MAX_VALUE;
const uyvInfinityMin = Number.MIN_VALUE;
let uyvWidth;
let uyvHeight;
let uyvCurrentFillColor = null;
let uyvCurrentStrokeColor = null;
let uyvCurrentStrokeWeight = 1;
function uyvCreateScreen(w, h) {
  let canvasID = document.getElementById("game");
  if (canvasID === null) {
    throw new Error("No canvas with id game is found");
  }
  if (w < 0 || w > 7680) {
    throw new Error("Screen width needs to be between 0 and 7680 (inclusive)");
  }
  if (h < 0 || h > 4320) {
    throw new Error("Screen height needs to be between 0 and 4320 (inclusive)");
  }
  canvasID.width = w;
  canvasID.height = h;
  const uyvCanvasCtx = canvasID.getContext("2d");
  if (uyvCanvasCtx === null) {
    throw new Error("2D context error.");
  }
  const uyvScreen = canvasID;
  uyvWidth = uyvCanvasCtx.canvas.width;
  uyvHeight = uyvCanvasCtx.canvas.height;
  return { canvas: uyvCanvasCtx, screen: uyvScreen };
}
function uyvInitializeEngine() {
  if (typeof window.uyvStart === "function") {
    window.uyvStart();
  } else {
    console.error(
      "No uyvStart function defined. Define function uyvStart() in your script.",
    );
  }
}
function uyvGetWidth(uyvCanvasCtx) {
  return uyvCanvasCtx.canvas.width;
}
function uyvGetHeight(uyvCanvasCtx) {
  return uyvCanvasCtx.canvas.height;
}
function uyvTranslate(uyvCanvasCtx, x, y) {
  uyvCanvasCtx.translate(x, y);
}
function uyvScale(uyvCanvasCtx, x, y) {
  uyvCanvasCtx.scale(x, y);
}
class uyvVector2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
  }
    static zero() {
    return new uyvVector2D(0, 0);
  }
    static fromAngle( angle) {
    return new uyvVector2D(Math.cos(angle), Math.sin(angle));
  }
    array() {
    return [this.x, this.y];
  }
    div( other) {
    return new uyvVector2D(this.x / other.x, this.y / other.y);
  }
    mult( other) {
    return new uyvVector2D(this.x * other.x, this.y * other.y);
  }
    sub( other) {
    return new uyvVector2D(this.x - other.x, this.y - other.y);
  }
    add( other) {
    return new uyvVector2D(this.x + other.x, this.y + other.y);
  }
    length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
    rotate90() {
    return new uyvVector2D(-this.y, this.x);
  }
    distanceTo( other) {
    return other.sub(this).length();
  }
    scale(value) {
    return new uyvVector2D(this.x * value, this.y * value);
  }
    normalize() {
    const len = this.length();
    if (len === 0) {
      return new uyvVector2D(0, 0);
    }
    return new uyvVector2D(this.x / len, this.y / len);
  }
    lerp(other, t) {
    return other.sub(this).scale(t).add(this);
  }
    dot(other) {
    return this.x * other.x + this.y * other.y;
  }
}
function uyvPush(uyvCanvasCtx) {
  uyvCanvasCtx.save();
}
function uyvPop(uyvCanvasCtx) {
  uyvCanvasCtx.restore();
}
function uyvClampRGB(r, g, b) {
  r = uyvType.NormalizeUint8s(r);
  g = uyvType.NormalizeUint8s(g);
  b = uyvType.NormalizeUint8s(b);
  return { r: r, g: g, b: b };
}
function uyvClampConvertRgbHexString(r, g, b) {
  const color = uyvClampRGB(r, g, b);
    const toHex = (c) => c.toString(16).padStart(2, "0");
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}
function uyvNormalizeAlpha(val) {
  return Math.max(0, Math.min(1, val / 255));
}
function uyvFill(uyvCanvasCtx, r, g, b, a = 255) {
  a = uyvNormalizeAlpha(uyvType.SetUint8(a));
  uyvCurrentFillColor = `rgba(${r}, ${g}, ${b}, ${a})`;
  uyvCanvasCtx.fillStyle = uyvCurrentFillColor;
}
function uyvNoFill() {
  uyvCurrentFillColor = null;
}
function uyvStroke(uyvCanvasCtx, r, g, b, a = 255) {
  a = uyvNormalizeAlpha(uyvType.SetUint8(a));
  uyvCurrentStrokeColor = `rgba(${r}, ${g}, ${b}, ${a})`;
  uyvCanvasCtx.strokeStyle = uyvCurrentStrokeColor;
}
function uyvNoStroke() {
  uyvCurrentStrokeColor = null;
}
function uyvStrokeWeight(uyvCanvasCtx, weight) {
  const actualWeight = Math.max(0, weight);
  uyvCurrentStrokeWeight = actualWeight;
  uyvCanvasCtx.lineWidth = actualWeight;
}
function uyvBackground(uyvCanvasCtx, r, g, b) {
  uyvCanvasCtx.fillStyle = uyvClampConvertRgbHexString(r, g, b);
  uyvCanvasCtx.fillRect(
    0,
    0,
    uyvGetWidth(uyvCanvasCtx),
    uyvGetHeight(uyvCanvasCtx),
  );
}
function uyvLine(uyvCanvasCtx, x1, y1, x2, y2) {
  uyvCanvasCtx.beginPath();
  uyvCanvasCtx.moveTo(x1, y1);
  uyvCanvasCtx.lineTo(x2, y2);
  if (uyvCurrentStrokeColor) {
    uyvCanvasCtx.stroke();
  } else {
    throw new Error("A stroke color is needed to draw a line.");
  }
}
function uyvPoint(uyvCanvasCtx, x, y, radius = 3) {
  uyvCanvasCtx.beginPath();
  const actualRadius = Math.max(0.0000000009, radius);
  uyvCanvasCtx.arc(x, y, actualRadius, 0, 2 * Math.PI);
  if (uyvCurrentFillColor) {
    uyvCanvasCtx.fill();
  }
  if (uyvCurrentStrokeColor) {
    uyvCanvasCtx.stroke();
  }
}
function uyvCircle(uyvCanvasCtx, x, y, radius) {
  uyvCanvasCtx.beginPath();
  const actualRadius = Math.max(0, radius);
  uyvCanvasCtx.arc(x, y, actualRadius, 0, 2 * Math.PI);
  if (uyvCurrentFillColor) {
    uyvCanvasCtx.fill();
  }
  if (uyvCurrentStrokeColor) {
    uyvCanvasCtx.stroke();
  }
}
window.addEventListener("load", function() {
  uyvInitializeEngine();
});
