// Her garden: a little Persian courtyard (چهارباغ) that fills with life as
// she walks the path. Drawn as inline SVG; colours come from CSS so it turns
// into a moonlit garden in dark mode.

import { LESSONS } from "./data/lessons.js";
import { READING } from "./data/reading.js";
import { SPEAK } from "./data/speak.js";
import { store } from "./lib/store.js";

/** Everything she has finished: alphabet stops, reading units, speaking situations. */
export function allDone() {
  const s = store.get();
  return new Set([...s.lessonsDone, ...s.readingDone, ...s.speakingDone]);
}

const NS = "http://www.w3.org/2000/svg";

function s(tag, attrs = {}, children = []) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const c of children) if (c) el.append(c);
  return el;
}

const g = (cls, x, y, children) => s("g", { class: cls, transform: `translate(${x} ${y})` }, children);
const circle = (cx, cy, r, attrs = {}) => s("circle", { cx, cy, r, ...attrs });

function blossoms(points, r, fill, stroke) {
  return points.map(([x, y]) => circle(x, y, r, { fill, ...(stroke ? { stroke, "stroke-width": 0.8 } : {}) }));
}

function bush(w, h, extra = []) {
  return [
    s("ellipse", { cx: 0, cy: -h * 0.45, rx: w * 0.5, ry: h * 0.45, class: "g-leaf" }),
    s("ellipse", { cx: -w * 0.22, cy: -h * 0.55, rx: w * 0.3, ry: h * 0.32, class: "g-leaf2" }),
    s("ellipse", { cx: w * 0.2, cy: -h * 0.6, rx: w * 0.28, ry: h * 0.3, class: "g-leaf2" }),
    ...extra,
  ];
}

function tree(trunkH, canopyR, fruit = null) {
  return [
    s("rect", { x: -3, y: -trunkH, width: 6, height: trunkH, rx: 2, class: "g-trunk" }),
    circle(0, -trunkH - canopyR * 0.6, canopyR, { class: "g-leaf" }),
    circle(-canopyR * 0.45, -trunkH - canopyR * 0.3, canopyR * 0.6, { class: "g-leaf2" }),
    circle(canopyR * 0.5, -trunkH - canopyR * 0.4, canopyR * 0.55, { class: "g-leaf2" }),
    ...(fruit
      ? blossoms(
          [[-10, -trunkH - 18], [8, -trunkH - 26], [14, -trunkH - 10], [-16, -trunkH - 6], [0, -trunkH - 4], [-4, -trunkH - 32]],
          fruit.r,
          fruit.color,
        )
      : []),
  ];
}

const PLANTS = {
  cypress: () => [
    s("rect", { x: -2, y: -8, width: 4, height: 8, class: "g-trunk" }),
    s("path", { d: "M0 -92 C 12 -64, 14 -26, 0 -6 C -14 -26, -12 -64, 0 -92 Z", class: "g-cypress" }),
  ],
  jasmine: () => bush(44, 30, blossoms([[-12, -22], [4, -28], [14, -16], [-4, -12], [-18, -10], [10, -6]], 2.6, "#fffaf0", "#e6d9b8")),
  saffron: () => [
    ...[-12, -4, 4, 12].map((x) => s("path", { d: `M${x} 0 Q ${x - 3} -14 ${x - 1} -22`, class: "g-stem", fill: "none" })),
    ...[[-12, -24], [0, -28], [12, -23]].flatMap(([x, y]) => [
      s("path", { d: `M${x - 5} ${y} Q ${x} ${y - 14} ${x + 5} ${y} Z`, fill: "#9b6fc4" }),
      s("path", { d: `M${x} ${y - 2} l -2 -7 M${x} ${y - 2} l 2 -7`, stroke: "#d7322b", "stroke-width": 1.2 }),
    ]),
  ],
  tulip: () =>
    [-12, 0, 12].flatMap((x, i) => [
      s("path", { d: `M${x} 0 Q ${x + 2} -16 ${x} -${28 + i * 4}`, class: "g-stem", fill: "none" }),
      s("path", { d: `M${x - 6} -${28 + i * 4} q 0 -12 6 -12 q 6 0 6 12 q -6 6 -12 0 Z`, fill: "#c8324a" }),
    ]),
  hyacinth: () =>
    [-8, 8].flatMap((x, i) => [
      s("path", { d: `M${x} 0 L ${x} -14`, class: "g-stem" }),
      ...Array.from({ length: 7 }, (_, k) => circle(x + (k % 2 ? 3 : -3), -16 - k * 4.5 - i * 3, 3.2, { fill: i ? "#7d8fe0" : "#b18be0" })),
    ]),
  plane: () => tree(34, 30),
  pomegranate: () => tree(22, 22, { r: 3.6, color: "#c02f3c" }),
  orange: () => tree(22, 21, { r: 3.4, color: "#ee9330" }),
  rose: () => bush(46, 34, blossoms([[-13, -24], [6, -32], [16, -18], [-4, -14], [-18, -12]], 4.2, "#d9476b", "#a8304f")),
  reed: () =>
    [-10, -4, 3, 9].flatMap((x, i) => [
      s("path", { d: `M${x} 0 Q ${x + (i % 2 ? 4 : -4)} -30 ${x + 1} -${48 + (i % 3) * 8}`, class: "g-stem", fill: "none" }),
      i % 2 === 0 ? s("rect", { x: x - 2, y: -(46 + (i % 3) * 8), width: 4, height: 12, rx: 2, fill: "#8a5a35" }) : null,
    ]),
  lilac: () =>
    bush(
      46,
      32,
      [[-12, -26], [6, -32], [16, -20]].flatMap(([x, y]) =>
        [[0, -7, 2.4], [-3, -3, 2.8], [3, -3, 2.8], [-4, 2, 3], [0, 1, 3], [4, 2, 3], [0, 6, 2.6]].map(([dx, dy, r]) => circle(x + dx, y + dy, r, { fill: "#b48ad6" })),
      ),
    ),
  narcissus: () =>
    [-11, 0, 11].flatMap((x, i) => {
      const y = -(26 + (i % 2) * 9);
      return [
        s("path", { d: `M${x} 0 Q ${x + (i - 1) * 2} -14 ${x} ${y}`, class: "g-stem", fill: "none" }),
        s("path", { d: `M${x - 2} 0 Q ${x - 8} -10 ${x - 6} -18`, class: "g-stem", fill: "none" }),
        ...[0, 60, 120, 180, 240, 300].map((deg) => {
          const r = (deg * Math.PI) / 180;
          return s("ellipse", { cx: x + Math.cos(r) * 4, cy: y + Math.sin(r) * 4, rx: 3.4, ry: 2.2, transform: `rotate(${deg} ${x + Math.cos(r) * 4} ${y + Math.sin(r) * 4})`, fill: "#fffdf4", stroke: "#e4dcc2", "stroke-width": 0.6 });
        }),
        circle(x, y, 2.2, { fill: "#f0b429" }),
      ];
    }),
};

function nightingale() {
  return [
    s("ellipse", { cx: 0, cy: 0, rx: 9, ry: 6, fill: "#8b6243" }),
    circle(7, -4, 4.4, { fill: "#8b6243" }),
    s("path", { d: "M11 -4 l 5 1.4 l -5 1.2 Z", fill: "#e2a64a" }),
    circle(8.2, -5, 0.9, { fill: "#1d1a17" }),
    s("path", { d: "M-8 0 l -9 -4 l 2 6 Z", fill: "#6f4c33" }),
    s("text", { x: 18, y: -12, class: "g-note" }, [document.createTextNode("♪")]),
    s("text", { x: 27, y: -20, class: "g-note" }, [document.createTextNode("♫")]),
  ];
}

// Plant slots, in lesson order (lesson 1 → first slot): six by the back wall, six at the front.
const SLOTS = [
  [40, 132], [104, 132], [162, 132], [238, 132], [296, 132], [360, 132],
  [40, 228], [104, 228], [162, 228], [238, 228], [296, 228], [360, 228],
];

/** Draw the garden. `done` is the set of finished lesson ids; `fresh` is a
 * lesson id that just finished, to animate its plant. */
export function gardenSvg(done, fresh = null) {
  const svg = s("svg", { viewBox: "0 0 400 250", class: "garden-svg", role: "img" });
  const count = LESSONS.filter((l) => done.has(l.id)).length;
  const reads = READING.filter((r) => done.has(r.id)).length;
  const talks = SPEAK.filter((r) => done.has(r.id)).length;
  svg.append(
    s("title", {}, [document.createTextNode(`Your garden: ${count} of ${LESSONS.length} plants, ${reads} tiled arches, ${talks} lanterns`)]),
  );

  // sky + moon/sun, back wall with arches
  svg.append(s("rect", { x: 0, y: 0, width: 400, height: 250, class: "g-sky" }));
  svg.append(circle(352, 30, 13, { class: "g-sun" }));
  svg.append(s("rect", { x: 0, y: 58, width: 400, height: 44, class: "g-wall" }));
  // Reading Room units fill the arches with turquoise tilework (the middle arch stays plain).
  const tiledArch = [0, 1, 2, 3, 5, 6, 7, 8];
  for (let i = 0; i < 9; i++) {
    const x = 10 + i * 44;
    const unit = READING[tiledArch.indexOf(i)];
    const tiled = unit && done.has(unit.id);
    svg.append(s("path", { d: `M${x} 102 V 80 Q ${x + 14} 62 ${x + 28} 80 V 102 Z`, class: tiled ? `g-arch-tiled${fresh === unit.id ? " fresh-tile" : ""}` : "g-arch" }));
    if (tiled) {
      const cx = x + 14;
      svg.append(
        s("g", { class: `g-tilework${fresh === unit.id ? " fresh-tile" : ""}` }, [
          s("rect", { x: cx - 5, y: 83, width: 10, height: 10, class: "g-star" }),
          s("rect", { x: cx - 5, y: 83, width: 10, height: 10, class: "g-star", transform: `rotate(45 ${cx} 88)` }),
          circle(cx, 88, 2, { class: "g-star-dot" }),
        ]),
      );
    }
  }
  svg.append(s("rect", { x: 0, y: 56, width: 400, height: 4, class: "g-tile" }));

  // ground, the four-part garden channels and the pool
  svg.append(s("rect", { x: 0, y: 102, width: 400, height: 148, class: "g-ground" }));
  svg.append(s("rect", { x: 10, y: 168, width: 380, height: 8, rx: 4, class: done.has("l0") ? "g-water" : "g-channel" }));
  svg.append(s("rect", { x: 196, y: 110, width: 8, height: 136, rx: 4, class: done.has("l0") ? "g-water" : "g-channel" }));
  const pool = s("rect", { x: 150, y: 152, width: 100, height: 40, rx: 8, class: "g-pool-rim" });
  svg.append(pool);
  svg.append(s("rect", { x: 156, y: 157, width: 88, height: 30, rx: 6, class: done.has("l0") ? `g-water${fresh === "l0" ? " fresh-water" : ""}` : "g-channel" }));
  if (done.has("l0")) {
    svg.append(s("path", { d: "M168 170 q 6 -3 12 0 M206 177 q 6 -3 12 0", class: "g-ripple", fill: "none" }));
  }

  // plants
  // every stop between the pool (the first) and the nightingale (the last) grows a plant
  LESSONS.filter((l) => l.id !== "l0" && l.id !== "l12").forEach((lesson, i) => {
    const [x, y] = SLOTS[i];
    if (done.has(lesson.id)) {
      const draw = PLANTS[lesson.plant];
      const plant = g(`g-plant${fresh === lesson.id ? " fresh" : ""}`, x, y, draw ? draw() : []);
      svg.append(plant);
    } else {
      svg.append(g("g-seed", x, y, [s("ellipse", { cx: 0, cy: 0, rx: 12, ry: 4, class: "g-mound" }), circle(0, -3, 1.8, { class: "g-seedling" })]));
    }
  });

  // Speak in Iran situations hang a glowing lantern along the wall.
  SPEAK.forEach((unit, k) => {
    if (!done.has(unit.id)) return;
    const x = 22 + k * 39.5;
    svg.append(
      s("g", { class: `g-lantern${fresh === unit.id ? " fresh-tile" : ""}`, transform: `translate(${x} 56)` }, [
        s("line", { x1: 0, y1: 0, x2: 0, y2: 7, class: "g-string" }),
        circle(0, 13, 9, { class: "g-glow" }),
        s("rect", { x: -3.5, y: 7, width: 7, height: 11, rx: 3, class: "g-lamp" }),
        s("rect", { x: -2, y: 6, width: 4, height: 2, class: "g-lamp-cap" }),
      ]),
    );
  });

  // the nightingale arrives when the path is complete
  if (done.has("l12")) svg.append(g(`g-bird${fresh === "l12" ? " fresh" : ""}`, 196, 52, nightingale()));
  return svg;
}
