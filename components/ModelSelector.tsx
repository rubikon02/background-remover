import { Checkbox } from "@/components/ui/checkbox";
import { useMemo } from "react";

export function ModelSelector({ models, selectedModels, setSelectedModels }: { models: string[], selectedModels: string[], setSelectedModels: (v: string[]) => void }) {
  const allSelected = models.length > 0 && selectedModels.length === models.length;
  const noneSelected = selectedModels.length === 0;
  const someSelected = !allSelected && !noneSelected;

  const handleSelectAll = () => setSelectedModels(models);
  const handleDeselectAll = () => setSelectedModels([]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm">Select models</label>
        {models.length > 0 && (
          <span className="text-xs flex items-center gap-1">
            [
            <button
              type="button"
              className={"underline text-primary hover:opacity-80 px-1 " + (allSelected ? "opacity-50 cursor-not-allowed" : "")}
              onClick={handleSelectAll}
              disabled={allSelected}
              aria-disabled={allSelected}
            >
              all
            </button>
            /
            <button
              type="button"
              className={"underline text-primary hover:opacity-80 px-1 " + (noneSelected ? "opacity-50 cursor-not-allowed" : "")}
              onClick={handleDeselectAll}
              disabled={noneSelected}
              aria-disabled={noneSelected}
            >
              none
            </button>
            ]
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 pr-2" style={models.length === 0 ? {} : { maxHeight: '16rem', overflowY: 'auto' }}>
        {models.length === 0 ? (
          <span className="text-sm text-muted-foreground flex items-center gap-2 min-h-[32px]">
            <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
            Loading models...
          </span>
        ) : models.map(m => (
          <label key={m} className="flex items-center gap-3 cursor-pointer text-base">
            <Checkbox
              checked={selectedModels.includes(m)}
              onCheckedChange={checked => {
                if (checked) {
                  setSelectedModels([...selectedModels, m]);
                } else {
                  setSelectedModels(selectedModels.filter(x => x !== m));
                }
              }}
              id={`model-${m}`}
            />
            <span>{m}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
