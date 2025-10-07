// Global functions injected by VisionCamera Frame Processor plugins
declare function recognizeNumbers(frame: any): Array<{
  text: string;
  box?: { x: number; y: number; width: number; height: number };
}>;

