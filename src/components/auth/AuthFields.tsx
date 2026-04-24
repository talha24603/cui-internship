import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function AuthField({ label, id, ...props }: FieldProps) {
  const isPasswordField = props.type === "password";
  const [showPassword, setShowPassword] = useState(false);
  const resolvedType = isPasswordField ? (showPassword ? "text" : "password") : props.type;

  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <div className="relative">
        <Input
          id={id}
          {...props}
          type={resolvedType}
          className={`${isPasswordField ? "pr-10" : ""} ${props.className ?? ""}`.trim()}
        />
        {isPasswordField ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
    </label>
  );
}

type SubmitButtonProps = {
  loading: boolean;
  label: string;
  loadingLabel: string;
};

export function SubmitButton({ loading, label, loadingLabel }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="h-11 w-full"
    >
      {loading ? loadingLabel : label}
    </Button>
  );
}
