'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Checkerboard } from "@/components/ui/checkerboard";
import { Loader2 } from "lucide-react";

const getBackendUrl = (path: string) => {
  if (typeof window !== 'undefined') {
    // Use relative path for production, or proxy, or set your backend URL here
    return process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}` : `http://localhost:8000${path}`;
  }
  return path;
};

export default function Home() {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>(["rembg"]);
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [inputUrl, setInputUrl] = useState<string>("");
  const [outputs, setOutputs] = useState<{model: string, url: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Store image dimensions
  const [inputDims, setInputDims] = useState<{width: number, height: number} | null>(null);
  const resultFrameRef = useRef<HTMLDivElement>(null);
  const [resultMaxHeight, setResultMaxHeight] = useState<number | undefined>(undefined);

  // Ensure theme is mounted (necessary for SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch models on mount
  useEffect(() => {
    fetch(getBackendUrl("/models"))
      .then(r => r.json())
      .then(data => setModels(data.models || ["rembg", "bria"]))
      .catch(() => setModels(["rembg", "bria"]));
  }, []);

  // After render, set max height for result images to match left content
  useEffect(() => {
    if (resultFrameRef.current) {
      setResultMaxHeight(resultFrameRef.current.offsetHeight);
    }
  }, [inputDims, models.length, selectedModels.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInputFile(e.target.files[0]);
      setInputUrl(URL.createObjectURL(e.target.files[0]));
      setOutputs([]);
      // Get image dimensions
      const img = new window.Image();
      img.onload = () => setInputDims({ width: img.width, height: img.height });
      img.src = URL.createObjectURL(e.target.files[0]);
    }
  };

  const handleModelChange = (value: string[]) => {
    setSelectedModels(value);
  };

  const handleRemoveBg = async () => {
    if (!inputFile || selectedModels.length === 0) return;
    setLoading(true);
    setError(null);
    setOutputs([]);
    try {
      await Promise.all(selectedModels.map(async (model) => {
        const formData = new FormData();
        formData.append("file", inputFile);
        formData.append("model", model);
        const res = await fetch(getBackendUrl("/remove-background"), {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error(`Background removal failed for ${model}`);
        const blob = await res.blob();
        setOutputs(prev => [...prev, { model, url: URL.createObjectURL(blob) }]);
      }));
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground transition-colors duration-300">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="text-xs">Dark</span>
        {mounted && (
          <Switch checked={theme === 'dark'} onCheckedChange={v => setTheme(v ? 'dark' : 'light')} />
        )}
      </div>
      <div className="w-full max-w-4xl p-4 sm:p-8 rounded-2xl shadow-lg bg-card flex flex-col gap-8 sm:mt-8 sm:mb-8">
        <div className="flex flex-row gap-6 sm:gap-10 mb-4 items-start">
          <div className="flex-1 flex flex-col gap-6" ref={resultFrameRef}>
            <h1 className="text-3xl font-bold text-center">Background Remover</h1>
            <div className="flex flex-col gap-6">
              <Input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="w-auto text-base py-2" />
              <div>
                <label className="block text-sm mb-2">Select models</label>
                <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-2">
                  {models.map(m => (
                    <label key={m} className="flex items-center gap-3 cursor-pointer text-base">
                      <Checkbox
                        checked={selectedModels.includes(m)}
                        onCheckedChange={checked => {
                          setSelectedModels(prev => 
                            checked ? [...prev, m] : prev.filter(x => x !== m)
                          );
                        }}
                        id={`model-${m}`}
                      />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleRemoveBg} disabled={!inputFile || selectedModels.length === 0 || loading} className="w-full text-lg py-3">
                {loading ? "Processing..." : "Remove Background"}
              </Button>
            </div>
          </div>
          {inputUrl && inputDims && (
            <div className="flex flex-col items-center min-w-[120px] sm:min-w-[220px]">
              <div className="text-sm text-muted-foreground mb-2 text-center">Original</div>
              <div
                className="relative rounded shadow bg-white flex items-center justify-center overflow-hidden"
                style={{
                  width: '220px',
                  maxWidth: '100%',
                  aspectRatio: `${inputDims.width} / ${inputDims.height}`,
                  maxHeight: resultMaxHeight ? `${resultMaxHeight}px` : undefined,
                }}
              >
                <Image src={inputUrl} alt="Input" fill sizes="220px" className="object-contain rounded !static" priority />
              </div>
            </div>
          )}
        </div>
        {error && <div className="text-red-500 text-base text-center">{error}</div>}
        <div className="w-full grid gap-8 items-start justify-center"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          {selectedModels.map(model => {
            const output = outputs.find(o => o.model === model);
            const isProcessing = loading && !output;
            // Only show if processing or output exists
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
      </div>
    </div>
  );
}
