/* ──────────────────────────────────────────────────────────────────────────
   Pipeline Story — Act 1 (Phase 1, genomic analysis).
   A real B-DNA double helix (1BNA): the camera travels down the strand and
   closes on a single base pair — the somatic variant, in red. Detection tools
   stream into the right-hand column with their benchmarked accuracy.
   Owns the shared Lenis + ScrollTrigger setup for the whole page.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";
  const DATA = window.STORY_DATA || { acts: [], coverage: {} };
  const act1 = DATA.acts.find((a) => a.id === 1) || { hotspots: [], tag: "Phase 1" };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // real DNA structure — the somatic variant base pair is neon
  const molDNA = window.StructureScene ? window.StructureScene("dna-viewer", "1BNA", "dna") : null;

  // through-line anchor: where the variant sits on screen (centre of the viewer),
  // so the bridge token can fly the mutation out of the DNA into the protein.
  window.STORY_ANCHORS = window.STORY_ANCHORS || {};
  window.STORY_ANCHORS.dnaVariant = () => {
    const r = document.getElementById("dna-viewer").getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, k: r.width / 1000 };
  };

  // coverage count shown in the coda
  const covEl = document.getElementById("cov-tools");
  if (covEl) covEl.textContent = (DATA.coverage.tools_total || 34);

  // tool flow — every Phase-1 tool streams into the right-hand column
  const flow = window.StoryFlow("flow1", act1.tag);
  const cards = act1.hotspots.map((h) => flow.add(h));

  window.addEventListener("resize", () => molDNA && molDNA.resize());

  function showAll() {
    if (molDNA) requestAnimationFrame(() => { molDNA.resize(); molDNA.setProgress(1); });
    ["dna-viewer", "dna-cap"].forEach((id) => { const e = document.getElementById(id); if (e) e.style.opacity = 1; });
    cards.forEach((c) => { c.style.opacity = "1"; c.style.transform = "none"; });
  }
  if (reduce || !window.gsap) { showAll(); return; }

  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const captions = Array.from(document.querySelectorAll("#captions .caption"));
  const tl = gsap.timeline({ scrollTrigger: {
    trigger: "#act-1", start: "top top", end: "bottom bottom", scrub: 1 } });

  // reveal the helix, run the variant-caller label, travel the camera down the
  // strand and close on the variant base pair
  const cam = { p: 0 };
  tl.to(["#dna-viewer", "#dna-cap"], { opacity: 1, duration: 0.05 }, 0.02)
    .to("#scanlabel", { opacity: 1, duration: 0.05 }, 0.05)
    .to(cam, { p: 1, duration: 0.5, ease: "none",
        onUpdate: () => molDNA && molDNA.setProgress(cam.p) }, 0.06)
    .to("#scanlabel", { opacity: 0, duration: 0.05 }, 0.52);

  // detection tools stream into the column during the expression beat
  cards.forEach((c, i) => tl.to(c, { opacity: 1, y: 0, duration: 0.06 }, 0.5 + i * 0.034));

  // captions cross-fade
  captions.forEach((cap) => {
    const at = parseFloat(cap.dataset.at);
    tl.to(cap, { opacity: 1, y: 0, duration: 0.06 }, Math.max(0, at - 0.04))
      .to(cap, { opacity: 0, y: -10, duration: 0.06 }, at + 0.22);
  });
  tl.to(captions[captions.length - 1], { opacity: 1, y: 0, duration: 0.05 }, 0.82);
})();
