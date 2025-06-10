"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { ModelSelector } from "@/components/ModelSelector";
import { ImageFrame } from "@/components/ImageFrame";
import { ResultGrid } from "@/components/ResultGrid";

const getBackendUrl = (path: string) => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}` : `http://localhost:8000${path}`;
  }
  return path;
};

export default function Home() {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>(["rembg"]);
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [inputUrl, setInputUrl] = useState<string>("");
  const [outputs, setOutputs] = useState<{ model: string, url: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputDims, setInputDims] = useState<{ width: number, height: number } | null>(null);
  const resultFrameRef = useRef<HTMLDivElement>(null);
  const [resultMaxHeight, setResultMaxHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetch(getBackendUrl("/models"))
      .then(r => r.json())
      .then(data => setModels(data.models || ["rembg", "bria"]))
      .catch(() => setModels(["rembg", "bria"]));
  }, []);

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
      const img = new window.Image();
      img.onload = () => setInputDims({ width: img.width, height: img.height });
      img.src = URL.createObjectURL(e.target.files[0]);
    }
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
      <ThemeSwitch />
      <div className="w-full max-w-4xl p-4 sm:p-8 rounded-2xl shadow-lg bg-card flex flex-col gap-8 sm:mt-8 sm:mb-8">
        <div className="flex flex-row gap-6 sm:gap-10 mb-4 items-start">
          <div className="flex-1 flex flex-col gap-6" ref={resultFrameRef}>
            <h1 className="text-3xl font-bold text-center">Background Remover</h1>
            <div className="flex flex-col gap-6">
              <Input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="text-base py-2 w-auto min-w-[180px]" style={{maxWidth: '100%'}} />
              <ModelSelector models={models} selectedModels={selectedModels} setSelectedModels={setSelectedModels} />
              <Button onClick={handleRemoveBg} disabled={!inputFile || selectedModels.length === 0 || loading} className="w-full text-lg py-3">
                {loading ? "Processing..." : "Remove Background"}
              </Button>
            </div>
          </div>
          {inputUrl && inputDims && (
            <div className="flex flex-col items-center min-w-[120px] sm:min-w-[220px]">
              <div className="text-sm text-muted-foreground mb-2 text-center">Original</div>
              <ImageFrame src={inputUrl} alt="Input" aspectRatio={`${inputDims.width} / ${inputDims.height}`} maxHeight={resultMaxHeight} />
            </div>
          )}
        </div>
        {error && <div className="text-red-500 text-base text-center">{error}</div>}
        <ResultGrid selectedModels={selectedModels} outputs={outputs} loading={loading} inputDims={inputDims} resultMaxHeight={resultMaxHeight} />
      </div>
    </div>
  );
}
