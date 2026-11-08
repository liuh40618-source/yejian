import type * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@reactive-resume/utils/style";

/**
 * Shared by text inputs, selects and textareas: a ruled form, not a boxed one. The field is a line to write on —
 * no fill, no radius, one rule that inks over on focus — the way a printed form is filled in.
 */
const inputBaseClassName =
	"w-full min-w-0 rounded-none border-0 border-b border-line-2 bg-transparent text-ink text-sm outline-none transition-[border-color] duration-quick placeholder:text-ink-3 focus:border-ink focus-visible:outline-none disabled:cursor-not-allowed disabled:border-line disabled:text-ink-3 aria-invalid:border-danger aria-invalid:focus:border-danger";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			className={cn(
				inputBaseClassName,
				"h-9 px-0 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium file:text-ink pointer-coarse:h-11",
				className,
			)}
			{...props}
		/>
	);
}

export { Input, inputBaseClassName };
