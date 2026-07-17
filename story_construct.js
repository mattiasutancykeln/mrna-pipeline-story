/* ──────────────────────────────────────────────────────────────────────────
   Pipeline Story — Acts 3–5 (candidate ranking → mRNA construct → manufacturing).
   These phases produce a *sequence*, not a 3-D structure, so the hero is a clean
   editorial mRNA construct track (cap · 5′UTR · epitope cassette · 3′UTR · polyA),
   with the through-line mutation as one neon epitope block. Act 3 ranks the
   candidates, Act 4 assembles + folds the construct, Act 5 sweeps it for hazards
   and clears it for manufacture. Tools stream into each act's infobox column.

   Two geometries, one drawing pass. These scenes are wide and short — a 1000-unit
   track labelled at 15 units. Across a desk that lands the labels at ~12px; in one
   column the same scene is drawn 343px wide (88vmin) and they collapse to ~5px,
   which is why the phone build read as a postage stamp in a field of paper. WIDE
   is the desktop composition, untouched. TALL redraws the same scene into a
   460-unit box — the labels keep their 15-unit size, so relative to the box they
   roughly double and land back at ~12px. Only the geometry changes; no scene is
   dropped or simplified away on a phone.

   The viewBox keeps x at 0…L.W and crops only its *height* to the drawn content
   (fitViewBox), so the horizontal mapping — and therefore the desktop scale — is
   exactly what it always was, minus the dead vertical space that used to stop the
   scene being sized off its width.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";
  const DATA = window.STORY_DATA || { acts: [] };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SVGNS = "http://www.w3.org/2000/svg";
  const INK = "#111", NEON = "#FF2E88", GREY = "#D7D4CF", INK2 = "#6B6B66";
  const PASS = "#2F7D5F";
  const CAS = ["#7088A3", "#5E8B7E", "#FF2E88", "#E09F3E", "#C87C5E"];   // epitope blocks; [2] = mutation (neon)
  const MUT_BLOCK = 2;
  const el = (t, a) => { const e = document.createElementNS(SVGNS, t);
    for (const k in a) e.setAttribute(k, a[k]); return e; };
  const add = (p, t, a) => { const e = el(t, a); p.appendChild(e); return e; };
  const mono = (p, x, y, txt, opts) => { const t = add(p, "text", Object.assign(
    { x, y, "text-anchor": "middle", fill: INK2, "font-family": "JetBrains Mono, monospace",
      "font-size": 15, "letter-spacing": 1 }, opts || {})); t.textContent = txt; return t; };
  const actOf = (id) => DATA.acts.find((a) => a.id === id) || { hotspots: [], tag: "" };

  // ── The two geometries ────────────────────────────────────────────────────
  // Same drawing code, same label sizes; only the box and the x-coordinates move.
  const WIDE = {
    W: 1000, tall: false,
    // construct track (acts 4–5)
    cap: 96, capR: 15, u5: 122, u5w: 132, cds0: 272, cds1: 716, link: 9, H: 46,
    u3: 736, u3w: 108, pa: 854, tooth: 8, teeth: 7, paLab: 905,
    cdsLab: "CDS · epitope cassette (GPGPG-linked)",
    // act 3 — ranked shortlist
    rx: 250, rw: 460, rh: 64, dotDX: -26, labDX: -44, scoreDX: 54, pillDX: 84, pillW: 96,
    // act 4 — fold arcs
    ax0: 290, ax1: 700, aspan: 24, ay: 560,
    // act 5 — scan / flags / gates / stamp
    scanA: 95, scanB: 905, flags: [200, 360, 520, 660, 790],
    gx: 330, gy0: 560, gGap: 40, gPillDX: 250,
    stampX: 330, stampY: 770, stampW: 340, stampH: 60, stampF: 22,
  };
  const TALL = {
    W: 460, tall: true,
    cap: 40, capR: 12, u5: 56, u5w: 56, cds0: 122, cds1: 312, link: 5, H: 40,
    u3: 324, u3w: 46, pa: 380, tooth: 5, teeth: 7, paLab: 415,
    cdsLab: "CDS · cassette",                    // the long form overruns a 460-unit box
    rx: 140, rw: 180, rh: 64, dotDX: -16, labDX: -32, scoreDX: 26, pillDX: 56, pillW: 84,
    // an arc's height is half its span, so squeezing x shrinks the arcs but not
    // the label they arch over — drop them clear of it rather than through it
    ax0: 145, ax1: 355, aspan: 13, ay: 605,
    // pulled tight vertically: the portrait band between the tool strip and the
    // narrative is ~480px, and a scene taller than that runs under the scrim
    scanA: 30, scanB: 450, flags: [80, 145, 210, 275, 340],
    gx: 25, gy0: 530, gGap: 40, gPillDX: 335,
    stampX: 40, stampY: 740, stampW: 380, stampH: 64, stampF: 22,
  };
  // Where the scene has to live in a small box: one column (width-bound), or a
  // squat landscape viewport, where the scene has to fit *between* the narrative
  // and the tool column and gets ~380px rather than the ~790px a desk gives it.
  // Both cases want the compact geometry and a viewBox cropped to the content.
  // A roomy desktop is neither — it keeps the square box it has always had.
  const COMPACT_Q = window.matchMedia(
    "(max-width: 1023px) and (orientation: portrait)," +
    "(orientation: landscape) and (max-height: 620px)");

  // Crop the viewBox to the drawn content, height only — x stays 0…W so the
  // horizontal scale is untouched. Only where the box is constrained: `.stage`
  // centres the *box*, so cropping it anywhere else would silently lift the whole
  // scene off the composition it was drawn for.
  function fitViewBox(svgId, scene, L) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    if (!COMPACT_Q.matches) { svg.setAttribute("viewBox", `0 0 ${L.W} ${L.W}`); return; }
    let bb; try { bb = scene.getBBox(); } catch (e) { return; }
    if (!bb || !bb.height) return;
    const pad = 26;
    svg.setAttribute("viewBox",
      `0 ${Math.floor(bb.y - pad)} ${L.W} ${Math.ceil(bb.height + pad * 2)}`);
  }

  // ── Shared: draw the mRNA construct track, return its parts for animation ──
  function drawConstruct(scene, y, L) {
    const g = add(scene, "g", {});
    const H = L.H, top = y - H / 2;
    const seg = (x, w, fill, op) => add(g, "rect", { x, y: top, width: w, height: H, rx: 7,
      fill, stroke: INK, "stroke-width": 1.4, opacity: op == null ? 1 : op });
    // 5' cap
    const cap = add(g, "circle", { cx: L.cap, cy: y, r: L.capR, fill: "#fff", stroke: INK, "stroke-width": 1.6 });
    mono(g, L.cap, y - 30, "cap");
    // 5' UTR
    const utr5 = seg(L.u5, L.u5w, GREY); mono(g, L.u5 + L.u5w / 2, top - 14, "5′UTR");
    // CDS cassette: 5 epitope blocks + GPGPG linkers
    const cdsX0 = L.cds0, cdsX1 = L.cds1, link = L.link;
    const bw = (cdsX1 - cdsX0 - (CAS.length - 1) * link) / CAS.length;
    const blocks = [], linkers = [];
    for (let i = 0; i < CAS.length; i++) {
      const x = cdsX0 + i * (bw + link);
      blocks.push(seg(x, bw, CAS[i]));
      if (i < CAS.length - 1) linkers.push(add(g, "rect", { x: x + bw, y: y - 5, width: link, height: 10, fill: "#BBB7AF" }));
    }
    mono(g, (cdsX0 + cdsX1) / 2, top + H + 30, L.cdsLab);
    add(g, "text", { x: (cdsX0 + cdsX1) / 2, y: top - 14, "text-anchor": "middle", fill: NEON,
      "font-family": "JetBrains Mono, monospace", "font-size": 13, "letter-spacing": 1 }).textContent = "▲ the mutation";
    // 3' UTR
    const utr3 = seg(L.u3, L.u3w, GREY); mono(g, L.u3 + L.u3w / 2, top - 14, "3′UTR");
    // poly-A tail
    let d = "M " + L.pa + " " + y;
    for (let i = 0; i < L.teeth; i++) d += ` l ${L.tooth} -9 l ${L.tooth} 9`;
    const polyA = add(g, "path", { d, fill: "none", stroke: INK, "stroke-width": 2.4, "stroke-linecap": "round" });
    mono(g, L.paLab, top - 14, "AAAA");
    return { g, cap, utr5, blocks, linkers, utr3, polyA,
      parts: [cap, utr5, ...linkers, ...blocks, utr3, polyA] };
  }

  // ── Context bar + rail for acts 3–5 ───────────────────────────────────────
  const CTX = {
    3: ["Phase 2 / 5 · Candidate ranking", "Composite priority · Müller 2023"],
    4: ["Phases 3–4 / 5 · Sequence design", "Targets: CAI · GC · MFE"],
    5: ["Phase 5 / 5 · Manufacturing QC", "Hazard · degradation · yield"],
  };
  const railObs = new IntersectionObserver((es) => {
    es.forEach((e) => { if (!e.isIntersecting) return;
      const act = +e.target.id.split("-")[1];
      document.querySelectorAll(".rail .dot").forEach((d) => d.classList.toggle("on", +d.dataset.act === act));
      const ph = document.getElementById("ctx-phase"), co = document.getElementById("ctx-cohort");
      if (ph && CTX[act]) ph.textContent = CTX[act][0];
      if (co && CTX[act]) co.textContent = CTX[act][1];
    });
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
  ["act-3", "act-4", "act-5"].forEach((id) => { const s = document.getElementById(id); if (s) railObs.observe(s); });

  // ── Flow helper: build the tool column for an act ─────────────────────────
  function buildFlow(actId, flowId) {
    const host = document.getElementById(flowId);
    if (host) host.textContent = "";                 // rebuild-safe: never stack duplicates
    const a = actOf(actId);
    const flow = window.StoryFlow(flowId, a.tag);
    return a.hotspots.map((h) => flow.add(h));
  }

  const tl = (trigger) => gsap.timeline({ scrollTrigger: {
    trigger, start: "top top", end: "bottom bottom", scrub: 1 } });
  const revealCaps = (t, sel) => Array.from(document.querySelectorAll(sel)).forEach((cap) => {
    const at = parseFloat(cap.dataset.at);
    t.to(cap, { opacity: 1, y: 0, duration: 0.06 }, Math.max(0, at - 0.04))
     .to(cap, { opacity: 0, y: -10, duration: 0.06 }, at + 0.2);
  });
  const lastCap = (t, sel, at) => { const c = document.querySelectorAll(sel);
    t.to(c[c.length - 1], { opacity: 1, y: 0, duration: 0.05 }, at); };
  // Each act returns its teardown, so a portrait/landscape flip can redraw cleanly.
  const teardown = (t, scene) => () => {
    if (t) { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); }
    if (scene) scene.textContent = "";
  };

  // ══ ACT 3 — candidate ranking ═════════════════════════════════════════════
  function act3(L) {
    const scene = document.getElementById("scene3"); if (!scene) return null;
    // a ranked shortlist of candidate peptides; the mutation rises to the top
    const rows = [
      { s: 0.94, mut: true,  seq: "…the mutation" },
      { s: 0.81, seq: "candidate B" }, { s: 0.73, seq: "candidate C" },
      { s: 0.62, seq: "candidate D" }, { s: 0.48, seq: "candidate E" },
      { s: 0.33, seq: "candidate F" },
    ];
    const x0 = L.rx, w = L.rw, y0 = 300, rh = L.rh;
    const bars = rows.map((r, i) => {
      const y = y0 + i * rh, c = r.mut ? NEON : "#9AA9C0";
      add(scene, "circle", { cx: x0 + L.dotDX, cy: y, r: 7, fill: c, stroke: INK, "stroke-width": 1 });
      add(scene, "rect", { x: x0, y: y - 13, width: w, height: 26, rx: 4, fill: "#EEEBE5", stroke: INK, "stroke-width": 1, opacity: 0.5 });
      const bar = add(scene, "rect", { x: x0, y: y - 13, width: 1, height: 26, rx: 4, fill: c, "data-w": w * r.s });
      mono(scene, x0 + w + L.scoreDX, y + 5, r.s.toFixed(2), { fill: r.mut ? NEON : INK2, "font-size": 16 });
      const lab = add(scene, "text", { x: x0 + L.labDX, y: y + 5, "text-anchor": "end", fill: r.mut ? INK : INK2,
        "font-family": "Source Serif 4, serif", "font-size": 16 }); lab.textContent = r.seq;
      return { bar, row: r, y };
    });
    mono(scene, x0 + w / 2, y0 - 56, "COMPOSITE PRIORITY SCORE", { fill: INK, "font-size": 14, "letter-spacing": 2 });
    const tag = add(scene, "g", { opacity: 0, id: "sel-tag" });
    add(tag, "rect", { x: x0 + w + L.pillDX, y: y0 - 13, width: L.pillW, height: 26, rx: 13, fill: NEON });
    add(tag, "text", { x: x0 + w + L.pillDX + L.pillW / 2, y: y0 + 5, "text-anchor": "middle", fill: "#fff",
      "font-family": "JetBrains Mono, monospace", "font-size": 12, "letter-spacing": 1.5 }).textContent = "SELECTED";
    fitViewBox("stage3-svg", scene, L);

    const cards = buildFlow(3, "flow3");
    if (reduce || !window.gsap) { bars.forEach((b) => b.bar.setAttribute("width", b.bar.dataset.w));
      document.getElementById("sel-tag").setAttribute("opacity", 1);
      cards.forEach((c) => { c.style.opacity = 1; c.style.transform = "none"; });
      return teardown(null, scene); }
    const t = tl("#act-3");
    bars.forEach((b, i) => t.fromTo(b.bar, { attr: { width: 1 } },
      { attr: { width: +b.bar.dataset.w }, duration: 0.08, ease: "power2.out" }, 0.06 + i * 0.03));
    t.to("#sel-tag", { opacity: 1, duration: 0.06 }, 0.5)
     .fromTo(bars[0].bar, { opacity: 1 }, { opacity: 0.55, yoyo: true, repeat: 1, duration: 0.06 }, 0.5);
    cards.forEach((c, i) => t.to(c, { opacity: 1, y: 0, duration: 0.06 }, 0.55 + i * 0.04));
    revealCaps(t, "#captions3 .caption"); lastCap(t, "#captions3 .caption", 0.62);
    return teardown(t, scene);
  }

  // ══ ACT 4 — mRNA construct assembly + folding ═════════════════════════════
  function act4(L) {
    const scene = document.getElementById("scene4"); if (!scene) return null;
    const C = drawConstruct(scene, 470, L);
    // folding arcs beneath the CDS (stylised secondary structure)
    const arcs = add(scene, "g", { id: "fold-arcs", opacity: 0 });
    const ax0 = L.ax0, ax1 = L.ax1, ay = L.ay;
    const pairs = [[0, 9], [1, 7], [2, 6], [11, 16], [12, 15], [4, 5]];
    pairs.forEach(([a, b]) => { const span = L.aspan;
      const xa = ax0 + a * span, xb = ax0 + b * span, r = (xb - xa) / 2;
      if (xb > ax1) return;
      add(arcs, "path", { d: `M ${xa} ${ay} A ${r} ${r} 0 0 1 ${xb} ${ay}`,
        fill: "none", stroke: "#9AA9C0", "stroke-width": 2 }); });
    mono(arcs, (ax0 + ax1) / 2, ay + 70, "predicted fold · stable MFE", { "font-size": 13 });
    fitViewBox("stage4-svg", scene, L);

    const cards = buildFlow(4, "flow4");
    if (reduce || !window.gsap) { document.getElementById("fold-arcs").setAttribute("opacity", 1);
      cards.forEach((c) => { c.style.opacity = 1; c.style.transform = "none"; });
      return teardown(null, scene); }
    // assemble the parts left-to-right
    const parts = C.parts;
    gsap.set(parts, { opacity: 0 });
    const t = tl("#act-4");
    parts.forEach((p, i) => t.to(p, { opacity: 1, duration: 0.04 }, 0.12 + i * (0.34 / parts.length)));
    // highlight the mutation block
    t.fromTo(C.blocks[MUT_BLOCK], { opacity: 1 }, { opacity: 0.5, yoyo: true, repeat: 1, duration: 0.08 }, 0.5);
    t.to("#fold-arcs", { opacity: 1, duration: 0.08 }, 0.72);
    cards.forEach((c, i) => t.to(c, { opacity: 1, y: 0, duration: 0.05 }, 0.2 + i * 0.05));
    revealCaps(t, "#captions4 .caption"); lastCap(t, "#captions4 .caption", 0.74);
    return teardown(t, scene);
  }

  // ══ ACT 5 — manufacturing QC ══════════════════════════════════════════════
  function act5(L) {
    const scene = document.getElementById("scene5"); if (!scene) return null;
    const y = 430;
    const C = drawConstruct(scene, y, L);
    // scan head
    const scan = add(scene, "line", { id: "qc-scan", x1: L.scanA, y1: y - 70, x2: L.scanA, y2: y + 70,
      stroke: NEON, "stroke-width": 2.5, opacity: 0 });
    // QC clears popping along the track
    const flags = add(scene, "g", { id: "qc-flags", opacity: 0 });
    L.flags.forEach((x) => {
      add(flags, "circle", { cx: x, cy: y - 42, r: 8, fill: "#fff", stroke: PASS, "stroke-width": 1.6 });
      add(flags, "path", { d: `M ${x - 3.4} ${y - 42} l 2.6 3 l 4.4 -5.4`, fill: "none", stroke: PASS, "stroke-width": 1.8, "stroke-linecap": "round" });
    });
    // gates panel
    const gates = ["GC 0.50–0.70", "uridine → m1Ψ", "no restriction sites", "non-toxic", "IVT yield OK"];
    const gp = add(scene, "g", { id: "qc-gates", opacity: 0 });
    gates.forEach((label, i) => { const gy = L.gy0 + i * L.gGap, gx = L.gx;
      add(gp, "text", { x: gx, y: gy, fill: INK2, "font-family": "JetBrains Mono, monospace", "font-size": 15 }).textContent = label;
      const pill = add(gp, "g", {});
      add(pill, "rect", { x: gx + L.gPillDX, y: gy - 15, width: 64, height: 22, rx: 11, fill: "rgba(47,125,95,.12)", stroke: PASS, "stroke-width": 1 });
      add(pill, "text", { x: gx + L.gPillDX + 32, y: gy, "text-anchor": "middle", fill: PASS,
        "font-family": "JetBrains Mono, monospace", "font-size": 12, "letter-spacing": 1.5 }).textContent = "PASS";
    });
    // cleared stamp
    const stampY = L.stampY;
    const stamp = add(scene, "g", { id: "qc-stamp", opacity: 0 });
    add(stamp, "rect", { x: L.stampX, y: stampY, width: L.stampW, height: L.stampH, rx: 8, fill: "none", stroke: PASS, "stroke-width": 3 });
    add(stamp, "text", { x: L.stampX + L.stampW / 2, y: stampY + L.stampH * 0.64, "text-anchor": "middle", fill: PASS,
      "font-family": "JetBrains Mono, monospace", "font-size": L.stampF, "letter-spacing": 3 }).textContent = "MANUFACTURING CLEARED";
    fitViewBox("stage5-svg", scene, L);

    const cards = buildFlow(5, "flow5");
    if (reduce || !window.gsap) { ["qc-flags", "qc-gates", "qc-stamp"].forEach((id) => document.getElementById(id).setAttribute("opacity", 1));
      cards.forEach((c) => { c.style.opacity = 1; c.style.transform = "none"; });
      return teardown(null, scene); }
    const t = tl("#act-5");
    const scanP = { x: L.scanA };
    t.to("#qc-scan", { opacity: 1, duration: 0.03 }, 0.08)
     .to(scanP, { x: L.scanB, duration: 0.3, ease: "none",
        onUpdate: () => { const e = document.getElementById("qc-scan"); e.setAttribute("x1", scanP.x); e.setAttribute("x2", scanP.x); } }, 0.1)
     .to("#qc-flags", { opacity: 1, duration: 0.1 }, 0.24)
     .to("#qc-scan", { opacity: 0, duration: 0.04 }, 0.42)
     .to("#qc-gates", { opacity: 1, duration: 0.1 }, 0.5)
     .to("#qc-stamp", { opacity: 1, duration: 0.1, ease: "back.out(1.6)" }, 0.84);
    cards.forEach((c, i) => t.to(c, { opacity: 1, y: 0, duration: 0.06 }, 0.18 + i * 0.06));
    revealCaps(t, "#captions5 .caption"); lastCap(t, "#captions5 .caption", 0.82);
    return teardown(t, scene);
  }

  // ── Build, and rebuild only when the viewport really changes shape ────────
  // matchMedia fires on the flip itself, never on the URL-bar resizes a phone
  // emits all the way down a scroll — so the scenes are redrawn when the shape
  // of the viewport genuinely changes, and not once otherwise.
  let kills = [];
  function buildAll() {
    const L = COMPACT_Q.matches ? TALL : WIDE;
    document.documentElement.classList.toggle("compact-scene", L.tall);
    kills = [act3(L), act4(L), act5(L)].filter(Boolean);
  }
  buildAll();
  const relayout = () => {
    kills.forEach((k) => k()); kills = [];
    buildAll();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  };
  if (COMPACT_Q.addEventListener) COMPACT_Q.addEventListener("change", relayout);
  else if (COMPACT_Q.addListener) COMPACT_Q.addListener(relayout);    // older WebKit
})();
