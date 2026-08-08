import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TextField({
  name,
  label,
  defaultValue = "",
  value,
  type = "text",
  required = false,
  placeholder,
  onChange,
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  value?: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
}) {
  const controlled = value !== undefined;
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="font-semibold text-foreground/85">
        {label}
        {required && " *"}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        {...(controlled ? { value } : { defaultValue })}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}
export function TextAreaField({
  name,
  label,
  defaultValue = "",
  value,
  required = false,
  maxLength = 2000,
  onChange,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  value?: string;
  required?: boolean;
  maxLength?: number;
  onChange?: (value: string) => void;
}) {
  const controlled = value !== undefined;
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={name} className="font-semibold text-foreground/85">
        {label}
        {required && " *"}
      </Label>
      <Textarea
        id={name}
        name={name}
        {...(controlled ? { value } : { defaultValue })}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        required={required}
        maxLength={maxLength}
        rows={4}
      />
    </div>
  );
}
export function CheckField({
  name,
  label,
  defaultChecked = false,
  checked,
  description,
  onCheckedChange,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  checked?: boolean;
  description?: string;
  onCheckedChange?: (checked: boolean) => void;
}) {
  const controlled = checked !== undefined;
  return (
    <label className="flex items-start gap-3 rounded-lg border border-primary/15 bg-white/65 p-4 text-sm font-medium transition-colors hover:border-primary/30 hover:bg-secondary/60">
      <input
        type="checkbox"
        name={name}
        {...(controlled ? { checked } : { defaultChecked })}
        onChange={
          onCheckedChange
            ? (event) => onCheckedChange(event.target.checked)
            : undefined
        }
        className="mt-0.5 size-4 shrink-0 accent-primary"
      />
      <span>
        <span className="block">{label}</span>
        {description && (
          <span className="mt-1 block text-xs leading-relaxed font-normal text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
export function FormMessage({
  state,
}: {
  state: {
    ok: boolean;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}) {
  if (!state.message) return null;
  return (
    <div
      role="status"
      className={`status-in rounded-lg border p-3 text-sm ${state.ok ? "border-success/20 bg-success/10 text-success" : "border-destructive/20 bg-destructive/10 text-destructive"}`}
    >
      <p>{state.message}</p>
      {state.fieldErrors && (
        <ul className="mt-1 list-inside list-disc">
          {Object.values(state.fieldErrors)
            .flat()
            .map((item) => (
              <li key={item}>{item}</li>
            ))}
        </ul>
      )}
    </div>
  );
}
