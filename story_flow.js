/* ──────────────────────────────────────────────────────────────────────────
   Pipeline Story — shared infobox flow.
   Tools & benchmarks are no longer dots pinned over the artwork. Each one is a
   card that streams into a right-hand column as the relevant step scrolls past:
   collapsed it shows the phase tag, the tool name and (if measured) its headline
   number; "show more" expands the plain-language blurb + the benchmarked metric
   with its literature context and source. One builder, reused by every act.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  function set(el, cls, txt) { const e = document.createElement("span"); e.className = cls;
    if (txt != null) e.textContent = txt; el.appendChild(e); return e; }

  // Build one collapsed card for a hotspot/tool record. `tagFallback` supplies the
  // phase tag when the record itself doesn't carry one.
  window.makeInfoCard = function (h, tagFallback) {
    const card = document.createElement("article");
    card.className = "infocard" + (h.metric ? " has-metric" : "");

    const head = document.createElement("button");
    head.className = "ic-head"; head.type = "button";
    head.setAttribute("aria-expanded", "false");
    const top = document.createElement("span"); top.className = "ic-top";
    set(top, "ic-tag", h.tag || tagFallback || "tool");
    if (h.metric) set(top, "ic-badge", h.metric.value);
    head.appendChild(top);
    set(head, "ic-title", h.label);
    const more = set(head, "ic-more", "show more");

    const body = document.createElement("div"); body.className = "ic-body";
    if (h.blurb) set(body, "ic-blurb", h.blurb);
    if (h.metric) {
      const m = h.metric;
      const box = document.createElement("div"); box.className = "ic-metric";
      set(box, "ic-mname", m.name);
      const val = document.createElement("div"); val.className = "ic-mval";
      val.textContent = m.value;
      if (m.gate) set(val, "ic-gate", "gate " + m.gate);
      box.appendChild(val);
      if (m.lit) set(box, "ic-lit", "Literature: " + m.lit);
      const src = (m.evidence || "") + (m.source ? " · " + m.source : "");
      if (src) set(box, "ic-src", src);
      body.appendChild(box);
    }

    card.appendChild(head); card.appendChild(body);
    head.addEventListener("click", () => {
      const open = card.classList.toggle("open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
      more.textContent = open ? "show less" : "show more";
    });
    return card;
  };

  // A column controller. `hostId` is an empty .flow container inside a stage.
  // `.add(h, tagFallback)` appends a (hidden) card and returns it so the act's
  // timeline can reveal it at the right scroll station.
  window.StoryFlow = function (hostId, tagFallback) {
    const host = document.getElementById(hostId);
    return {
      host,
      add(h) {
        const card = window.makeInfoCard(h, tagFallback);
        if (host) host.appendChild(card);
        return card;
      },
    };
  };
})();
