declare module "@paddlejs-models/ocr" {
  export class Detector {
    constructor(config: { modelPath: string; scale: number });
    load(): Promise<void>;
    detect(img: HTMLImageElement): Promise<any[]>;
  }

  export class Recognizer {
    constructor(config: { modelPath: string; vocabulary: string });
    load(): Promise<void>;
    recognize(img: HTMLImageElement, box: any): Promise<string>;
  }
}
