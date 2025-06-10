const getBackendUrl = (path: string) => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}` : `http://localhost:8000${path}`;
  }
  return path;
};

export async function fetchModels(): Promise<string[]> {
  try {
    const res = await fetch(getBackendUrl("/models"));
    const data = await res.json();
    return data.models || ["rembg", "bria"];
  } catch {
    return ["rembg", "bria"];
  }
}

export async function removeBackground(file: File, model: string): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", model);
  const res = await fetch(getBackendUrl("/remove-background"), {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Background removal failed for ${model}`);
  return await res.blob();
}
