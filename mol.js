/* ──────────────────────────────────────────────────────────────────────────
   mol.js — real-structure molecular scenes (3Dmol.js), cartoon ribbons in the
   project UI style. Each scene exposes a scroll-driven camera: setProgress(0→1)
   sweeps through an ordered list of keyframe views (an n-point camera path), so
   a single figure can establish, rotate into position, and close in — one shot.

   Every keyframe is derived through `orient(v, f)`, where `f` is the portrait
   fit factor (see fitFactor below): 3Dmol frames a structure against the
   VERTICAL field of view only, so the same call that composes a shot on a desk
   crops it in half on a phone. `f` is 1 on any landscape viewport, so the
   desktop framing is exactly what it always was.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  const MHC_GREY = "#C9C5BD", NEON = "#FF2E88";
  const TCR_A = "#5E8B7E", TCR_B = "#C87C5E";        // TCR α / β chains
  const STUB = { setProgress() {}, resize() {}, isReady: () => false };

  // spherical-linear-ish interpolation between two 3Dmol view arrays
  // [tx,ty,tz, zoom, qx,qy,qz,qw] — translation/zoom lerp, quaternion normalised
  function lerp(a, b, t) {
    const o = a.map((x, i) => x + (b[i] - x) * t);
    const n = Math.hypot(o[4], o[5], o[6], o[7]) || 1;
    o[4] /= n; o[5] /= n; o[6] /= n; o[7] /= n;
    return o;
  }
  // walk an ordered keyframe path: p∈[0,1] spread evenly across the segments
  function lerpKeys(keys, p) {
    p = Math.max(0, Math.min(1, p));
    if (!keys || keys.length === 0) return null;
    if (keys.length === 1) return keys[0];
    const seg = p * (keys.length - 1);
    const i = Math.min(keys.length - 2, Math.floor(seg));
    return lerp(keys[i], keys[i + 1], seg - i);
  }

  // ── pMHC: grey MHC ribbon, peptide (chain C) accent + sidechain sticks ────
  function stylePMHC(v) {
    v.setStyle({}, { cartoon: { color: MHC_GREY } });
    v.setStyle({ chain: "C" }, { cartoon: { color: NEON }, stick: { colorscheme: "default", radius: 0.22 } });
  }
  function orientGroove(v, f) {
    // TCR's-eye view: look into the groove from the presenting face
    v.zoomTo(); v.rotate(90, "x"); v.rotate(90, "y"); v.rotate(180, "x"); v.zoom(f); v.render();
    const start = v.getView();
    v.zoomTo({ chain: "C" }, 0); v.zoom(0.62 * f); v.render();
    return { keys: [start, v.getView()] };
  }

  // ── Docking sequence on the TCR–pMHC complex (4MNQ): ONE figure that goes
  //    from "peptide presented in the groove" → "TCR docked on the platform".
  //    Chains: A/B MHC+β2m (grey), C peptide (neon), D/E TCR α/β (coloured).
  //    The TCR sits above the MHC in the file; framing tight on the peptide
  //    crops it out, then pulling back + rotating brings it down into view —
  //    so the MHC appears to rotate into position and the TCR closes in.
  function styleDock(v) {
    v.setStyle({}, { cartoon: { color: MHC_GREY } });
    v.setStyle({ chain: "C" }, { cartoon: { color: NEON }, stick: { colorscheme: "default", radius: 0.2 } });
    v.setStyle({ chain: "D" }, { cartoon: { color: TCR_A, opacity: 0 } });   // TCR fades in
    v.setStyle({ chain: "E" }, { cartoon: { color: TCR_B, opacity: 0 } });   // after the peptide reads
  }
  // reveal the TCR only in the back half of the shot, so the peptide-in-groove
  // is seen clearly first; quantised so we restyle ~8× rather than every frame
  function revealDock(v, p, state) {
    const o = Math.max(0, Math.min(1, (p - 0.45) / 0.35));
    const q = Math.round(o * 8) / 8;
    if (q === state.tcr) return false;
    state.tcr = q;
    v.setStyle({ chain: "D" }, { cartoon: { color: TCR_A, opacity: q } });
    v.setStyle({ chain: "E" }, { cartoon: { color: TCR_B, opacity: q } });
    return true;                                                            // a restyle happened → caller re-renders
  }
  function orientDockSequence(v, f) {
    // K0 — presentation: look straight into the groove, framed on the peptide
    //      (the TCR, above the MHC, falls outside this tight frame on a wide
    //      viewport; on a phone the pull-back may bring it into shot early, but
    //      revealDock keeps chains D/E at opacity 0 until the back half, so the
    //      peptide still reads alone regardless of framing)
    v.zoomTo({ chain: "C" }, 0); v.rotate(90, "x"); v.rotate(90, "y"); v.rotate(180, "x");
    v.zoom(1.5 * f); v.render();
    const k0 = v.getView();
    // K1 — same groove view, pulled back: the MHC platform reads
    v.zoom(0.5); v.render();                    // relative to K0 — f already applied
    const k1 = v.getView();
    // K2 — docking side view of the whole complex: MHC rotated into position,
    //      TCR now in frame, landing on the groove
    v.zoomTo(); v.rotate(-90, "x"); v.zoom(1.08 * f); v.render();
    const k2 = v.getView();
    return { keys: [k0, k1, k2] };
  }

  // ── Protein (illustrative): the mutation is red; processing excises a real
  //    9-mer peptide window around it — the protein dissolves down to the
  //    fragment that will be presented. SLATE = "#7088A3".
  const MUT_RESI = 130, PROT_SLATE = "#7088A3";
  const PEP_WIN = "126-134", PEP_REST = "1-125,135-214";   // the 9-mer vs the rest
  function styleProtein(v) {
    v.setStyle({}, {});
    v.setStyle({ chain: "A" }, { cartoon: { color: PROT_SLATE } });
    v.setStyle({ chain: "A", resi: PEP_WIN }, { cartoon: { color: NEON } });
    v.setStyle({ chain: "A", resi: MUT_RESI }, {
      cartoon: { color: NEON }, stick: { color: NEON, radius: 0.4 }, sphere: { color: NEON, scale: 0.5 } });
  }
  // breakdown: in the back half, dissolve the bulk and leave the neon peptide
  function revealProtein(v, p, state) {
    const o = Math.max(0, Math.min(1, (p - 0.5) / 0.42));
    const q = Math.round(o * 8) / 8;
    if (q === state.pep) return false;
    state.pep = q;
    v.setStyle({ chain: "A", resi: PEP_REST }, { cartoon: { color: PROT_SLATE, opacity: 1 - q * 0.93 } });
    v.setStyle({ chain: "A", resi: PEP_WIN }, { cartoon: { color: NEON }, stick: { colorscheme: "default", radius: 0.18 * q } });
    // keep the mutation the focal point as the fragment resolves
    v.setStyle({ chain: "A", resi: MUT_RESI }, {
      cartoon: { color: NEON }, stick: { color: NEON, radius: 0.25 + 0.2 * q }, sphere: { color: NEON, scale: 0.4 + 0.15 * q } });
    return true;
  }
  function orientProtein(v, f) {
    // establishing: whole protein, oriented so the mutation/peptide faces the
    // viewer (forward), not down. The peptide window sits on the protein's lower
    // face after a plain zoomTo, so we roll it up to the front.
    v.zoomTo({ chain: "A" });
    v.rotate(90, "x"); v.rotate(90, "y");   // roll the mutated loop to the front face
    v.zoom(f); v.render();
    const start = v.getView();
    // close-up: frame on the 9-mer peptide window (what gets excised)
    v.zoomTo({ chain: "A", resi: PEP_WIN }, 0); v.zoom(0.62 * f); v.render();
    return { keys: [start, v.getView()] };
  }

  // ── DNA (1BNA Dickerson dodecamer): real B-form double helix. Two strands in
  //    slate/grey licorice; one central base pair is the somatic variant, in
  //    neon. The camera travels down the helix then closes on the variant.
  const DNA_A = "#5E7290", DNA_B = "#9AA9C0";
  const DNA_MUT = { A: "7", B: "18" };          // the mutated base pair (A7·B18)
  function styleDNA(v) {
    v.setStyle({}, {});
    v.setStyle({ chain: "A" }, { stick: { color: DNA_A, radius: 0.15 } });
    v.setStyle({ chain: "B" }, { stick: { color: DNA_B, radius: 0.15 } });
    v.addStyle({ chain: "A" }, { cartoon: { color: DNA_A, style: "oval", thickness: 0.5 } });
    v.addStyle({ chain: "B" }, { cartoon: { color: DNA_B, style: "oval", thickness: 0.5 } });
    // the variant base pair — neon, thicker, with a marker sphere
    v.setStyle({ chain: "A", resi: DNA_MUT.A }, { stick: { color: NEON, radius: 0.34 }, sphere: { color: NEON, scale: 0.32 } });
    v.setStyle({ chain: "B", resi: DNA_MUT.B }, { stick: { color: NEON, radius: 0.34 }, sphere: { color: NEON, scale: 0.32 } });
  }
  function orientDNA(v, f) {
    // establishing: the whole helix in a rolled 3/4 view (not flat side-on, not
    // down the barrel), pulled back so the full dodecamer reads with margin and
    // the neon variant base pair sits front-and-centre
    v.zoomTo({}); v.rotate(90, "x"); v.rotate(25, "y"); v.zoom(0.52 * f); v.render();
    const start = v.getView();
    // close-up: frame the variant base pair in context (a small window, not a
    // single atom-tight pair — it fills the page but stays legible)
    v.zoomTo({ chain: "A", resi: "5-9" }, 0); v.zoom(0.62 * f); v.render();
    return { keys: [start, v.getView()] };
  }

  const CONFIG = {
    pmhc: { style: stylePMHC, orient: orientGroove },
    dna: { style: styleDNA, orient: orientDNA },
    dock: { style: styleDock, orient: orientDockSequence, reveal: revealDock },
    protein: { style: styleProtein, orient: orientProtein, reveal: revealProtein },
  };

  window.StructureScene = function (containerId, key, kind) {
    if (!window.$3Dmol) return STUB;
    const cfg = CONFIG[kind] || CONFIG.pmhc;
    const v = $3Dmol.createViewer(containerId, { backgroundColor: "#FDFCFA", antialias: true });
    let keys = null, ready = false, home = null, lastP = 0, lastW = 0, lastH = 0;
    const state = { tcr: -1, pep: -1 };
    const box = () => document.getElementById(containerId);

    // 3Dmol places the camera at 0.5·diameter / tan(fov/2) — a VERTICAL-only fit,
    // with no aspect term. On a landscape viewport the horizontal field is the
    // wider one, so a vertically-fitted structure has margin to spare — including
    // the margin it takes under the tool column, which is deliberate: the figure
    // running behind the panel is what makes the stage feel immersive. Portrait
    // inverts the geometry: the horizontal field is only `aspect` × the vertical,
    // so the structure is cropped to `aspect` of its width — half the helix off
    // the side of a phone. Pulling back by the aspect ratio fits the same bounding
    // sphere to the narrow axis instead. Landscape → 1 → framing untouched.
    function fitFactor() {
      const el = box();
      const w = el ? el.clientWidth : 0, h = el ? el.clientHeight : 0;
      if (!w || !h) return 1;
      return Math.min(1, Math.max(0.4, w / h));
    }
    // orient() rotates *relatively*, so re-deriving the path needs a known start:
    // `home` is the pristine post-load view (identity rotation).
    function rebuild() {
      if (home) v.setView(home);
      keys = cfg.orient(v, fitFactor()).keys;
    }

    const inlined = (window.STRUCTURES || {})[key];
    const load = inlined ? Promise.resolve(inlined)
      : fetch("structures/" + key + ".pdb").then((r) => r.text());
    load.then((txt) => {
      v.addModel(txt, "pdb");
      cfg.style(v);
      v.setViewStyle({ style: "outline", color: "black", width: 0.06 });
      v.zoomTo(); home = v.getView();
      const el = box();
      lastW = el ? el.clientWidth : 0; lastH = el ? el.clientHeight : 0;
      rebuild();
      v.setView(keys[0]); v.render(); ready = true;
    });
    return {
      setProgress(p) { if (!ready) return; lastP = p;
        if (cfg.reveal) cfg.reveal(v, p, state);
        v.setView(lerpKeys(keys, p)); v.render(); },
      // Mobile browsers fire resize every time the URL bar slides, mid-scroll.
      // The stage is sized in svh so the container does not actually move —
      // re-derive the camera path only when its box really changed shape
      // (rotation, split view, a desktop drag), and hold the current beat.
      resize() {
        if (!ready) return;
        const el = box();
        const w = el ? el.clientWidth : 0, h = el ? el.clientHeight : 0;
        if (!w || !h) return;
        if (w !== lastW || h !== lastH) { lastW = w; lastH = h; v.resize(); rebuild(); }
        v.setView(lerpKeys(keys, lastP)); v.render();
      },
      isReady: () => ready,
    };
  };
  // back-compat
  window.MHCScene = (id, key) => window.StructureScene(id, key, "pmhc");
})();
