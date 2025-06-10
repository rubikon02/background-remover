import { Checkbox } from "@/components/ui/checkbox";

export function ModelSelector({ models, selectedModels, setSelectedModels }: { models: string[], selectedModels: string[], setSelectedModels: (v: string[]) => void }) {
  return (
    <div>
      <label className="block text-sm mb-2">Select models</label>
      <div className={"flex flex-col gap-3 pr-2 " + (models.length === 0 ? '' : 'max-h-64 overflow-y-auto')}>
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
