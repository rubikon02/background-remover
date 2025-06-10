import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import React from "react";

export type BgType = 'checkerboard' | 'white' | 'black' | 'transparent';

export function BgSelector({ value, onChange }: { value: BgType, onChange: (v: BgType) => void }) {
  return (
    <div>
      <label className="block text-sm mb-2">Preview background</label>
      <Select value={value} onValueChange={v => onChange(v as BgType)}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="transparent">Transparent</SelectItem>
          <SelectItem value="checkerboard">Checkerboard</SelectItem>
          <SelectItem value="white">White</SelectItem>
          <SelectItem value="black">Black</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
