import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TextField({
  name,
  label,
  defaultValue = "",
  type = "text",
  required = false,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
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
        defaultValue={defaultValue}
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
  required = false,
  maxLength = 2000,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={name} className="font-semibold text-foreground/85">
        {label}
        {required && " *"}
      </Label>
      <Textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
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
  description,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-primary/15 bg-white/65 p-4 text-sm font-medium transition-colors hover:border-primary/30 hover:bg-secondary/60">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
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
      className={`rounded-lg border p-3 text-sm ${state.ok ? "border-success/20 bg-success/10 text-success" : "border-destructive/20 bg-destructive/10 text-destructive"}`}
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
