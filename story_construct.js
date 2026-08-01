/* ──────────────────────────────────────────────────────────────────────────
   Pipeline Story — Acts 3–5 (candidate ranking → mRNA construct → manufacturing).
   These phases produce a *sequence*, not a 3-D structure, so the hero is a clean
   editorial mRNA construct track (cap · 5′UTR · epitope cassette · 3′UTR · polyA),
   with the through-line mutation as one neon epitope block. Act 3 ranks the
   candidates, Act 4 assembles + folds the construct, Act 5 sweeps it for hazards
   and clears it for manufacture. Tools stream into each act's infobox column.
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

  // ── Shared: draw the mRNA construct track, return its parts for animation ──
  function drawConstruct(scene, y) {
    const g = add(scene, "g", {});
    const H = 46, top = y - H / 2;
    const seg = (x, w, fill, op) => add(g, "rect", { x, y: top, width: w, height: H, rx: 7,
      fill, stroke: INK, "stroke-width": 1.4, opacity: op == null ? 1 : op });
    // 5' cap
    const cap = add(g, "circle", { cx: 96, cy: y, r: 15, fill: "#fff", stroke: INK, "stroke-width": 1.6 });
    mono(g, 96, y - 30, "cap");
    // 5' UTR
    const utr5 = seg(122, 132, GREY); mono(g, 188, top - 14, "5′UTR");
    // CDS cassette: 5 epitope blocks + GPGPG linkers
    const cdsX0 = 272, cdsX1 = 716, link = 9;
    const bw = (cdsX1 - cdsX0 - (CAS.length - 1) * link) / CAS.length;
    const blocks = [], linkers = [];
    for (let i = 0; i < CAS.length; i++) {
      const x = cdsX0 + i * (bw + link);
      blocks.push(seg(x, bw, CAS[i]));
      if (i < CAS.length - 1) linkers.push(add(g, "rect", { x: x + bw, y: y - 5, width: link, height: 10, fill: "#BBB7AF" }));
    }
    mono(g, (cdsX0 + cdsX1) / 2, top + H + 30, "CDS · epitope cassette (GPGPG-linked)");
    add(g, "text", { x: (cdsX0 + cdsX1) / 2, y: top - 14, "text-anchor": "middle", fill: NEON,
      "font-family": "JetBrains Mono, monospace", "font-size": 13, "letter-spacing": 1 }).textContent = "▲ the mutation";
    // 3' UTR
    const utr3 = seg(736, 108, GREY); mono(g, 790, top - 14, "3′UTR");
    // poly-A tail
    let d = "M 854 " + y; for (let i = 0; i < 7; i++) d += ` l 8 -9 l 8 9`;
    const polyA = add(g, "path", { d, fill: "none", stroke: INK, "stroke-width": 2.4, "stroke-linecap": "round" });
    mono(g, 905, top - 14, "AAAA");
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

  // ══ ACT 3 — candidate ranking ═════════════════════════════════════════════
  (function act3() {
    const scene = document.getElementById("scene3"); if (!scene) return;
    // a ranked shortlist of candidate peptides; the mutation rises to the top
    const rows = [
      { s: 0.94, mut: true,  seq: "…the mutation" },
      { s: 0.81, seq: "candidate B" }, { s: 0.73, seq: "candidate C" },
      { s: 0.62, seq: "candidate D" }, { s: 0.48, seq: "candidate E" },
      { s: 0.33, seq: "candidate F" },
    ];
    const x0 = 250, w = 460, y0 = 300, rh = 64;
    const bars = rows.map((r, i) => {
      const y = y0 + i * rh, c = r.mut ? NEON : "#9AA9C0";
      add(scene, "circle", { cx: x0 - 26, cy: y, r: 7, fill: c, stroke: INK, "stroke-width": 1 });
      add(scene, "rect", { x: x0, y: y - 13, width: w, height: 26, rx: 4, fill: "#EEEBE5", stroke: INK, "stroke-width": 1, opacity: 0.5 });
      const bar = add(scene, "rect", { x: x0, y: y - 13, width: 1, height: 26, rx: 4, fill: c, "data-w": w * r.s });
      mono(scene, x0 + w + 54, y + 5, r.s.toFixed(2), { fill: r.mut ? NEON : INK2, "font-size": 16 });
      const lab = add(scene, "text", { x: x0 - 44, y: y + 5, "text-anchor": "end", fill: r.mut ? INK : INK2,
        "font-family": "Source Serif 4, serif", "font-size": 16 }); lab.textContent = r.seq;
      return { bar, row: r, y };
    });
    mono(scene, x0 + w / 2, y0 - 56, "COMPOSITE PRIORITY SCORE", { fill: INK, "font-size": 14, "letter-spacing": 2 });
    const tag = add(scene, "g", { opacity: 0, id: "sel-tag" });
    add(tag, "rect", { x: x0 + w + 84, y: y0 - 13, width: 96, height: 26, rx: 13, fill: NEON });
    add(tag, "text", { x: x0 + w + 132, y: y0 + 5, "text-anchor": "middle", fill: "#fff",
      "font-family": "JetBrains Mono, monospace", "font-size": 12, "letter-spacing": 1.5 }).textContent = "SELECTED";

    const cards = buildFlow(3, "flow3");
    if (reduce || !window.gsap) { bars.forEach((b) => b.bar.setAttribute("width", b.bar.dataset.w));
      document.getElementById("sel-tag").setAttribute("opacity", 1);
      cards.forEach((c) => { c.style.opacity = 1; c.style.transform = "none"; }); return; }
    const t = tl("#act-3");
    bars.forEach((b, i) => t.fromTo(b.bar, { attr: { width: 1 } },
      { attr: { width: +b.bar.dataset.w }, duration: 0.08, ease: "power2.out" }, 0.06 + i * 0.03));
    t.to("#sel-tag", { opacity: 1, duration: 0.06 }, 0.5)
     .fromTo(bars[0].bar, { opacity: 1 }, { opacity: 0.55, yoyo: true, repeat: 1, duration: 0.06 }, 0.5);
    cards.forEach((c, i) => t.to(c, { opacity: 1, y: 0, duration: 0.06 }, 0.55 + i * 0.04));
    revealCaps(t, "#captions3 .caption"); lastCap(t, "#captions3 .caption", 0.62);
  })();

  // ══ ACT 4 — mRNA construct assembly + folding ═════════════════════════════
  (function act4() {
    const scene = document.getElementById("scene4"); if (!scene) return;
    const C = drawConstruct(scene, 470);
    // folding arcs beneath the CDS (stylised secondary structure)
    const arcs = add(scene, "g", { id: "fold-arcs", opacity: 0 });
    const ax0 = 290, ax1 = 700, ay = 560;
    const pairs = [[0, 9], [1, 7], [2, 6], [11, 16], [12, 15], [4, 5]];
    pairs.forEach(([a, b]) => { const span = 24;
      const xa = ax0 + a * span, xb = ax0 + b * span, r = (xb - xa) / 2;
      if (xb > ax1) return;
      add(arcs, "path", { d: `M ${xa} ${ay} A ${r} ${r} 0 0 1 ${xb} ${ay}`,
        fill: "none", stroke: "#9AA9C0", "stroke-width": 2 }); });
    mono(arcs, (ax0 + ax1) / 2, ay + 70, "predicted fold · stable MFE", { "font-size": 13 });

    const cards = buildFlow(4, "flow4");
    if (reduce || !window.gsap) { document.getElementById("fold-arcs").setAttribute("opacity", 1);
      cards.forEach((c) => { c.style.opacity = 1; c.style.transform = "none"; }); return; }
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
  })();

  // ══ ACT 5 — manufacturing QC ══════════════════════════════════════════════
  (function act5() {
    const scene = document.getElementById("scene5"); if (!scene) return;
    const C = drawConstruct(scene, 430);
    // scan head
    const scan = add(scene, "line", { id: "qc-scan", x1: 95, y1: 360, x2: 95, y2: 500,
      stroke: NEON, "stroke-width": 2.5, opacity: 0 });
    // QC clears popping along the track
    const flags = add(scene, "g", { id: "qc-flags", opacity: 0 });
    [200, 360, 520, 660, 790].forEach((x) => {
      add(flags, "circle", { cx: x, cy: 388, r: 8, fill: "#fff", stroke: PASS, "stroke-width": 1.6 });
      add(flags, "path", { d: `M ${x - 3.4} 388 l 2.6 3 l 4.4 -5.4`, fill: "none", stroke: PASS, "stroke-width": 1.8, "stroke-linecap": "round" });
    });
    // gates panel
    const gates = ["GC 0.50–0.70", "uridine → m1Ψ", "no restriction sites", "non-toxic", "IVT yield OK"];
    const gp = add(scene, "g", { id: "qc-gates", opacity: 0 });
    gates.forEach((label, i) => { const gy = 560 + i * 40, gx = 330;
      add(gp, "text", { x: gx, y: gy, fill: INK2, "font-family": "JetBrains Mono, monospace", "font-size": 15 }).textContent = label;
      const pill = add(gp, "g", {});
      add(pill, "rect", { x: gx + 250, y: gy - 15, width: 64, height: 22, rx: 11, fill: "rgba(47,125,95,.12)", stroke: PASS, "stroke-width": 1 });
      add(pill, "text", { x: gx + 282, y: gy, "text-anchor": "middle", fill: PASS,
        "font-family": "JetBrains Mono, monospace", "font-size": 12, "letter-spacing": 1.5 }).textContent = "PASS";
    });
    // cleared stamp
    const stamp = add(scene, "g", { id: "qc-stamp", opacity: 0 });
    add(stamp, "rect", { x: 330, y: 770, width: 340, height: 60, rx: 8, fill: "none", stroke: PASS, "stroke-width": 3 });
    add(stamp, "text", { x: 500, y: 808, "text-anchor": "middle", fill: PASS,
      "font-family": "JetBrains Mono, monospace", "font-size": 22, "letter-spacing": 3 }).textContent = "MANUFACTURING CLEARED";

    const cards = buildFlow(5, "flow5");
    if (reduce || !window.gsap) { ["qc-flags", "qc-gates", "qc-stamp"].forEach((id) => document.getElementById(id).setAttribute("opacity", 1));
      cards.forEach((c) => { c.style.opacity = 1; c.style.transform = "none"; }); return; }
    const t = tl("#act-5");
    const scanP = { x: 95 };
    t.to("#qc-scan", { opacity: 1, duration: 0.03 }, 0.08)
     .to(scanP, { x: 905, duration: 0.3, ease: "none",
        onUpdate: () => { const e = document.getElementById("qc-scan"); e.setAttribute("x1", scanP.x); e.setAttribute("x2", scanP.x); } }, 0.1)
     .to("#qc-flags", { opacity: 1, duration: 0.1 }, 0.24)
     .to("#qc-scan", { opacity: 0, duration: 0.04 }, 0.42)
     .to("#qc-gates", { opacity: 1, duration: 0.1 }, 0.5)
     .to("#qc-stamp", { opacity: 1, duration: 0.1, ease: "back.out(1.6)" }, 0.84);
    cards.forEach((c, i) => t.to(c, { opacity: 1, y: 0, duration: 0.06 }, 0.18 + i * 0.06));
    revealCaps(t, "#captions5 .caption"); lastCap(t, "#captions5 .caption", 0.82);
  })();
})();
