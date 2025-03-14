// ML5 type declarations
declare global {
  interface Window {
    ml5: any;
  }
}

export interface KNNClassifierResult {
  label: string;
  confidence: number;
  confidences?: { [key: string]: number };
  confidencesByLabel?: { [key: string]: number };
  classIndex?: number;
}

export interface KNNClassifier {
  addExample: (features: any, label: string) => void;
  classify: (
    features: any,
    options: any | null,
    callback: (error: Error | null, result?: KNNClassifierResult) => void,
  ) => void;
  getCount: () => { [key: string]: number };
}

export interface FeatureExtractor {
  infer: (input: HTMLCanvasElement | HTMLImageElement) => any;
}

export interface ML5Classifier {
  knn: KNNClassifier;
  featureExtractor: FeatureExtractor;
}

export class ML5Handler {
  private classifier: ML5Classifier | null = null;
  private initialized: boolean = false;
  private examplesLoaded: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if ml5 is available
      if (!window.ml5) {
        throw new Error("ml5 is not available. Make sure to include the CDN.");
      }

      // Create a KNN classifier
      const knnClassifier = window.ml5.KNNClassifier();

      // Create a feature extractor using MobileNet
      const featureExtractor = window.ml5.featureExtractor("MobileNet", () => {
        console.log("Feature extractor loaded");
        this.loadExampleImages(featureExtractor, knnClassifier);
      });

      this.classifier = {
        knn: knnClassifier,
        featureExtractor: featureExtractor,
      };

      this.initialized = true;
    } catch (error) {
      console.error("Error initializing ML5 classifier:", error);
      throw error;
    }
  }

  // Load example images for each letter
  async loadExampleImages(
    featureExtractor: FeatureExtractor,
    knnClassifier: KNNClassifier,
  ): Promise<void> {
    console.log("Loading example images...");

    try {
      // Define all letters we want to load examples for
      const letters = [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "K",
        "L",
        "LL",
        "M",
        "N",
        "Ñ",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
      ];

      let totalProcessed = 0;

      // Process each letter
      for (const letter of letters) {
        let index = 1;
        let consecutiveErrors = 0;

        // Keep trying until we get consecutive failures
        while (consecutiveErrors < 1) {
          try {
            const imagePath = `/${letter}${index}.jpg`;
            await this.loadImageForClassifier(
              imagePath,
              letter,
              featureExtractor,
              knnClassifier,
            );
            totalProcessed++;
            consecutiveErrors = 0; // Reset error counter on success
            index++;
          } catch (error) {
            consecutiveErrors++;
            console.log(`Could not find ${letter}${index}.jpg, skipping`);
            index++;

            // If we've already successfully loaded at least one image and hit 3 errors,
            // assume we're done with this letter
            if (index > 3 && consecutiveErrors >= 3) {
              console.log(`Finished loading examples for ${letter}`);
              break;
            }
          }
        }
      }

      console.log(
        `All example images loaded successfully (${totalProcessed} total)`,
      );
      console.log("Example counts:", knnClassifier.getCount());
      this.examplesLoaded = true;
    } catch (error) {
      console.error("Error loading example images:", error);
      throw error;
    }
  }

  // Function to load an image and add it to the classifier
  private loadImageForClassifier(
    imagePath: string,
    letterLabel: string,
    featureExtractor: FeatureExtractor,
    knnClassifier: KNNClassifier,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Extract features from the image
          const features = featureExtractor.infer(img);
          // Add the features to the classifier with the letter as the label
          knnClassifier.addExample(features, letterLabel);
          console.log(`Loaded: ${imagePath} as ${letterLabel}`);
          resolve();
        } catch (err) {
          console.error(`Error processing image ${imagePath}:`, err);
          reject(err);
        }
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image ${imagePath}`));
      };
      img.src = imagePath;
    });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  isExamplesLoaded(): boolean {
    return this.examplesLoaded;
  }

  getClassifier(): ML5Classifier | null {
    return this.classifier;
  }

  async analyzeDrawing(
    canvas: HTMLCanvasElement,
    targetLetter: string,
  ): Promise<boolean> {
    if (!this.classifier || !this.initialized || !this.examplesLoaded) {
      throw new Error("ML5 classifier is not fully initialized");
    }

    try {
      // Preprocess the image
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 224;
      tempCanvas.height = 224;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) throw new Error("Could not create temp canvas context");

      // Fill white background
      tempCtx.fillStyle = "white";
      tempCtx.fillRect(0, 0, 224, 224);

      // Process image boundaries and center it
      const originalCtx = canvas.getContext("2d");
      if (!originalCtx) throw new Error("Could not get canvas context");
      const pixels = originalCtx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );

      // Find drawing boundaries
      let minX = canvas.width,
        maxX = 0,
        minY = canvas.height,
        maxY = 0;
      let hasDrawing = false;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (pixels.data[i + 3] > 0 && pixels.data[i] < 250) {
            hasDrawing = true;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (!hasDrawing) {
        console.log("No drawing detected");
        return false;
      }

      // Add padding and center the drawing
      const padding = 20;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(canvas.width, maxX + padding);
      maxY = Math.min(canvas.height, maxY + padding);

      const drawingWidth = maxX - minX;
      const drawingHeight = maxY - minY;
      const size = Math.max(drawingWidth, drawingHeight);
      const scale = Math.min(180 / size, 1);
      const centerX = 112 - (drawingWidth / 2) * scale;
      const centerY = 112 - (drawingHeight / 2) * scale;

      tempCtx.drawImage(
        canvas,
        minX,
        minY,
        drawingWidth,
        drawingHeight,
        centerX,
        centerY,
        drawingWidth * scale,
        drawingHeight * scale,
      );

      // Classify with k=5
      const result = await this.classifyImage(tempCanvas, targetLetter);
      return result;
    } catch (error) {
      console.error("Error:", error);
      return false;
    }
  }

  private classifyImage(
    canvas: HTMLCanvasElement,
    targetLetterInput: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.classifier) {
        resolve(false);
        return;
      }

      const dataURL = canvas.toDataURL("image/jpeg", 1.0);
      const img = new Image();

      img.onload = () => {
        const features = this.classifier!.featureExtractor.infer(img);

        // First try with k=5
        this.classifier!.knn.classify(
          features,
          { k: 5 },
          (error: Error | null, result?: KNNClassifierResult) => {
            if (error || !result) {
              resolve(false);
              return;
            }

            console.log("Result with k=5:", result);
            const confidences = result.confidencesByLabel || {};

            // Check if there's a tie (multiple letters with same confidence)
            const confidenceValues = Object.values(confidences);
            const uniqueConfidences = new Set(confidenceValues).size;
            const targetConfidence = confidences[targetLetterInput] || 0;

            // If there's a tie and the target letter has some confidence, try with k=1
            if (
              uniqueConfidences < Object.keys(confidences).length &&
              confidenceValues.some(
                (v) => Math.abs(v - targetConfidence) < 0.001,
              ) &&
              targetConfidence > 0
            ) {
              console.log(
                "Possible tie detected. Trying with k=1 for tie-breaking",
              );

              // Try again with k=1 to break the tie
              this.classifier!.knn.classify(
                features,
                { k: 1 },
                (error2: Error | null, result2?: KNNClassifierResult) => {
                  if (error2 || !result2) {
                    // Fall back to original result
                    const isCorrect = this.processClassificationResult(
                      result,
                      targetLetterInput,
                    );
                    resolve(isCorrect);
                    return;
                  }

                  console.log("Result with k=1:", result2);
                  const isCorrect = this.processClassificationResult(
                    result2,
                    targetLetterInput,
                  );
                  resolve(isCorrect);
                },
              );
            } else {
              // No tie, or target letter not in tie, use the initial result
              const isCorrect = this.processClassificationResult(
                result,
                targetLetterInput,
              );
              resolve(isCorrect);
            }
          },
        );
      };

      img.src = dataURL;
    });
  }

  // Helper function to process the classification result
  private processClassificationResult(
    result: KNNClassifierResult,
    targetLetter: string,
  ): boolean {
    const confidences = result.confidencesByLabel || {};
    const targetConfidence = confidences[targetLetter] || 0;

    // Get best match
    let bestMatch = { letter: "", confidence: 0 };
    Object.entries(confidences).forEach(([letter, confidence]) => {
      if (confidence > bestMatch.confidence) {
        bestMatch = { letter, confidence: confidence };
      }
    });

    console.log(
      `Target: ${targetLetter}, Best match: ${bestMatch.letter} (${bestMatch.confidence.toFixed(2)})`,
    );

    const isCorrect = targetConfidence > 0.4;
    return isCorrect;
  }
}

// Create a singleton instance
export const ml5Handler = new ML5Handler();
