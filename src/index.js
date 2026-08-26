import { displacementDataURL } from "./map.js";

let seq = 0;
let cssOnce = false;

const CSS = `
.wlg-lens,.wlg-frost{
  position:absolute;inset:0;border-radius:inherit;pointer-events:none;
}
.wlg-lens{overflow:hidden}
.wlg-scene{position:absolute;pointer-events:none}
.wlg-scene>*{position:absolute;inset:0;margin:0}
.wlg-frost{background:rgba(255,255,255,0.028)}
.wlg-content{position:relative;z-index:1}
.wlg-svg{position:absolute;width:0;height:0;overflow:hidden}
`;

function ensureCss() {
  if (cssOnce || typeof document === "undefined") return;
  cssOnce = true;
  const s = document.createElement("style");
  s.id = "wlg-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

function makeSvg(id, strength) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", "wlg-svg");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML =
    "<defs><filter id=\"" + id + "-f\" x=\"0%\" y=\"0%\" width=\"100%\" height=\"100%\" color-interpolation-filters=\"sRGB\">" +
    "<feImage id=\"" + id + "-img\" x=\"0\" y=\"0\" width=\"100%\" height=\"100%\" result=\"DISPLACEMENT_MAP\" preserveAspectRatio=\"none\"></feImage>" +
    "<feDisplacementMap in=\"SourceGraphic\" in2=\"DISPLACEMENT_MAP\" scale=\"" + strength + "\" xChannelSelector=\"R\" yChannelSelector=\"B\" result=\"RED_DISPLACED\"></feDisplacementMap>" +
    "<feColorMatrix in=\"RED_DISPLACED\" type=\"matrix\" values=\"1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0\" result=\"RED_CHANNEL\"></feColorMatrix>" +
    "<feDisplacementMap in=\"SourceGraphic\" in2=\"DISPLACEMENT_MAP\" scale=\"" + (strength * 0.875) + "\" xChannelSelector=\"R\" yChannelSelector=\"B\" result=\"GREEN_DISPLACED\"></feDisplacementMap>" +
    "<feColorMatrix in=\"GREEN_DISPLACED\" type=\"matrix\" values=\"0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0\" result=\"GREEN_CHANNEL\"></feColorMatrix>" +
    "<feDisplacementMap in=\"SourceGraphic\" in2=\"DISPLACEMENT_MAP\" scale=\"" + (strength * 0.75) + "\" xChannelSelector=\"R\" yChannelSelector=\"B\" result=\"BLUE_DISPLACED\"></feDisplacementMap>" +
    "<feColorMatrix in=\"BLUE_DISPLACED\" type=\"matrix\" values=\"0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0\" result=\"BLUE_CHANNEL\"></feColorMatrix>" +
    "<feBlend in=\"GREEN_CHANNEL\" in2=\"BLUE_CHANNEL\" mode=\"screen\" result=\"GB_COMBINED\"></feBlend>" +
    "<feBlend in=\"RED_CHANNEL\" in2=\"GB_COMBINED\" mode=\"screen\" result=\"RGB_COMBINED\"></feBlend>" +
    "<feGaussianBlur in=\"RGB_COMBINED\" stdDeviation=\"0.35\" result=\"GLASS_OUT\"></feGaussianBlur>" +
    "</filter></defs>";
  return svg;
}

function applyMap(svg, id) {
  const img = svg.querySelector("#" + id + "-img");
  if (!img) return;
  const url = displacementDataURL();
  img.setAttribute("href", url);
  img.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
}

const KILL = new Set(["SCRIPT", "IFRAME", "OBJECT", "EMBED", "LINK", "VIDEO", "AUDIO"]);

function sourcesOf(from) {
  if (!from) return [];
  if (typeof from === "string") return Array.from(document.querySelectorAll(from));
  if (from instanceof Element) return [from];
  return Array.from(from);
}

function cloneScene(source, host) {
  const node = source.cloneNode(true);
  if (node.nodeType === 1) {
    node.removeAttribute("id");
    node.removeAttribute("name");
  }
  const drop = [];
  const walk = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
  let n = node.nodeType === 1 ? node : walk.nextNode();
  while (n) {
    if (KILL.has(n.tagName)) drop.push(n);
    else {
      n.removeAttribute("id");
      n.removeAttribute("name");
      n.removeAttribute("for");
      if ("disabled" in n) n.disabled = true;
    }
    n = walk.nextNode();
  }
  drop.forEach((el) => el.remove());
  node.querySelectorAll?.(".wlg-host").forEach((el) => el.remove());
  return node;
}

function fillScene(scene, sources, host) {
  scene.replaceChildren(...sources.map((s) => cloneScene(s, host)));
  pin(scene, host);
}

function pin(scene, host) {
  const r = host.getBoundingClientRect();
  scene.style.left = -r.left + "px";
  scene.style.top = -r.top + "px";
  scene.style.width = window.innerWidth + "px";
  scene.style.height = window.innerHeight + "px";
}

/**
 * Wrap an existing element in liquid glass. Does not lock scroll, steal clicks,
 * clone the whole page, or paint a white rim.
 *
 * @param {Element|string} el
 * @param {{ radius?: number, strength?: number, frost?: number, from?: Element|string|null }} [opts]
 * @returns {{ update: function, destroy: function }}
 */
export function glass(el, opts = {}) {
  const host = typeof el === "string" ? document.querySelector(el) : el;
  if (!(host instanceof Element)) throw new Error("simpleliquidglass: need an element");

  const id = "wlg" + ++seq;
  const radius = opts.radius ?? 24;
  const strength = opts.strength ?? 64;
  const frost = opts.frost ?? 0.028;
  const from = opts.from ?? null;

  ensureCss();

  const prev = {
    position: host.style.position,
    overflow: host.style.overflow,
    borderRadius: host.style.borderRadius,
  };
  const cs = getComputedStyle(host);
  if (cs.position === "static") host.style.position = "relative";
  host.style.overflow = "hidden";
  if (cs.borderRadius === "0px") host.style.borderRadius = radius + "px";
  host.classList.add("wlg-host");

  const kids = Array.from(host.childNodes);
  const svg = makeSvg(id, strength);
  const lens = document.createElement("div");
  lens.className = "wlg-lens";
  lens.setAttribute("aria-hidden", "true");
  lens.style.filter = "url(#" + id + "-f)";
  const scene = document.createElement("div");
  scene.className = "wlg-scene";
  lens.appendChild(scene);

  const frostEl = document.createElement("div");
  frostEl.className = "wlg-frost";
  frostEl.setAttribute("aria-hidden", "true");
  frostEl.style.background = "rgba(255,255,255," + frost + ")";

  const content = document.createElement("div");
  content.className = "wlg-content";
  kids.forEach((n) => content.appendChild(n));

  host.append(svg, lens, frostEl, content);
  applyMap(svg, id);

  const sources = sourcesOf(from);
  if (sources.length) fillScene(scene, sources, host);
  else {
    const plate = document.createElement("div");
    plate.style.cssText =
      "position:absolute;inset:0;background:rgba(255,255,255,0.05);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)";
    scene.appendChild(plate);
  }

  const onMove = () => {
    if (sources.length) pin(scene, host);
  };
  if (sources.length) {
    window.addEventListener("resize", onMove, { passive: true });
    window.addEventListener("scroll", onMove, { passive: true, capture: true });
  }

  return {
    update() {
      applyMap(svg, id);
      if (sources.length) fillScene(scene, sources, host);
    },
    destroy() {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
      while (content.firstChild) host.appendChild(content.firstChild);
      svg.remove();
      lens.remove();
      frostEl.remove();
      content.remove();
      host.classList.remove("wlg-host");
      host.style.position = prev.position;
      host.style.overflow = prev.overflow;
      host.style.borderRadius = prev.borderRadius;
    },
  };
}

export function glassAll(sel, opts) {
  return Array.from(document.querySelectorAll(sel)).map((el) => glass(el, opts));
}

export default glass;
