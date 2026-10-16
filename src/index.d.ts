export type GlassOpts = {
  radius?: number;
  strength?: number;
  frost?: number;
  /** Bending rim as a fraction of the element. Default 0.16. */
  bezel?: number;
  /** Nodes behind the card. They keep their screen position. */
  from?: Element | string | Iterable<Element> | null;
};

export type GlassHandle = {
  update: () => void;
  destroy: () => void;
};

export function glass(el: Element | string, opts?: GlassOpts): GlassHandle;
export function glassAll(sel: string, opts?: GlassOpts): GlassHandle[];
export default glass;
