// chatgptHandler.ts
export interface LetterAnalysisResult {
  letter: string;
  confidence: number;
  isCorrect: boolean;
}

export class ChatGPTHandler {
  private initialized: boolean = false;
  private examplesLoaded: boolean = true; // Always true for ChatGPT handler
  private apiKey: string;
  private apiEndpoint: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || "";
    this.apiEndpoint =
      import.meta.env.VITE_OPENAI_API_ENDPOINT ||
      "https://api.openai.com/v1/chat/completions";
    this.initialized = !!this.apiKey;
  }

  async initialize(): Promise<void> {
    // Check if the OpenAI API key is available
    if (!this.apiKey) {
      throw new Error("OpenAI API key is not set in environment variables");
    }
    this.initialized = true;
    return Promise.resolve();
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  isExamplesLoaded(): boolean {
    // Always return true since ChatGPT doesn't need examples
    return this.examplesLoaded;
  }

  private preprocessCanvas(canvas: HTMLCanvasElement): string {
    // Create a temporary canvas with white background for better contrast
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) throw new Error("Could not create temp canvas context");

    // Fill white background
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the original canvas content on top
    tempCtx.drawImage(canvas, 0, 0);

    // Convert to base64 with high quality
    return tempCanvas.toDataURL("image/jpeg", 0.95);
  }

  async analyzeDrawing(
    canvas: HTMLCanvasElement,
    targetLetter: string,
  ): Promise<boolean> {
    if (!this.isInitialized()) {
      throw new Error("ChatGPT handler is not initialized");
    }

    try {
      // Process the canvas for better recognition
      const base64Image = this.preprocessCanvas(canvas);

      // Call OpenAI API
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are analyzing handwritten Spanish letters. Your task is to identify if the image shows the specified letter from the Spanish alphabet (including special characters like Ñ and digraphs like LL). Don't be strict in your evaluation - the letter must be clearly recognizable.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Does this image show the letter "${targetLetter}"? Respond only with "yes" if it clearly matches, or "no" if it doesn't.`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64Image,
                  },
                },
              ],
            },
          ],
          max_tokens: 50,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API error: ${response.status} - ${errorText}`);
        return false;
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("Invalid response from OpenAI API:", data);
        return false;
      }

      const aiResponse = data.choices[0].message.content.toLowerCase().trim();
      console.log("ChatGPT response:", aiResponse);

      // Analyze response - consider it correct only if it contains "yes"
      return aiResponse.includes("yes");
    } catch (error) {
      console.error("Error analyzing with ChatGPT:", error);
      return false;
    }
  }
}

// Create a singleton instance
export const chatgptHandler = new ChatGPTHandler();
