"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function normalizeOptions(values: readonly string[] | string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
  );
}

export function TagSelectField({
  name,
  label,
  options,
  defaultValue = [],
  description,
}: {
  name: string;
  label: string;
  options: readonly string[];
  defaultValue?: string[];
  description?: string;
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    normalizeOptions(defaultValue),
  );
  const [customInput, setCustomInput] = useState("");
  const knownOptions = new Set(options);
  const customTags = selected.filter((value) => !knownOptions.has(value));

  function toggle(value: string) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : normalizeOptions([...current, value]),
    );
  }

  function addCustomTag() {
    const value = customInput.trim().replace(/[,，]/g, "").slice(0, 24);
    if (!value) return;
    setSelected((current) =>
      current.includes(value) ? current : normalizeOptions([...current, value]),
    );
    setCustomInput("");
  }

  return (
    <fieldset className="space-y-2 sm:col-span-2">
      <legend className="font-semibold text-foreground/85">{label}</legend>
      {description && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                checked
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-primary/20 bg-white/70 text-foreground hover:border-primary/45 hover:bg-secondary",
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={option}
                checked={checked}
                onChange={() => toggle(option)}
                className="sr-only"
              />
              {checked && <Check className="size-3.5" />}
              {option}
            </label>
          );
        })}
      </div>
      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
            >
              <input type="hidden" name={name} value={tag} />
              {tag}
              <button
                type="button"
                aria-label={`移除 ${tag}`}
                onClick={() => toggle(tag)}
                className="grid size-4 place-items-center rounded-full text-primary/70 transition-colors hover:bg-primary/15 hover:text-primary"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex max-w-sm gap-2">
        <Input
          value={customInput}
          onChange={(event) => setCustomInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustomTag();
            }
          }}
          placeholder="添加自定义标签"
          aria-label={`${label}自定义标签`}
          className="h-9"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addCustomTag}
        >
          <Plus />
          添加
        </Button>
      </div>
    </fieldset>
  );
}
