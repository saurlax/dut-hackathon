import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "hover-elevate active-elevate-2 inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent text-sm font-semibold transition-[transform,box-shadow,background-color,border-color] duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "brand-gradient border-primary-border text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:shadow-md",
        outline:
          "border-[color:var(--button-outline)] bg-white/70 text-foreground shadow-xs hover:border-primary/40 hover:bg-secondary aria-expanded:bg-secondary",
        secondary:
          "border-secondary-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "border-transparent hover:bg-secondary hover:text-foreground aria-expanded:bg-secondary",
        destructive:
          "border-destructive-border bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-9 px-4 py-2",
        xs: "min-h-7 rounded-md px-2 text-xs [&_svg]:size-3",
        sm: "min-h-8 px-3 text-xs [&_svg]:size-3.5",
        lg: "min-h-11 px-6 sm:px-8",
        icon: "size-9 p-0",
        "icon-xs": "size-7 rounded-md p-0 [&_svg]:size-3",
        "icon-sm": "size-8 p-0 [&_svg]:size-3.5",
        "icon-lg": "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  pending = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    pending?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-pending={pending || undefined}
      aria-busy={pending || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
      disabled={props.disabled || pending}
    />
  );
}

export { Button, buttonVariants };
