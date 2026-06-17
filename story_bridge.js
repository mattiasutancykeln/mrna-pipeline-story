/* ──────────────────────────────────────────────────────────────────────────
   story_bridge.js — the through-line. We follow ONE mutation the whole way, so
   the scenes must hand it off physically rather than cut. This overlay owns a
   single persistent mutation token (a neon dot) and an mRNA ribbon that span
   the seams between the big set-pieces:

     Seam A  DNA variant ──(transcription)──▶ protein residue
             the red base detaches, an mRNA strand spools out and reels into
             the protein materialising at the centre, where the same mutation
             is already painted red.

   Positions come from window.STORY_ANCHORS (exposed by story.js / story_act2.js)
   in viewport coordinates, so the token tracks the real structures on screen.
   Driven by one global ScrollTrigger spanning both acts.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";
  if (!window.gsap || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const A = window.STORY_ANCHORS || {};
  const NS = "http://www.w3.org/2000/svg";

  // overlay layers (fixed, full-viewport)
  const svg = document.createElementNS(NS, "svg");
  svg.id = "bridge";
  const ribbon = document.createElementNS(NS, "path");
  ribbon.setAttribute("fill", "none");
  ribbon.setAttribute("stroke", "#E0A03E");          // single-stranded RNA → amber, distinct from the blue DNA
  ribbon.setAttribute("stroke-width", "3");
  ribbon.setAttribute("stroke-linecap", "round");
  ribbon.setAttribute("opacity", "0");
  const ticks = document.createElementNS(NS, "path"); // base ticks along the strand
  ticks.setAttribute("fill", "none");
  ticks.setAttribute("stroke", "#C98A2E");
  ticks.setAttribute("stroke-width", "1.4");
  ticks.setAttribute("opacity", "0");
  svg.appendChild(ribbon); svg.appendChild(ticks);
  document.body.appendChild(svg);

  const tag = document.createElement("div");
  tag.id = "bridge-tag"; tag.textContent = "mRNA";
  document.body.appendChild(tag);
  const token = document.createElement("div");
  token.id = "mut-token";
  document.body.appendChild(token);

  function size() {
    svg.setAttribute("viewBox", `0 0 ${innerWidth} ${innerHeight}`);
    svg.setAttribute("width", innerWidth); svg.setAttribute("height", innerHeight);
  }
  size(); addEventListener("resize", size);

  // anchors
  const dna = () => (A.dnaVariant ? A.dnaVariant() : null);
  const protein = () => (A.protein ? A.protein() : null);

  // Seam A handoff window, in GLOBAL scroll progress across both acts.
  // Act 1 occupies ~0.477 of the span (420vh / 880vh); the handoff straddles
  // the unpinning of Act 1 and the pinning of Act 2.
  const HS = 0.520, HE = 0.610;
  const easeIO = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const qbez = (a, b, c, u) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;

  let cachedStart = null;                              // last on-screen DNA-variant position

  function hide() { ribbon.setAttribute("opacity", "0"); ticks.setAttribute("opacity", "0");
    token.style.opacity = "0"; tag.style.opacity = "0"; }

  function update(g) {
    if (g < HS) {                                      // before the seam: remember where the variant is
      const d = dna();
      if (d && d.y > 0 && d.y < innerHeight) cachedStart = d;
      hide(); return;
    }
    if (g > HE) { hide(); return; }
    const p = protein(); if (!p) { hide(); return; }
    const s = cachedStart || p;
    const t = easeIO(Math.min(1, Math.max(0, (g - HS) / (HE - HS))));

    // mRNA spools out to one side (a control point) before delivering to the protein
    const span = Math.min(innerWidth, innerHeight);
    const mx = (s.x + p.x) / 2 + span * 0.17;
    const my = (s.y + p.y) / 2 - span * 0.05;
    const tx = qbez(s.x, mx, p.x, t), ty = qbez(s.y, my, p.y, t);

    token.style.left = tx + "px"; token.style.top = ty + "px";
    token.style.opacity = t < 0.92 ? "1" : String(Math.max(0, (1 - t) / 0.08));   // dissolve into the protein residue

    // grow the ribbon from the source up to the token, with a faint base-tick comb
    const strand = `M ${s.x} ${s.y} Q ${mx} ${my} ${tx} ${ty}`;
    ribbon.setAttribute("d", strand);
    const op = 0.9 * Math.min(1, t / 0.12) * (t > 0.88 ? (1 - t) / 0.12 : 1);
    ribbon.setAttribute("opacity", String(Math.max(0, op)));
    ticks.setAttribute("d", comb(s, [mx, my], [tx, ty], t));
    ticks.setAttribute("opacity", String(Math.max(0, op * 0.7)));

    // a small "mRNA" label rides just behind the token while it is mid-flight
    tag.style.left = tx + 16 + "px"; tag.style.top = ty - 10 + "px";
    tag.style.opacity = String(Math.max(0, op * (t < 0.85 ? 1 : (1 - t) / 0.15)));
  }

  // perpendicular base ticks sampled along the quad bezier (RNA "rungs")
  function comb(s, m, e, t) {
    let d = "";
    const steps = 9;
    for (let i = 1; i <= steps; i++) {
      const u = (i / (steps + 1)) * t;
      const x = qbez(s.x, m[0], e[0], u), y = qbez(s.y, m[1], e[1], u);
      // tangent for the perpendicular
      const dx = 2 * (1 - u) * (m[0] - s.x) + 2 * u * (e[0] - m[0]);
      const dy = 2 * (1 - u) * (m[1] - s.y) + 2 * u * (e[1] - m[1]);
      const L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, h = 4.5;
      d += `M ${(x - nx * h).toFixed(1)} ${(y - ny * h).toFixed(1)} L ${(x + nx * h).toFixed(1)} ${(y + ny * h).toFixed(1)} `;
    }
    return d;
  }

  ScrollTrigger.create({
    trigger: "#act-1", start: "top top", endTrigger: "#act-2", end: "bottom bottom",
    scrub: true, onUpdate: (self) => update(self.progress),
  });
  window.STORY_BRIDGE = { update };   // headless checks
})();
