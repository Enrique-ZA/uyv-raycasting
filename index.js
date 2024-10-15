const EPS = 1e-6;
const nearClippingPlane = 1;
const farClippingPlane = 8;
const FOV = Math.PI * 0.5;
const screenWidth3D = 300;
const playerStepLen = 0.15;
function snap(x, dx) {
  if (dx > 0) {
    return Math.ceil(x + Math.sign(dx) * EPS);
  }
  if (dx < 0) {
    return Math.floor(x + Math.sign(dx) * EPS);
  }
  return x;
}
function hittingCell(p1, p2) {
  const d = p2.sub(p1);
  const x3 = Math.floor(p2.x + Math.sign(d.x) * EPS);
  const y3 = Math.floor(p2.y + Math.sign(d.y) * EPS);
  return new uyvVector2D(x3, y3);
}
function castRay(scene, p1, p2) {
  for (; ;) {
    const c = hittingCell(p1, p2);
    if (!insideScene(scene, c) || scene[c.y][c.x] !== null) {
      break;
    }
    const p3 = rayStep(p1, p2);
    p1 = p2;
    p2 = p3;
  }
  return p2;
}
function rayStep(p1, p2) {
  let p4 = p2;
  const d = p2.sub(p1);
  if (d.x !== 0) {
    const k = d.y / d.x;
    const c = p1.y - k * p1.x;
    {
      const x3 = snap(p2.x, d.x);
      const y3 = x3 * k + c;
      const p3 = new uyvVector2D(x3, y3);
      p4 = p3;
    }
    {
      if (k !== 0) {
        const y3 = snap(p2.y, d.y);
        const x3 = (y3 - c) / k;
        const p3 = new uyvVector2D(x3, y3);
        if (p2.distanceTo(p3) < p2.distanceTo(p4)) {
          p4 = p3;
        }
      }
    }
  } else {
    const y3 = snap(p2.y, d.y);
    const x3 = p2.x;
    const p3 = new uyvVector2D(x3, y3);
    p4 = p3;
  }
  return p4;
}
function canvasSize(cCtxMap) {
  return new uyvVector2D(uyvGetWidth(cCtxMap), uyvGetHeight(cCtxMap));
}
function sceneSize(scene) {
  const y = scene.length;
  let x = -uyvInfinityMin;
  for (let row of scene) {
    x = Math.max(x, row.length);
  }
  return new uyvVector2D(x, y);
}
function insideScene(scene, p) {
  const size = sceneSize(scene);
  return 0 <= p.x && p.x < size.x && 0 <= p.y && p.y < size.y;
}
function draw3D(cCtxMap, player, scene) {
  const stripWidth = Math.ceil(cCtxMap.canvas.width / screenWidth3D);
  const [r1, r2] = player.fovRange();
  for (let x = 0; x < screenWidth3D; ++x) {
    const pLerp = r1.lerp(r2, x / screenWidth3D);
    const p = castRay(scene, player.pos, pLerp);
    const c = hittingCell(player.pos, p);
    const q = scene[c.y][c.x];
    if (insideScene(scene, c) && q !== null) {
      const v = p.sub(player.pos);
      const d = uyvVector2D.fromAngle(player.dir);
      let t = 1 - p.sub(player.pos).length() / farClippingPlane;
      const stripHeight = cCtxMap.canvas.height / v.dot(d);
      uyvNoStroke();
      uyvFill(cCtxMap, q.r * t, q.g * t, q.b * t, q.a);
      cCtxMap.fillRect(
        x * stripWidth,
        (cCtxMap.canvas.height - stripHeight) * 0.5,
        stripWidth,
        stripHeight,
      );
    }
  }
}
function drawMinimap(cCtxMap, player, scene, mapPos, mapSize) {
  const gridSize = sceneSize(scene);
  const lineWidth = 0.03;
  uyvTranslate(cCtxMap, ...mapPos.array());
  uyvFill(cCtxMap, 0, 0, 0, 125);
  cCtxMap.fillRect(0, 0, mapSize.x, mapSize.y);
  uyvScale(cCtxMap, ...mapSize.div(gridSize).array());
  for (let y = 0; y < gridSize.y; ++y) {
    for (let x = 0; x < gridSize.x; ++x) {
      const q = scene[y][x];
      if (q !== null) {
        uyvNoStroke();
        uyvFill(cCtxMap, 255, 0, 0);
        cCtxMap.fillRect(x, y, 1, 1);
      }
    }
  }
  uyvFill(cCtxMap, 255, 0, 255);
  uyvNoStroke();
  uyvCircle(cCtxMap, ...player.pos.array(), 0.2);
  const [p1, p2] = player.fovRange();
  uyvStroke(cCtxMap, 255, 0, 255);
  uyvStrokeWeight(cCtxMap, lineWidth);
  uyvLine(cCtxMap, ...p1.array(), ...p2.array());
  uyvLine(cCtxMap, ...player.pos.array(), ...p1.array());
  uyvLine(cCtxMap, ...player.pos.array(), ...p2.array());
}
class Player {
  constructor(
     pos,
     dir,
  ) {
        this.pos = pos;
        this.dir = dir;
  }
    fovRange() {
    const l = Math.tan(FOV * 0.5) * nearClippingPlane;
    const p = this.pos.add(
      uyvVector2D.fromAngle(this.dir).scale(nearClippingPlane),
    );
    const p1 = p.sub(p.sub(this.pos).rotate90().normalize().scale(l));
    const p2 = p.add(p.sub(this.pos).rotate90().normalize().scale(l));
    return [p1, p2];
  }
}
let uyvKey = null;
function uyvKeyDown() { }
function redrawScreen(
  canvasCtxMap,
  player,
  scene,
  minimapPosition,
  minimapSize,
) {
  uyvBackground(canvasCtxMap, 255, 255, 0);
  uyvPush(canvasCtxMap);
  draw3D(canvasCtxMap, player, scene);
  uyvPop(canvasCtxMap);
  uyvPush(canvasCtxMap);
  drawMinimap(canvasCtxMap, player, scene, minimapPosition, minimapSize);
  uyvPop(canvasCtxMap);
}
function uyvStart() {
  const sW = 1200;
  const sH = uyvType.NormalizeUint16s((sW * 9) / 16);
  const canvasObjMap = uyvCreateScreen(sW, sH);
  const canvasCtxMap = canvasObjMap.canvas;
  const screenPort = canvasObjMap.screen;
  if (canvasCtxMap === null) {
    throw new Error("canvasCtxMap cannot be null");
  }
  const q = { r: 0, g: 0, b: 255, a: 255 };
  const v = null;
    let scene = [
    [v, v, q, q, v, v, v],
    [v, v, v, q, v, v, v],
    [v, q, q, q, v, v, v],
    [v, v, v, v, v, v, v],
    [v, v, v, v, v, v, v],
    [v, v, v, v, v, v, v],
    [v, v, v, v, v, v, v],
  ];
  scene = [
    [q, q, q, q, q, q, q, q, q, q, q, q, q, q, q, q, q, q, q, q],
    [q, v, v, v, v, v, v, v, v, q, q, v, v, v, v, v, v, v, v, q],
    [q, v, v, v, v, v, v, v, v, q, q, v, v, v, v, v, v, v, v, q],
    [q, v, v, q, q, q, q, v, v, q, q, v, v, q, q, q, q, v, v, q],
    [q, v, v, q, q, q, q, v, v, q, q, v, v, q, q, q, q, v, v, q],
    [q, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, q],
    [q, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, q],
    [q, q, q, v, v, q, q, q, q, v, v, q, q, q, q, v, v, q, q, q],
    [q, q, q, v, v, q, q, q, q, v, v, q, q, q, q, v, v, q, q, q],
    [q, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, q],
    [q, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, q],
    [q, v, v, q, q, q, q, v, v, q, q, v, v, q, q, q, q, v, v, q],
    [q, v, v, q, q, q, q, v, v, q, q, v, v, q, q, q, q, v, v, q],
    [q, v, v, v, v, v, v, v, v, q, q, v, v, v, v, v, v, v, v, q],
    [q, v, v, v, v, v, v, v, v, q, q, v, v, v, v, v, v, v, v, q],
    [q, q, q, v, v, q, q, q, q, q, q, q, q, q, q, v, v, q, q, q],
    [q, q, q, v, v, q, q, q, q, q, q, q, q, q, q, v, v, q, q, q],
    [q, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, q],
    [q, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, q],
    [q, q, q, q, q, q, q, q, q, q, q, q, q, q, q, q, q, q, q, q],
  ];
    const player = new Player(
    sceneSize(scene).mult(new uyvVector2D(0.73, 0.73)),
    Math.PI * 1.25,
  );
  const baseRows = 7;
  const baseCellSize = 0.02;
  let cScalar = 1;
  const k = baseRows * baseCellSize * cScalar;
  const currentRows = scene[0].length;
  const newCellSize = (k / currentRows) * 1.5;
  const minimapPosition = uyvVector2D
    .zero()
    .add(canvasSize(canvasCtxMap).scale(0.05));
  const cellSize = uyvGetWidth(canvasCtxMap) * newCellSize;
  const minimapSize = sceneSize(scene).scale(cellSize);
  window.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "w":
        player.pos = player.pos.add(
          uyvVector2D.fromAngle(player.dir).scale(playerStepLen),
        );
        redrawScreen(canvasCtxMap, player, scene, minimapPosition, minimapSize);
        break;
      case "s":
        player.pos = player.pos.sub(
          uyvVector2D.fromAngle(player.dir).scale(playerStepLen),
        );
        redrawScreen(canvasCtxMap, player, scene, minimapPosition, minimapSize);
        break;
      case "d":
        player.dir += Math.PI * 0.1;
        redrawScreen(canvasCtxMap, player, scene, minimapPosition, minimapSize);
        break;
      case "a":
        player.dir -= Math.PI * 0.1;
        redrawScreen(canvasCtxMap, player, scene, minimapPosition, minimapSize);
        break;
    }
  });
  window.addEventListener("keyup", (e) => { });
  redrawScreen(canvasCtxMap, player, scene, minimapPosition, minimapSize);
  console.log("WORKNG");
}
