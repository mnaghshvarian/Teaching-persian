// Illuminated plates (tazhib) for the religious stories: lapis and gold, an
// arched niche, and a symbol of the story at its heart. No holy figure is
// ever drawn — only light, nature, architecture and calligraphy.

const NS = "http://www.w3.org/2000/svg";
let uid = 0;

function s(tag, attrs = {}, children = []) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  for (const c of children) if (c) el.append(c);
  return el;
}
const g = (attrs, children) => s("g", attrs, children);
const circle = (cx, cy, r, attrs = {}) => s("circle", { cx, cy, r, ...attrs });
const path = (d, attrs = {}) => s("path", { d, ...attrs });

/** An n-pointed star polygon. */
function star(cx, cy, outer, inner, points, attrs = {}) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return s("polygon", { points: pts.join(" "), ...attrs });
}

function crescent(cx, cy, r, fill, bg) {
  return g({}, [circle(cx, cy, r, { fill }), circle(cx + r * 0.38, cy - r * 0.12, r * 0.86, { fill: bg })]);
}

// ---------------------------------------------------------------- motifs
// Each draws into the niche (roughly x 70–230, y 120–320). `c` holds colours.

const MOTIFS = {
  kaaba: (c) => [
    crescent(196, 142, 13, c.gold, c.field),
    star(112, 140, 5, 2, 4, { fill: c.gold }),
    star(140, 128, 3.5, 1.4, 4, { fill: c.gold }),
    path("M70 300 Q150 288 230 300 L230 322 L70 322 Z", { fill: c.sand, opacity: 0.55 }),
    s("polygon", { points: "104,206 126,192 204,192 182,206", fill: "#3a3a3a" }),
    s("polygon", { points: "182,206 204,192 204,276 182,292", fill: "#222" }),
    s("rect", { x: 104, y: 206, width: 78, height: 86, fill: "#161616" }),
    s("rect", { x: 104, y: 222, width: 78, height: 9, fill: c.gold }),
    s("polygon", { points: "182,222 204,208 204,217 182,231", fill: c.gold }),
    path("M108 226 h70", { stroke: "#7a5a1a", "stroke-width": 0.8, "stroke-dasharray": "3 2" }),
    s("rect", { x: 160, y: 250, width: 14, height: 30, rx: 2, fill: c.gold }),
    path("M163 254 h8 M163 260 h8 M163 266 h8", { stroke: "#8a6420", "stroke-width": 0.8 }),
  ],

  caravan: (c) => {
    const camel = (x, y, k) =>
      path(
        "M5 30 C5 22 12 18 18 18 C22 8 32 8 36 18 C40 18 44 16 46 10 L50 4 C52 2 56 3 56 6 L54 9 C52 12 50 16 48 22 C48 26 47 30 46 32 L46 45 L43 45 L42 33 L36 34 L35 45 L32 45 L31 34 L20 34 L19 45 L16 45 L15 34 L12 34 L11 45 L8 45 L8 33 C6 33 5 32 5 30 Z",
        { fill: c.gold, transform: `translate(${x} ${y}) scale(${k})` },
      );
    return [
      circle(150, 160, 28, { fill: c.gold, opacity: 0.9 }),
      circle(150, 160, 40, { fill: c.gold, opacity: 0.15 }),
      path("M70 300 Q120 268 170 292 T230 282 L230 322 L70 322 Z", { fill: c.sand, opacity: 0.75 }),
      camel(78, 236, 1.05),
      camel(140, 226, 1.15),
      path("M206 296 C204 270 206 248 210 228", { stroke: "#7a5a2a", "stroke-width": 4, fill: "none", "stroke-linecap": "round" }),
      ...[-70, -30, 10, 50, 90].map((a) =>
        path("M210 228 q14 -10 30 -4", { stroke: "#4f8a55", "stroke-width": 3.5, fill: "none", "stroke-linecap": "round", transform: `rotate(${a} 210 228)` }),
      ),
    ];
  },

  lamp: (c) => [
    s("line", { x1: 150, y1: 122, x2: 150, y2: 168, stroke: c.gold, "stroke-width": 1.6 }),
    s("line", { x1: 150, y1: 122, x2: 124, y2: 176, stroke: c.gold, "stroke-width": 1.2 }),
    s("line", { x1: 150, y1: 122, x2: 176, y2: 176, stroke: c.gold, "stroke-width": 1.2 }),
    circle(150, 238, 74, { fill: "url(#glow)" }),
    ...Array.from({ length: 16 }, (_, i) => {
      const a = (i * Math.PI) / 8;
      return s("line", {
        x1: (150 + 50 * Math.cos(a)).toFixed(1),
        y1: (238 + 50 * Math.sin(a)).toFixed(1),
        x2: (150 + 78 * Math.cos(a)).toFixed(1),
        y2: (238 + 78 * Math.sin(a)).toFixed(1),
        stroke: c.gold,
        "stroke-width": i % 2 ? 1 : 2,
        opacity: 0.6,
      });
    }),
    path("M122 176 h56 l-6 10 c22 10 30 30 26 50 c-4 20 -20 32 -44 32 c-24 0 -40 -12 -44 -32 c-4 -20 4 -40 26 -50 Z", {
      fill: "rgba(255,240,205,0.28)",
      stroke: c.gold,
      "stroke-width": 2.5,
    }),
    path("M128 214 h44 M126 236 h48", { stroke: c.gold, "stroke-width": 1.4 }),
    ...[136, 150, 164].map((x) => circle(x, 225, 3, { fill: c.gold })),
    path("M150 262 c-7 -9 -6 -18 0 -26 c6 8 7 17 0 26 Z", { fill: "#ffd36b" }),
    path("M136 268 h28 l-4 10 h-20 Z", { fill: c.gold }),
  ],

  bread: (c) => [
    crescent(110, 150, 18, c.gold, c.field),
    ...[[160, 140], [190, 160], [210, 132], [178, 128]].map(([x, y]) => star(x, y, 4, 1.6, 4, { fill: c.gold })),
    path("M92 252 Q150 238 208 252 L198 302 Q150 314 102 302 Z", { fill: "#8a5a2b", stroke: c.gold, "stroke-width": 2 }),
    path("M100 266 Q150 256 200 266 M102 282 Q150 272 198 282", { stroke: "#c9973f", "stroke-width": 1.4, fill: "none" }),
    ...[[118, 240], [146, 234], [174, 238]].map(([x, y]) => s("ellipse", { cx: x, cy: y, rx: 18, ry: 11, fill: "#d9a066", stroke: "#a86f35", "stroke-width": 1.2 })),
    ...[[196, 246], [204, 252], [190, 254]].map(([x, y]) => s("ellipse", { cx: x, cy: y, rx: 4, ry: 6, fill: "#5a2e1a" })),
    path("M72 314 h156", { stroke: c.gold, "stroke-width": 1, opacity: 0.5 }),
  ],

  tulips: (c) => {
    const tulip = (x, y, h, k = 1) =>
      g({ transform: `translate(${x} ${y}) scale(${k})` }, [
        path(`M0 0 C2 -${h * 0.4} -2 -${h * 0.7} 0 -${h}`, { stroke: "#3f7a49", "stroke-width": 3, fill: "none" }),
        path(`M0 -${h * 0.35} q14 -10 18 -28 q-14 6 -18 20`, { fill: "#3f7a49" }),
        path(`M-12 -${h} q-2 -22 6 -30 q4 10 6 14 q2 -6 6 -14 q8 8 6 30 q-12 8 -24 0 Z`, { fill: "#c3283b", stroke: "#8a1626", "stroke-width": 1 }),
      ]);
    return [
      path("M70 296 q20 -8 40 0 t40 0 t40 0 t40 0", { stroke: "#7fb6d6", "stroke-width": 3, fill: "none" }),
      path("M70 310 q20 -8 40 0 t40 0 t40 0 t40 0", { stroke: "#7fb6d6", "stroke-width": 3, fill: "none", opacity: 0.7 }),
      tulip(150, 290, 120, 1.05),
      tulip(112, 292, 92),
      tulip(188, 292, 98),
      tulip(88, 294, 64, 0.8),
      tulip(212, 294, 70, 0.8),
    ];
  },

  deer: (c) => {
    // a doe in profile, facing right, about 96 × 88
    const doe = (x, y, k, flip = false) =>
      g({ transform: `translate(${x} ${y}) scale(${flip ? -k : k} ${k})` }, [
        path("M72 54 L74 76 L77 88 L72 88 L68 74 L66 56 Z M38 56 L39 72 L42 88 L37 88 L33 73 L32 56 Z", { fill: c.gold, opacity: 0.7, transform: "translate(5 0)" }),
        path(
          "M18 46 C14 40 16 34 24 32 C36 28 52 30 64 30 C70 24 74 14 78 8 L76 1 L81 6 L85 0 L84 8 C90 10 95 14 95 18 C93 21 88 21 84 20 C82 26 80 34 78 42 C78 47 76 51 73 53 L75 76 L78 88 L73 88 L69 74 L67 56 C58 58 44 58 36 56 L34 72 L37 88 L32 88 L28 73 L25 55 C21 53 19 50 18 46 Z",
          { fill: c.gold },
        ),
        path("M19 38 C13 35 11 40 14 45 Z", { fill: c.gold }),
        circle(86, 12, 1.6, { fill: c.field }),
      ]);
    return [
      // the golden dome and minarets of Mashhad, softly in the distance
      g({ opacity: 0.45 }, [
        path("M114 188 C114 152 132 138 150 120 C168 138 186 152 186 188 Z", { fill: c.gold }),
        s("line", { x1: 150, y1: 104, x2: 150, y2: 122, stroke: c.gold, "stroke-width": 2 }),
        circle(150, 104, 3, { fill: c.gold }),
        s("rect", { x: 108, y: 188, width: 84, height: 16, fill: c.gold }),
        s("rect", { x: 92, y: 140, width: 8, height: 64, fill: c.gold }),
        s("rect", { x: 200, y: 140, width: 8, height: 64, fill: c.gold }),
        s("rect", { x: 89, y: 150, width: 14, height: 4, fill: c.gold }),
        s("rect", { x: 197, y: 150, width: 14, height: 4, fill: c.gold }),
        path("M92 140 l4 -10 l4 10 Z M200 140 l4 -10 l4 10 Z", { fill: c.gold }),
      ]),
      path("M60 306 Q150 290 240 306 L240 330 L60 330 Z", { fill: "#3f7a49", opacity: 0.7 }),
      doe(78, 214, 1.05),
      doe(176, 262, 0.46),
      doe(196, 270, 0.42),
    ];
  },

  twelve: (c) => [
    circle(150, 228, 86, { fill: "none", stroke: c.gold, "stroke-width": 1, opacity: 0.6 }),
    ...Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6 - Math.PI / 2;
      return star(150 + 72 * Math.cos(a), 228 + 72 * Math.sin(a), 11, 5, 8, { fill: c.gold });
    }),
    star(150, 228, 44, 30, 12, { fill: c.gold }),
    star(150, 228, 30, 18, 12, { fill: c.field }),
    circle(150, 228, 12, { fill: c.gold }),
  ],

  stars: (c) => [
    circle(100, 150, 16, { fill: c.gold }),
    ...Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      return s("line", { x1: (100 + 20 * Math.cos(a)).toFixed(1), y1: (150 + 20 * Math.sin(a)).toFixed(1), x2: (100 + 27 * Math.cos(a)).toFixed(1), y2: (150 + 27 * Math.sin(a)).toFixed(1), stroke: c.gold, "stroke-width": 2 });
    }),
    crescent(202, 148, 14, c.gold, c.field),
    ...Array.from({ length: 11 }, (_, i) => {
      const a = Math.PI * (1.05 + (i * 0.9) / 10);
      return star(150 + 74 * Math.cos(a), 236 + 74 * Math.sin(a) * 0.62, 6, 2.4, 4, { fill: c.gold });
    }),
    s("ellipse", { cx: 150, cy: 262, rx: 36, ry: 9, fill: "#0a1530" }),
    path("M114 262 v38 q36 12 72 0 v-38", { fill: "#8f7f66", stroke: c.gold, "stroke-width": 1.5 }),
    path("M114 276 q36 10 72 0 M114 290 q36 10 72 0 M132 262 v40 M168 262 v40", { stroke: "#5e5140", "stroke-width": 1, fill: "none" }),
    s("ellipse", { cx: 150, cy: 262, rx: 36, ry: 9, fill: "none", stroke: c.gold, "stroke-width": 2 }),
  ],

  river: (c) => {
    const reed = (x, h, lean) => [
      path(`M${x} 312 q${lean} -${h / 2} ${lean * 1.5} -${h}`, { stroke: "#4f8a55", "stroke-width": 2.5, fill: "none" }),
      s("ellipse", { cx: x + lean * 1.5, cy: 312 - h + 6, rx: 3, ry: 9, fill: "#8a5a35" }),
    ];
    return [
      circle(190, 150, 14, { fill: c.gold, opacity: 0.9 }),
      ...[0, 1, 2, 3].map((k) => path(`M70 ${262 + k * 14} q20 -8 40 0 t40 0 t40 0 t40 0`, { stroke: "#8cc6e6", "stroke-width": 2.5, fill: "none", opacity: 1 - k * 0.18 })),
      path("M122 246 h56 l-6 18 h-44 Z", { fill: "#a87a3e", stroke: c.gold, "stroke-width": 2 }),
      path("M124 246 q26 -16 52 0", { fill: "#c9973f", stroke: c.gold, "stroke-width": 2 }),
      path("M130 254 h40", { stroke: c.gold, "stroke-width": 1 }),
      ...reed(80, 120, -4),
      ...reed(92, 96, 3),
      ...reed(208, 110, 4),
      ...reed(220, 130, -3),
    ];
  },

  fire: (c) => {
    const flame = (x, h, w, col) => path(`M${x} 314 c-${w} -${h * 0.3} -${w * 0.6} -${h * 0.7} 0 -${h} c${w * 0.6} ${h * 0.3} ${w} ${h * 0.7} 0 ${h} Z`, { fill: col });
    const rose = (x, y, r) =>
      g({}, [
        circle(x, y, r, { fill: "#d9476b" }),
        path(`M${x - r * 0.5} ${y} a${r * 0.5} ${r * 0.5} 0 1 1 ${r * 0.5} ${r * 0.5} a${r * 0.3} ${r * 0.3} 0 1 1 0 -${r * 0.6}`, { stroke: "#9a1f3f", "stroke-width": 1.4, fill: "none" }),
      ]);
    return [
      flame(110, 90, 22, "#e9622b"),
      flame(150, 130, 30, "#f08a2b"),
      flame(190, 96, 22, "#e9622b"),
      flame(150, 84, 16, "#ffd36b"),
      flame(126, 60, 12, "#ffd36b"),
      flame(174, 62, 12, "#ffd36b"),
      ...[[96, 168], [130, 150], [170, 148], [204, 170], [150, 128], [112, 132], [190, 128]].map(([x, y], i) =>
        g({}, [
          path(`M${x} ${y + 14} q-12 -4 -16 -14 q12 0 16 14 Z`, { fill: "#4f8a55" }),
          rose(x, y, i === 4 ? 12 : 9),
        ]),
      ),
    ];
  },

  ark: (c) => [
    crescent(196, 146, 12, c.gold, c.field),
    path("M150 240 l40 -54 l40 54 Z", { fill: "#5a6b8f", opacity: 0.55 }),
    path("M96 262 h112 l-14 26 h-84 Z", { fill: "#8a5a2b", stroke: c.gold, "stroke-width": 2 }),
    path("M100 268 h104", { stroke: c.gold, "stroke-width": 1.2 }),
    path("M122 262 v-26 l30 -18 l30 18 v26 Z", { fill: "#a87a3e", stroke: c.gold, "stroke-width": 1.6 }),
    s("rect", { x: 145, y: 240, width: 14, height: 22, fill: c.gold, opacity: 0.9 }),
    ...[0, 1, 2, 3].map((k) => path(`M70 ${290 + k * 9} q15 -8 30 0 t30 0 t30 0 t30 0 t30 0 t30 0`, { stroke: "#8cc6e6", "stroke-width": 2.5, fill: "none", opacity: 1 - k * 0.2 })),
  ],

  ant: (c) => {
    const wheat = (x, lean) =>
      g({}, [
        path(`M${x} 314 q${lean} -60 ${lean * 2} -120`, { stroke: c.gold, "stroke-width": 2, fill: "none" }),
        ...Array.from({ length: 6 }, (_, k) => {
          const yy = 214 - k * 12;
          const xx = x + lean * 2 * ((314 - yy) / 120);
          return g({}, [
            s("ellipse", { cx: xx - 5, cy: yy, rx: 3.2, ry: 6.5, fill: c.gold, transform: `rotate(-30 ${xx - 5} ${yy})` }),
            s("ellipse", { cx: xx + 5, cy: yy, rx: 3.2, ry: 6.5, fill: c.gold, transform: `rotate(30 ${xx + 5} ${yy})` }),
          ]);
        }),
      ]);
    return [
      wheat(90, 4),
      wheat(210, -4),
      path("M70 312 h160", { stroke: "#3f7a49", "stroke-width": 3 }),
      g({ fill: c.gold, transform: "translate(150 252)" }, [
        s("ellipse", { cx: -28, cy: -2, rx: 10, ry: 8.5 }),
        s("ellipse", { cx: -6, cy: 0, rx: 12, ry: 7 }),
        s("ellipse", { cx: 26, cy: 2, rx: 22, ry: 14 }),
        path("M-34 -8 q-10 -18 -22 -22 M-30 -10 q-2 -20 -12 -28", { stroke: c.gold, "stroke-width": 2.2, fill: "none", "stroke-linecap": "round" }),
        path("M-10 5 l-18 26 M-5 6 l-2 30 M0 5 l18 28 M-10 -5 l-20 -16 M-5 -6 l0 -20 M0 -5 l20 -14", { stroke: c.gold, "stroke-width": 2.6, "stroke-linecap": "round" }),
        circle(-31, -4, 2, { fill: c.field }),
      ]),
      ...[[112, 300], [190, 302], [150, 306]].map(([x, y]) => star(x, y, 5, 2, 5, { fill: "#f0b8c8" })),
    ];
  },

  fish: (c) => [
    crescent(110, 146, 12, c.gold, c.field),
    ...[0, 1, 2, 3].map((k) => path(`M70 ${268 + k * 12} q20 -8 40 0 t40 0 t40 0 t40 0`, { stroke: "#8cc6e6", "stroke-width": 2.5, fill: "none", opacity: 1 - k * 0.2 })),
    g({ transform: "translate(140 230) rotate(-8)" }, [
      s("ellipse", { cx: 0, cy: 0, rx: 58, ry: 26, fill: "#7aa7c9", stroke: c.gold, "stroke-width": 2 }),
      path("M54 0 l30 -24 q-6 24 0 48 Z", { fill: "#7aa7c9", stroke: c.gold, "stroke-width": 2 }),
      ...[-30, -12, 6, 24].map((x) => path(`M${x} -14 q8 14 0 28`, { stroke: c.gold, "stroke-width": 1.2, fill: "none" })),
      circle(-40, -6, 4, { fill: c.field }),
      path("M-58 4 q8 4 16 2", { stroke: c.field, "stroke-width": 2, fill: "none" }),
    ]),
    path("M188 314 q10 -40 34 -60", { stroke: "#3f7a49", "stroke-width": 3, fill: "none" }),
    ...[[200, 286], [214, 268], [222, 252]].map(([x, y]) => path(`M${x} ${y} c-14 -4 -16 -18 -4 -22 c6 6 10 12 4 22 Z`, { fill: "#4f8a55" })),
  ],

  palm: (c) => [
    star(196, 140, 9, 3.6, 8, { fill: c.gold }),
    path("M70 304 q20 -8 40 0 t40 0 t40 0 t40 0", { stroke: "#8cc6e6", "stroke-width": 3, fill: "none" }),
    path("M70 316 q20 -8 40 0 t40 0 t40 0 t40 0", { stroke: "#8cc6e6", "stroke-width": 3, fill: "none", opacity: 0.7 }),
    ...Array.from({ length: 9 }, (_, k) => s("rect", { x: 141 + (k % 2), y: 196 + k * 11, width: 14, height: 10, rx: 3, fill: "#8a5a2b", stroke: "#6a4220", "stroke-width": 1 })),
    ...[-80, -40, -10, 20, 55, 95, 140, 180, 210].map((a) =>
      path("M148 196 q30 -18 66 -6", { stroke: "#4f8a55", "stroke-width": 5, fill: "none", "stroke-linecap": "round", transform: `rotate(${a} 148 196)` }),
    ),
    ...[[134, 210], [162, 212], [140, 222], [158, 224], [148, 216], [128, 220], [168, 220]].map(([x, y]) => circle(x, y, 4, { fill: "#b8562b" })),
  ],

  // Taq-e Kasra at Mada'in, where Salman the Persian governed and rests
  arch: (c) => [
    crescent(204, 142, 11, c.gold, c.field),
    path("M70 306 q20 -7 40 0 t40 0 t40 0 t40 0", { stroke: "#8cc6e6", "stroke-width": 2.5, fill: "none", opacity: 0.8 }),
    path("M70 318 q20 -7 40 0 t40 0 t40 0 t40 0", { stroke: "#8cc6e6", "stroke-width": 2.5, fill: "none", opacity: 0.55 }),
    path("M74 298 V250 l7 -7 l6 6 l7 -9 V298 Z", { fill: "#b08a4a" }),
    path("M206 298 V238 h9 v-8 h8 v12 h5 V298 Z", { fill: "#b08a4a" }),
    path("M94 298 V214 C94 150 116 116 150 110 C184 116 206 150 206 214 V298 Z", { fill: "#c9a35b", stroke: c.gold, "stroke-width": 1.6 }),
    path("M114 298 V226 C114 170 128 144 150 138 C172 144 186 170 186 226 V298 Z", { fill: c.field }),
    ...[214, 232, 250, 268, 286].map((y) => path(`M94 ${y} h20 M186 ${y} h20`, { stroke: "#94733a", "stroke-width": 1 })),
    ...[[80, 262], [212, 252], [220, 270]].map(([x, y]) => s("rect", { x, y, width: 5, height: 9, rx: 2.5, fill: "#7a5a2a" })),
    path("M70 298 h160", { stroke: c.gold, "stroke-width": 1.5 }),
    star(150, 190, 6, 2.4, 8, { fill: c.gold }),
  ],

  // Rabadha: a lone tent under one bright star, for Abu Dharr the truthful
  tent: (c) => [
    circle(150, 156, 30, { fill: c.gold, opacity: 0.14 }),
    star(150, 156, 15, 5, 8, { fill: c.gold }),
    path("M70 286 Q120 260 170 282 T230 272 L230 330 L70 330 Z", { fill: c.sand, opacity: 0.8 }),
    path("M70 302 Q140 290 230 304 L230 330 L70 330 Z", { fill: "#a9813f", opacity: 0.85 }),
    path("M100 292 L150 232 L200 292 Z", { fill: "#5a3b22", stroke: c.gold, "stroke-width": 2 }),
    path("M150 232 L136 292 h28 Z", { fill: "#24170c" }),
    path("M150 232 v-12", { stroke: c.gold, "stroke-width": 2 }),
    path("M100 292 l-18 8 M200 292 l18 8", { stroke: c.gold, "stroke-width": 1.2 }),
    path("M204 292 c2 -22 0 -40 4 -56", { stroke: "#7a5a2a", "stroke-width": 3, fill: "none" }),
    ...[-60, -20, 20, 60].map((a) => path("M208 236 q12 -8 24 -2", { stroke: "#4f8a55", "stroke-width": 3, fill: "none", "stroke-linecap": "round", transform: `rotate(${a} 208 236)` })),
  ],

  // the open gate of Paradise — “your meeting place is Paradise”
  gate: (c) => [
    circle(150, 214, 72, { fill: "url(#glow)" }),
    path("M70 282 Q150 254 230 282 L230 330 L70 330 Z", { fill: "#3f7a49", opacity: 0.85 }),
    path("M150 262 c-9 -22 -9 -48 0 -76 c9 28 9 54 0 76 Z", { fill: "#2f6a45" }),
    path("M124 268 c-6 -14 -6 -30 0 -48 c6 18 6 34 0 48 Z M176 268 c-6 -14 -6 -30 0 -48 c6 18 6 34 0 48 Z", { fill: "#2f6a45", opacity: 0.85 }),
    path("M140 330 L146 262 h8 L160 330 Z", { fill: c.sand, opacity: 0.85 }),
    s("rect", { x: 94, y: 178, width: 16, height: 140, fill: c.gold }),
    s("rect", { x: 190, y: 178, width: 16, height: 140, fill: c.gold }),
    path("M98 182 C98 132 202 132 202 182", { fill: "none", stroke: c.gold, "stroke-width": 8 }),
    star(150, 146, 7, 3, 8, { fill: c.gold }),
    path("M110 194 L128 204 L128 306 L110 314 Z", { fill: "#8a5a2b", stroke: c.gold, "stroke-width": 1.5 }),
    path("M190 194 L172 204 L172 306 L190 314 Z", { fill: "#8a5a2b", stroke: c.gold, "stroke-width": 1.5 }),
    ...[[82, 304], [218, 306], [98, 318], [204, 320], [134, 296], [166, 298]].map(([x, y]) => star(x, y, 5, 2, 5, { fill: "#f0b8c8" })),
  ],

  // dawn over Karbala, the morning Hurr chose the light
  sunrise: (c) => [
    ...Array.from({ length: 13 }, (_, i) => {
      const a = Math.PI + (i * Math.PI) / 12;
      return s("line", { x1: (150 + 44 * Math.cos(a)).toFixed(1), y1: (276 + 44 * Math.sin(a)).toFixed(1), x2: (150 + 130 * Math.cos(a)).toFixed(1), y2: (276 + 130 * Math.sin(a)).toFixed(1), stroke: "#ffd36b", "stroke-width": i % 2 ? 1.2 : 2.4, opacity: 0.55 });
    }),
    path("M108 276 a42 42 0 0 1 84 0 Z", { fill: "#ffd36b" }),
    path("M70 276 h160 v54 H70 Z", { fill: "#c9a35b" }),
    path("M70 292 q20 -7 40 0 t40 0 t40 0 t40 0", { stroke: "#8cc6e6", "stroke-width": 2.5, fill: "none" }),
    path("M70 306 q20 -7 40 0 t40 0 t40 0 t40 0", { stroke: "#8cc6e6", "stroke-width": 2.5, fill: "none", opacity: 0.7 }),
    ...[[84, 276, 1], [214, 276, 0.85]].map(([x, y, k]) =>
      g({ transform: `translate(${x} ${y}) scale(${k})` }, [
        path("M0 0 c1 -20 -1 -40 2 -58", { stroke: "#5a3b22", "stroke-width": 3.5, fill: "none" }),
        ...[-70, -30, 10, 50, 90].map((a) => path("M2 -58 q12 -8 26 -3", { stroke: "#2f5a3a", "stroke-width": 3.5, fill: "none", "stroke-linecap": "round", transform: `rotate(${a} 2 -58)` })),
      ]),
    ),
  ],

  // a turquoise tasbih: 33 beads, for the little prayers said every day
  beads: (c) => [
    crescent(202, 140, 11, c.gold, c.field),
    ...Array.from({ length: 33 }, (_, i) => {
      const a = (i / 33) * 2 * Math.PI - Math.PI / 2;
      return circle((150 + 60 * Math.cos(a)).toFixed(1), (212 + 60 * Math.sin(a)).toFixed(1), 5.4, { fill: i % 11 === 0 ? "#f6dc95" : "#3aa6a0", stroke: c.gold, "stroke-width": 0.8 });
    }),
    star(150, 212, 18, 8, 8, { fill: c.gold }),
    circle(150, 212, 5, { fill: c.field }),
    path("M150 272 v18", { stroke: c.gold, "stroke-width": 2 }),
    circle(150, 292, 5, { fill: "#3aa6a0", stroke: c.gold, "stroke-width": 0.8 }),
    path("M144 297 h12 l5 24 h-22 Z", { fill: c.gold }),
    ...[0, 1, 2, 3, 4].map((k) => path(`M${141 + k * 4.5} 321 v8`, { stroke: c.gold, "stroke-width": 1.2 })),
  ],
};

const PALETTE = {
  night: { field: "#13285c", field2: "#1d3c7c" },
  dusk: { field: "#2a2353", field2: "#4a2f5f" },
  sea: { field: "#0f3a52", field2: "#1d5a72" },
  garden: { field: "#173d3a", field2: "#24605a" },
  dawn: { field: "#2c2350", field2: "#b65a45" },
};
const MOTIF_SKY = { kaaba: "night", caravan: "dusk", lamp: "night", bread: "night", tulips: "dusk", deer: "garden", twelve: "night", stars: "night", river: "sea", fire: "dusk", ark: "sea", ant: "garden", fish: "sea", palm: "garden", arch: "dusk", tent: "night", gate: "garden", sunrise: "dawn", beads: "night" };

/** Build an illuminated plate. `title` is the Persian title for the cartouche. */
export function plateSvg(motif, title = "") {
  const id = `p${++uid}`;
  const sky = PALETTE[MOTIF_SKY[motif] ?? "night"];
  const c = { gold: `url(#${id}-gold)`, field: sky.field, sand: "#c9a35b" };
  const gold = (x) => x.replaceAll("url(#gold)", c.gold);

  const svg = s("svg", { viewBox: "0 0 300 400", class: "plate-svg", role: "img", "aria-label": `Illuminated plate: ${title}` });
  svg.append(
    s("defs", {}, [
      s("linearGradient", { id: `${id}-gold`, x1: 0, y1: 0, x2: 1, y2: 1 }, [
        s("stop", { offset: "0", "stop-color": "#f6dc95" }),
        s("stop", { offset: "0.5", "stop-color": "#c9973f" }),
        s("stop", { offset: "1", "stop-color": "#f1d07c" }),
      ]),
      s("linearGradient", { id: `${id}-sky`, x1: 0, y1: 0, x2: 0, y2: 1 }, [
        s("stop", { offset: "0", "stop-color": sky.field }),
        s("stop", { offset: "1", "stop-color": sky.field2 }),
      ]),
      s("radialGradient", { id: "glow" }, [s("stop", { offset: "0", "stop-color": "#ffe9a8", "stop-opacity": "0.55" }), s("stop", { offset: "1", "stop-color": "#ffe9a8", "stop-opacity": "0" })]),
    ]),
  );

  // parchment, gold rules and the lapis border with little gold flowers
  svg.append(s("rect", { x: 0, y: 0, width: 300, height: 400, fill: "#efe2c4" }));
  svg.append(s("rect", { x: 8, y: 8, width: 284, height: 384, fill: "none", stroke: c.gold, "stroke-width": 3 }));
  svg.append(s("rect", { x: 14, y: 14, width: 272, height: 372, fill: "#1b3a7a" }));
  for (let x = 24; x <= 276; x += 18) {
    for (const y of [21, 379]) svg.append(star(x, y, 4, 1.6, 4, { fill: c.gold }));
  }
  for (let y = 39; y <= 361; y += 18) {
    for (const x of [21, 279]) svg.append(star(x, y, 4, 1.6, 4, { fill: c.gold }));
  }
  svg.append(s("rect", { x: 28, y: 28, width: 244, height: 344, fill: "#efe2c4", stroke: c.gold, "stroke-width": 2 }));

  // the arched niche (mihrab shape) and gold arabesque in the spandrels
  const arch = "M60 336 V150 C60 110 108 92 150 62 C192 92 240 110 240 150 V336 Z";
  svg.append(path(arch, { fill: `url(#${id}-sky)` }));
  for (const [x, y] of [[44, 50], [256, 50]]) {
    svg.append(circle(x, y, 9, { fill: c.gold }));
    svg.append(circle(x, y, 4, { fill: "#1b3a7a" }));
  }
  svg.append(path("M34 92 C50 70 70 64 92 62 C76 76 66 88 60 108 Z", { fill: c.gold, opacity: 0.85 }));
  svg.append(path("M266 92 C250 70 230 64 208 62 C224 76 234 88 240 108 Z", { fill: c.gold, opacity: 0.85 }));
  svg.append(star(150, 46, 9, 4, 8, { fill: c.gold }));

  // a sprinkling of tiny stars in the niche's sky
  for (const [x, y] of [[84, 176], [218, 186], [96, 128], [204, 120], [78, 222], [224, 230], [150, 100]]) {
    svg.append(star(x, y, 2.6, 1, 4, { fill: "#f6dc95", opacity: 0.7 }));
  }

  // the story's symbol, clipped to the niche
  const clip = s("clipPath", { id: `${id}-clip` }, [path(arch)]);
  svg.querySelector("defs").append(clip);
  const motifGroup = g({ "clip-path": `url(#${id}-clip)` }, (MOTIFS[motif] ?? MOTIFS.lamp)(c));
  svg.append(motifGroup);
  svg.append(path(arch, { fill: "none", stroke: c.gold, "stroke-width": 3 }));
  svg.append(path("M66 336 V152 C66 116 110 99 150 70 C190 99 234 116 234 152 V336", { fill: "none", stroke: c.gold, "stroke-width": 0.8, opacity: 0.8 }));

  // the title cartouche
  svg.append(s("rect", { x: 46, y: 342, width: 208, height: 24, rx: 12, fill: "#1b3a7a", stroke: c.gold, "stroke-width": 1.6 }));
  if (title) {
    svg.append(
      s("text", { x: 150, y: 359, "text-anchor": "middle", fill: "#f6dc95", "font-size": 12.5, "font-family": "Vazirmatn, sans-serif", direction: "rtl" }, [
        document.createTextNode(title),
      ]),
    );
  }
  void gold;
  return svg;
}

export const PLATE_MOTIFS = Object.keys(MOTIFS);
