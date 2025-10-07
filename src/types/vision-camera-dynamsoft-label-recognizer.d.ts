declare module 'vision-camera-dynamsoft-label-recognizer' {
  export type DLRPoint = { x: number; y: number };
  export type DLRQuad = {
    x?: number; y?: number; width?: number; height?: number;
    left?: number; top?: number; right?: number; bottom?: number;
    points?: DLRPoint[]; cornerPoints?: DLRPoint[]; corners?: DLRPoint[];
  };
  export type DLRLineResult = { text: string; location?: DLRQuad; boundingBox?: DLRQuad; frame?: DLRQuad; points?: DLRPoint[] };
  export type DLRResult = { lineResults?: DLRLineResult[]; results?: DLRLineResult[] } | DLRLineResult[];
  export function recognize(frame: any): DLRResult;
}

