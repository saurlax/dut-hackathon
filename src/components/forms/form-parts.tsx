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
      <Label htmlFor={name}>
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
      <Label htmlFor={name}>
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
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border bg-white/60 p-4 text-sm font-medium">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 accent-blue-600"
      />
      {label}
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
      className={`rounded-xl p-3 text-sm ${state.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-destructive"}`}
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
