import { createContext } from 'svelte';

/** Reactive mark for PDF/video overlays. Mutate `.text`; do not replace the object. */
export type WatermarkCtx = { text: string };

export const [getWatermark, setWatermark] = createContext<WatermarkCtx>();
