import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-bg-muted text-fg",
        accent: "border-transparent bg-accent-soft text-accent",
        outline: "border-border text-fg-muted",
        live: "border-positive/30 bg-positive/10 text-positive",
        demo: "border-warning/30 bg-warning/10 text-warning",
        positive: "border-positive/30 bg-positive/10 text-positive",
        negative: "border-negative/30 bg-negative/10 text-negative",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
