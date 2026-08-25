export type GlassOpts = {
  radius?: number;
  strength?: number;
  frost?: number;
  from?: Element | string | Iterable<Element> | null;
};

export type GlassHandle = {
  update: () => void;
  destroy: () => void;
};

export function glass(el: Element | string, opts?: GlassOpts): GlassHandle;
export function glassAll(sel: string, opts?: GlassOpts): GlassHandle[];
export default glass;
