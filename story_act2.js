/* ──────────────────────────────────────────────────────────────────────────
   Pipeline Story — Act 2 (Phase 2, presentation & immunogenicity).
   The mutated protein is processed into peptides; one is loaded onto the MHC and
   shown to a T cell. Tools surface at each station with their benchmarks.
   Reuses window.openStoryCard + window.STORY_DATA from story.js.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";
  const DATA = window.STORY_DATA || { acts: [] };
  const act2 = DATA.acts.find((a) => a.id === 2) || { hotspots: [] };
  const byTool = Object.fromEntries(act2.hotspots.map((h) => [h.tool, h]));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = document.getElementById("scene2");
  if (!scene) return;

  // ── Structure-first: no drawn clip-art ────────────────────────────────────
  // The whole presentation beat is carried by two REAL structures — the tumour
  // protein (1AKE) dissolving down to its 9-mer fragment, then the 4MNQ
  // peptide·MHC·TCR complex. #scene2 stays empty; the verbatim captions and the
  // tool markers do the labelling. (The earlier drawn proteasome / peptide / MHC
  // cartoons were removed — overlaying renders on a drawing read as cheap.)

  // ── Tool flow ────────────────────────────────────────────────────────────
  // Every Phase-2 tool streams into the right-hand column as its step scrolls
  // past — processing tools first, then the presentation panel, then the
  // immunogenicity scorers — at the same scroll stations the markers used.
  const STATION = {
    proteasomal_processing: 0.30, epitope_generator: 0.30,
    hla_typing: 0.55, mhc_binding: 0.55, pmhc_cofold: 0.55, modal_alphafold: 0.55,
    mhc_stability: 0.55, munis_presentation: 0.55,
    bigmhc: 0.82, immunogenicity: 0.82, tscape: 0.82,
  };
  const ORDER = ["proteasomal_processing", "epitope_generator",
    "hla_typing", "mhc_binding", "pmhc_cofold", "modal_alphafold",
    "mhc_stability", "munis_presentation", "bigmhc", "immunogenicity", "tscape"];
  const flow = window.StoryFlow("flow2", act2.tag);
  const cards = [];
  let stationSeen = {};
  ORDER.forEach((tid) => {
    const h = byTool[tid]; if (!h) return;
    const at = STATION[tid] || 0.62;
    const k = stationSeen[at] = (stationSeen[at] || 0) + 1;
    cards.push({ el: flow.add(h), at: at + (k - 1) * 0.012 });   // slight stagger within a station
  });

  const molProtein = window.StructureScene ? window.StructureScene("protein-viewer", "1AKE", "protein") : null;
  // one viewer for the whole presentation→recognition beat: the 4MNQ complex
  // carries both the pMHC and the TCR, so the camera can move continuously from
  // the groove to the docked interface without crossfading separate renders.
  const molMHC = window.StructureScene ? window.StructureScene("mhc-viewer", "4MNQ", "dock") : null;
  const mols = [molProtein, molMHC];
  window.STORY_DEBUG = { protein: molProtein, mhc: molMHC };   // headless camera checks
  // viewport anchors for the through-line token: where the protein and the MHC
  // groove sit on screen, so the mutation can be handed physically into them.
  window.STORY_ANCHORS = window.STORY_ANCHORS || {};
  window.STORY_ANCHORS.protein = () => {
    const r = document.getElementById("protein-viewer").getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.5 };
  };
  window.STORY_ANCHORS.groove = () => {
    const r = document.getElementById("mhc-viewer").getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.46 };
  };
  window.addEventListener("resize", () => { mols.forEach((m) => m && m.resize()); });

  // ── Rail + context bar (track which act is in view) ──────────────────────
  const CTX = {
    1: ["Phase 1 / 5 · Genomic analysis", "Benchmark: Hugo 2016 WES, n = 5"],
    2: ["Phase 2 / 5 · Neoantigen identification", "Benchmark: Müller 2023 · NEPdb"],
  };
  const railObs = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) {
      const act = e.target.id === "act-2" ? 2 : 1;
      document.querySelectorAll(".rail .dot").forEach((d) => d.classList.toggle("on", +d.dataset.act === act));
      const ph = document.getElementById("ctx-phase"), co = document.getElementById("ctx-cohort");
      if (ph) ph.textContent = CTX[act][0];
      if (co) co.textContent = CTX[act][1];
    }});
    // center-band: a section is "active" when it crosses the viewport middle
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
  ["act-1", "act-2"].forEach((id) => { const s = document.getElementById(id); if (s) railObs.observe(s); });

  // ── Animate ──────────────────────────────────────────────────────────────
  function showAll() {
    cards.forEach((c) => { c.el.style.opacity = "1"; c.el.style.transform = "none"; });
    ["protein-viewer", "protein-cap", "mhc-viewer", "mhc-cap"].forEach((id) => {
      const e = document.getElementById(id); if (e) e.style.opacity = 1; });
    if (molProtein) requestAnimationFrame(() => { molProtein.resize(); molProtein.setProgress(1); });
    if (molMHC) requestAnimationFrame(() => { molMHC.resize(); molMHC.setProgress(1); });
  }
  if (reduce || !window.gsap) { showAll(); return; }

  const caps = Array.from(document.querySelectorAll("#captions2 .caption"));
  const tl = gsap.timeline({ scrollTrigger: {
    trigger: "#act-2", start: "top top", end: "bottom bottom", scrub: 1 } });

  // 2.1–2.2 — ONE continuous shot on the real tumour protein (1AKE): the camera
  // pushes in on the persistent mutation, then the bulk of the fold dissolves and
  // a single real 9-mer fragment (the peptide that will be presented) is left
  // behind. No drawn proteasome — the structure performs the breakdown itself.
  const camP = { p: 0 };
  tl.to(["#protein-viewer", "#protein-cap"], { opacity: 1, duration: 0.05 }, 0.02)
    .to(camP, { p: 1, duration: 0.42, ease: "none",
        onUpdate: () => { if (molProtein) molProtein.setProgress(camP.p); } }, 0.05);

  // 2.3 — physical handoff: the dissolved fragment becomes the peptide already
  // sitting in the MHC groove. Crossfade the protein viewer into the 4MNQ
  // complex, which opens tight on the groove/peptide (dock keyframe K0).
  tl.to(["#protein-viewer", "#protein-cap"], { opacity: 0, duration: 0.06 }, 0.50)
    .to(["#mhc-viewer", "#mhc-cap"], { opacity: 1, duration: 0.08 }, 0.52);
  // 2.3–2.4 — ONE continuous shot (0.54 → ~0.96): the peptide sits in the groove,
  // then the MHC rotates into its docking orientation while the camera pulls back
  // and the TCR fades in onto the platform — presentation and recognition as one
  // figure (the TCR fades late so the peptide reads clearly first).
  const cam = { p: 0 };
  tl.to(cam, { p: 1, duration: 0.42, ease: "none",
      onUpdate: () => { if (molMHC) molMHC.setProgress(cam.p); } }, 0.54);

  // tool cards stream into the column per station
  cards.forEach((c) => tl.to(c.el, { opacity: 1, y: 0, duration: 0.05 }, c.at));

  // captions cross-fade
  caps.forEach((cap) => {
    const at = parseFloat(cap.dataset.at);
    tl.to(cap, { opacity: 1, y: 0, duration: 0.06 }, Math.max(0, at - 0.04))
      .to(cap, { opacity: 0, y: -10, duration: 0.06 }, at + 0.2);
  });
  tl.to(caps[caps.length - 1], { opacity: 1, y: 0, duration: 0.05 }, 0.84);
})();
