/* ──────────────────────────────────────────────────────────────────────────
   Pipeline Story — the closing "product" section: the REAL to-manufacture
   construct (window.PAYLOAD, emitted by build_story.py from the canine-OSA
   Phase-5 FinalConstruct). A to-scale construct ribbon (cap · 5′UTR · epitope
   cassette · 3′UTR · polyA) and the translated polyepitope payload itself,
   coloured by epitope and GPGPG linker.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";
  const P = window.PAYLOAD;
  const host = document.getElementById("payload");
  if (!P || !host) { if (host) host.style.display = "none"; return; }

  const SVGNS = "http://www.w3.org/2000/svg";
  const INK = "#111", INK2 = "#6B6B66", GREY = "#D7D4CF", LINKER = "#B4B0A8";
  const PAL = ["--c0", "--c1", "--c2", "--c3", "--c4", "--c5"];
  const col = (i) => `var(${PAL[i % PAL.length]})`;
  const el = (t, a) => { const e = document.createElementNS(SVGNS, t);
    for (const k in a) e.setAttribute(k, a[k]); return e; };

  // ── Ribbon (to-scale across the real total length) ────────────────────────
  // The map is drawn in a fixed coordinate box and scaled to the column it lands
  // in. At 1000 units wide that box renders 13-unit labels at ~12px across a
  // desk, but only ~4.5px inside a phone's ~343px column. Portrait redraws the
  // same map in a 400-unit box, where those labels come back to ~11px — the
  // geometry is to-scale either way, only the box changes.
  const cp = P.cassette_positions || [];
  const total = P.total_nt;
  const utr5 = P.utr5_nt || 0, cds = P.cds_nt || 0, utr3 = P.utr3_nt || 0;
  const cdsStart = utr5, cdsEnd = utr5 + cds, utr3End = cdsEnd + utr3;
  const PORTRAIT_Q = window.matchMedia("(max-width: 1023px) and (orientation: portrait)");
  const ribbonHost = document.getElementById("payload-ribbon");

  function drawRibbon() {
    const VBW = PORTRAIT_Q.matches ? 400 : 1000;
    const X0 = PORTRAIT_Q.matches ? 20 : 48, X1 = VBW - X0, W = X1 - X0;
    const x = (nt) => X0 + (nt / total) * W;
    const svg = el("svg", { viewBox: `0 0 ${VBW} 150`, "aria-label": "mRNA construct map" });
    svg.setAttribute("width", "100%");
    const y = 56, H = 34;
    const rect = (a, b, fill, op) => svg.appendChild(el("rect", { x: x(a), y, width: Math.max(0.6, x(b) - x(a)),
      height: H, fill, stroke: INK, "stroke-width": 1, opacity: op == null ? 1 : op }));
    const tx = (xx, yy, s, o) => { const t = el("text", Object.assign({ x: xx, y: yy, "text-anchor": "middle",
      fill: INK2, "font-family": "JetBrains Mono, monospace", "font-size": 13 }, o || {})); t.textContent = s; svg.appendChild(t); return t; };

    // 5' cap
    svg.appendChild(el("circle", { cx: x(0), cy: y + H / 2, r: 11, fill: "#fff", stroke: INK, "stroke-width": 1.4 }));
    tx(x(0), y - 12, "cap");
    // 5'UTR
    rect(0, utr5, GREY); tx((x(0) + x(utr5)) / 2, y + H + 20, "5′UTR");
    // CDS cassette: epitopes (palette) + GPGPG linkers (grey) mapped aa→nt (+ATG)
    rect(cdsStart, cdsEnd, "#F1EEE8");           // CDS backdrop
    const aaNt = (aa) => cdsStart + 3 + aa * 3;  // +3 for the start codon
    cp.forEach((pos, i) => {
      rect(aaNt(pos[0]), aaNt(pos[1]), col(i));
      if (i < cp.length - 1) rect(aaNt(pos[1]), aaNt(cp[i + 1][0]), LINKER);   // GPGPG linker
    });
    tx((x(cdsStart) + x(cdsEnd)) / 2, y - 12, "CDS · " + cp.length + " epitopes");
    tx((x(cdsStart) + x(cdsEnd)) / 2, y + H + 20, cds + " nt");
    // 3'UTR
    rect(cdsEnd, utr3End, GREY); tx((x(cdsEnd) + x(utr3End)) / 2, y + H + 20, "3′UTR");
    // polyA
    rect(utr3End, total, "#E7E3DB"); tx((x(utr3End) + x(total)) / 2, y - 12, "polyA");
    // total scale
    tx((X0 + X1) / 2, 138, total.toLocaleString() + " nt", { "font-size": 12, fill: INK });
    ribbonHost.textContent = "";
    ribbonHost.appendChild(svg);
  }
  drawRibbon();
  if (PORTRAIT_Q.addEventListener) PORTRAIT_Q.addEventListener("change", drawRibbon);
  else if (PORTRAIT_Q.addListener) PORTRAIT_Q.addListener(drawRibbon);          // older WebKit

  // ── Legend ────────────────────────────────────────────────────────────────
  const leg = document.getElementById("payload-legend");
  const chip = (c, label) => { const s = document.createElement("span"); s.className = "pl-chip";
    s.innerHTML = `<i style="background:${c}"></i>${label}`; leg.appendChild(s); };
  chip(col(0), "epitope (cycling)"); chip(LINKER, "GPGPG linker");
  chip(GREY, "untranslated / polyA");

  // ── The payload sequence, coloured by epitope / linker ────────────────────
  const pe = P.polyepitope || "";
  const cls = new Array(pe.length).fill(-1);           // -1 = linker/flank, ≥0 = epitope index
  cp.forEach((pos, i) => { for (let k = pos[0]; k < pos[1] && k < pe.length; k++) cls[k] = i; });
  const seq = document.getElementById("payload-seq");
  let run = 0;
  while (run < pe.length) {
    let j = run + 1; while (j < pe.length && cls[j] === cls[run]) j++;
    const span = document.createElement("span");
    span.textContent = pe.slice(run, j);
    if (cls[run] >= 0) { span.className = "pl-ep"; span.style.color = col(cls[run]); }
    else span.className = "pl-lnk";
    seq.appendChild(span);
    run = j;
  }

  // ── Facts ─────────────────────────────────────────────────────────────────
  const facts = document.getElementById("payload-facts");
  const fact = (k, v, ok) => { const d = document.createElement("span"); d.className = "pl-fact" + (ok ? " ok" : "");
    d.innerHTML = `<b>${v}</b> ${k}`; facts.appendChild(d); };
  fact("nucleotides", total.toLocaleString(), false);
  fact("epitopes", cp.length, false);
  fact("cap", P.cap_analog || "—", false);
  if (P.m1psi_ready) fact("uridine → m1Ψ", "ready", true);
  if (P.cleared) fact("", "✓ manufacturing cleared", true);
})();
