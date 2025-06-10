import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Checkerboard } from "./Checkerboard";

export function ResultGrid({ selectedModels, outputs, loading, inputDims, resultMaxHeight }: {
  selectedModels: string[],
  outputs: { model: string, url: string }[],
  loading: boolean,
  inputDims: { width: number, height: number } | null,
  resultMaxHeight?: number
}) {
  return (
    <div className="w-full grid gap-8 items-start justify-center"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
    >
      {selectedModels.map(model => {
        const output = outputs.find(o => o.model === model);
        const isProcessing = loading && !output;
        if (!isProcessing && !output) return null;
        return (
          <div key={model} className="flex flex-col items-center w-full">
            <div className="text-base font-semibold mb-2 text-center uppercase tracking-wide">{model}</div>
            <div
              className="relative rounded shadow overflow-hidden bg-white flex items-center justify-center"
              style={{
                width: '100%',
                maxWidth: '256px',
                aspectRatio: inputDims ? `${inputDims.width} / ${inputDims.height}` : '1/1',
                maxHeight: resultMaxHeight ? `${resultMaxHeight}px` : undefined,
              }}
            >
              <Checkerboard />
              {output ? (
                <Image src={output.url} alt={`Output ${model}`} fill className="relative z-10 rounded object-contain" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/70">
                  <Loader2 className="animate-spin w-12 h-12 text-primary mb-3" />
                  <span className="text-base text-primary font-semibold animate-pulse">Processing...</span>
                </div>
              )}
            </div>
            {output && (
              <a href={output.url} download={`no-bg-${model}.png`} className="block mt-3 text-center text-primary underline text-base">Download</a>
            )}
          </div>
        );
      })}
    </div>
  );
}
