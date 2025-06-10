'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Checkerboard } from "@/components/ui/checkerboard";

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

  // Fetch models on mount
  useEffect(() => {
    fetch(getBackendUrl("/models"))
      .then(r => r.json())
      .then(data => setModels(data.models || ["rembg", "bria"]))
      .catch(() => setModels(["rembg", "bria"]));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInputFile(e.target.files[0]);
      setInputUrl(URL.createObjectURL(e.target.files[0]));
      setOutputs([]);
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
        <Switch checked={theme === 'dark'} onCheckedChange={v => setTheme(v ? 'dark' : 'light')} />
      </div>
      <div className="w-full max-w-md p-6 rounded-xl shadow-lg bg-card flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center">Background Remover</h1>
        <div className="flex flex-col gap-4">
          <Input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
          <div>
            <label className="block text-xs mb-1">Select models</label>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
              {models.map(m => (
                <label key={m} className="flex items-center gap-2 cursor-pointer text-sm">
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
          <Button onClick={handleRemoveBg} disabled={!inputFile || selectedModels.length === 0 || loading} className="w-full">
            {loading ? "Processing..." : "Remove Background"}
          </Button>
        </div>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <div className="flex flex-col gap-4 items-center w-full">
          {inputUrl && (
            <div>
              <div className="text-xs text-muted-foreground mb-1 text-center">Original</div>
              <Image src={inputUrl} alt="Input" width={256} height={256} className="rounded shadow max-h-64 object-contain bg-white" />
            </div>
          )}
          {selectedModels.map(model => {
            const output = outputs.find(o => o.model === model);
            return (
              <div key={model} className="w-full flex flex-col items-center">
                <div className="text-xs text-muted-foreground mb-1 text-center">No background ({model})</div>
                <div className="relative w-[256px] h-[256px] rounded shadow overflow-hidden">
                  <Checkerboard />
                  {output ? (
                    <Image src={output.url} alt={`Output ${model}`} width={256} height={256} className="relative z-10 rounded max-h-64 object-contain" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/60">
                      <span className="text-xs text-muted-foreground animate-pulse">Processing...</span>
                    </div>
                  )}
                </div>
                {output && (
                  <a href={output.url} download={`no-bg-${model}.png`} className="block mt-2 text-center text-primary underline text-xs">Download</a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
