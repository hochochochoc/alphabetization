// Create this as moduleShim.ts and import it before PaddleOCR

// Add module definition to window
if (
  typeof window !== "undefined" &&
  typeof (window as any).Module === "undefined"
) {
  (window as any).Module = {};
}

// You might also need these depending on which parts of CommonJS PaddleOCR uses
if (typeof window !== "undefined") {
  (window as any).global = window;
  (window as any).process = { env: {} };
  (window as any).exports = {};
  (window as any).require = function (module: string) {
    console.warn(`Module ${module} was required but not available`);
    return {};
  };
}
