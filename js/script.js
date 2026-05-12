const canvas = document.getElementById("canvas");
const W = 88,
  H = 50;
const CHARS = " .`'^-~:;=!*#$%&@";
const LUM_THRESHOLD = 0.72;

let rX = 0.5,
  rY = 0.3,
  rZ = 0;
let breath = 0;
let rafId = null;

let targetRX = 0.5,
  targetRY = 0.3;
const ease = 0.065;

const cfg = {
  R1: 0.55,
  R2: 3.2,
  twistBase: 2.8,
  nodeAmp: 0.9,
  nodeFreq: 4,
  sx: 1,
  sy: 1,
};

const TARGET_FPS = 60;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
let lastTime = 0;

function updateTarget(clientX, clientY) {
  const cx = (clientX / window.innerWidth) * 2 - 1;
  const cy = (clientY / window.innerHeight) * 2 - 1;
  targetRY = cx * 2.8;
  targetRX = -cy * 1.8;
}

window.addEventListener("mousemove", (e) => updateTarget(e.clientX, e.clientY));
window.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 0)
      updateTarget(e.touches[0].clientX, e.touches[0].clientY);
  },
  { passive: true },
);

function render() {
  const buf = new Array(W * H).fill(" ");
  const zBuf = new Float32Array(W * H);
  const lBuf = new Float32Array(W * H);

  rX += (targetRX - rX) * ease;
  rY += (targetRY - rY) * ease;
  rZ += 0.015;

  const cx = Math.cos(rX),
    sx = Math.sin(rX);
  const cy = Math.cos(rY),
    sy = Math.sin(rY);
  const cz = Math.cos(rZ),
    sz = Math.sin(rZ);

  breath += 0.04;
  const scale = 1 + Math.sin(breath) * 0.03;
  const twistRate = cfg.twistBase + Math.sin(breath * 1.5) * 0.4;

  const L = { x: 0.35, y: 0.75, z: -0.6 };
  const K1 = 40,
    K2 = 7;

  function transform(x, y, z, nx, ny, nz) {
    let x1 = x * cy - z * sy,
      z1 = x * sy + z * cy;
    let nx1 = nx * cy - nz * sy,
      nz1 = nx * sy + nz * cy;
    let x2 = x1,
      y2 = y * cx - z1 * sx,
      z2 = y * sx + z1 * cx;
    let nx2 = nx1,
      ny2 = ny * cx - nz1 * sx,
      nz2 = ny * sx + nz1 * cx;
    let x3 = x2 * cz - y2 * sz,
      y3 = x2 * sz + y2 * cz;
    let nx3 = nx2 * cz - ny2 * sz,
      ny3 = nx2 * sz + ny2 * cz,
      nz3 = nz2;
    return { x: x3, y: y3, z: z2, nx: nx3, ny: ny3, nz: nz3 };
  }

  const step = 0.085;
  for (let i = 0; i < 6.28; i += step) {
    const ci = Math.cos(i),
      si = Math.sin(i);
    const R2_local = cfg.R2 + cfg.nodeAmp * Math.cos(cfg.nodeFreq * i);

    for (let j = 0; j < 6.28; j += step) {
      const cj = Math.cos(j),
        sj = Math.sin(j);
      const twistAngle = j + twistRate * i;
      const cTwist = Math.cos(twistAngle);
      const sTwist = Math.sin(twistAngle);

      const x = (R2_local + cfg.R1 * cTwist) * ci;
      const y = cfg.R1 * sTwist;
      const z = (R2_local + cfg.R1 * cTwist) * si;
      const nx = cTwist * ci,
        ny = sTwist,
        nz = cTwist * si;

      const t = transform(x * scale, y * scale, z * scale, nx, ny, nz);
      const lum =
        0.12 + 0.88 * Math.max(0, t.nx * L.x + t.ny * L.y + t.nz * L.z);

      const ooz = 1 / (t.z + K2);
      const xp = Math.floor(W / 2 + K1 * ooz * t.x * cfg.sx);
      const yp = Math.floor(H / 2 - K1 * ooz * t.y * cfg.sy * 0.55);

      if (yp >= 0 && yp < H && xp >= 0 && xp < W) {
        const idx = xp + yp * W;
        if (ooz > zBuf[idx]) {
          zBuf[idx] = ooz;
          lBuf[idx] = lum;
          buf[idx] =
            CHARS[
              Math.min(
                CHARS.length - 1,
                Math.max(0, Math.floor(lum * (CHARS.length - 1))),
              )
            ];
        }
      }
    }
  }

  const outArr = new Array(W * H);
  for (let k = 0; k < W * H; k++) {
    const isLineBreak = k % W === W - 1;
    const char = isLineBreak ? "\n" : buf[k];

    if (!isLineBreak && lBuf[k] > LUM_THRESHOLD) {
      outArr[k] = `<span class="hl">${char}</span>`;
    } else {
      outArr[k] = char;
    }
  }
  canvas.innerHTML = outArr.join("");
}

function loop(timestamp) {
  rafId = requestAnimationFrame(loop);
  if (timestamp - lastTime < FRAME_INTERVAL) return;
  lastTime = timestamp;
  render();
}

requestAnimationFrame(loop);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancelAnimationFrame(rafId);
  else {
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }
});
