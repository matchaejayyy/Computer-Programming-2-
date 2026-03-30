"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap shadow-sm transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-red-600 text-white shadow-red-600/25 hover:bg-red-700 hover:shadow-md active:bg-red-800 [a]:hover:bg-red-700",
        outline:
          "border-2 border-neutral-200 bg-white text-foreground shadow-none hover:border-neutral-300 hover:bg-neutral-50 aria-expanded:border-neutral-300 aria-expanded:bg-neutral-50",
        secondary:
          "bg-neutral-100 text-foreground shadow-none hover:bg-neutral-200/90 aria-expanded:bg-neutral-200",
        ghost:
          "shadow-none hover:bg-neutral-100 aria-expanded:bg-neutral-100",
        destructive:
          "bg-red-50 text-red-700 shadow-none ring-1 ring-red-200/80 hover:bg-red-100 hover:ring-red-300 focus-visible:border-red-400 focus-visible:ring-red-200",
        link: "h-auto rounded-none border-0 bg-transparent p-0 text-red-700 shadow-none underline-offset-4 hover:bg-transparent hover:text-red-800 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-8 gap-1.5 rounded-lg px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-lg px-3.5 text-[0.8125rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 rounded-xl px-6 text-base has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5 [&_svg:not([class*='size-'])]:size-[1.125rem]",
        icon: "size-10 rounded-xl p-0",
        "icon-xs": "size-8 rounded-lg p-0 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 rounded-lg p-0",
        "icon-lg": "size-11 rounded-xl p-0 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
