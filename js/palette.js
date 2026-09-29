// Dos mundos tomados de las pinturas de referencia:
// la pareja bajo la luna (noche azul) y el salón de baile (dorado).
const NOCHE = {
  skyTop: [6, 14, 52],
  skyLow: [28, 58, 150],
  floorFar: [14, 30, 92],
  floorNear: [4, 9, 34],
  moon: [246, 238, 205],
  streak: [205, 220, 255],
  victorBody: [10, 16, 48],
  victorRim: [120, 160, 255],
  emily: [226, 236, 255],
  trailV: [70, 120, 255],
  trailE: [190, 212, 255],
  light: [255, 244, 210],
};

const SALON = {
  skyTop: [28, 16, 8],
  skyLow: [120, 78, 36],
  floorFar: [86, 54, 24],
  floorNear: [26, 15, 6],
  moon: [255, 222, 150],
  streak: [255, 214, 150],
  victorBody: [34, 18, 8],
  victorRim: [255, 186, 104],
  emily: [255, 238, 212],
  trailV: [214, 134, 56],
  trailE: [255, 224, 170],
  light: [255, 226, 160],
};

const keys = Object.keys(NOCHE);
const out = {};
for (const k of keys) out[k] = [0, 0, 0];

// t = 0 noche azul · t = 1 salón dorado
export function paletteAt(t) {
  for (const k of keys) {
    for (let i = 0; i < 3; i++) out[k][i] = Math.round(NOCHE[k][i] + (SALON[k][i] - NOCHE[k][i]) * t);
  }
  return out;
}

export const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
