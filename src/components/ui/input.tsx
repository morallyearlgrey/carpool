import * as React from "react"

import { cn } from "@/lib/utils"

function Input(props: React.ComponentProps<"input">) {
  const { className, type } = props;

  // Determine whether the caller provided a `value` prop. If they did, treat
  // this as a controlled input for the lifetime of the component. If they did
  // not, leave it uncontrolled so `defaultValue` works as expected.
  const hasValueProp = Object.prototype.hasOwnProperty.call(props, 'value');

  // Build final props for the <input>. If controlled, coerce null/undefined to
  // the empty string so React doesn't flip between uncontrolled/controlled.
  const inputProps: React.ComponentProps<'input'> = { ...props };
  if (hasValueProp) {
    // Coerce undefined/null to '' to keep it controlled
    // (this avoids React warning about switching from uncontrolled -> controlled)
    // Keep the prop present but normalized.
    // Coerce value to string for controlled inputs
    inputProps.value = String(inputProps.value ?? '');
  } else {
    // Ensure we don't accidentally pass an explicit value prop when uncontrolled
    // (keeps the element truly uncontrolled so `defaultValue` works)
    delete inputProps.value;
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...inputProps}
    />
  );
}

export { Input }
