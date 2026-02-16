import Link from "next/link"

import { Button } from "@/components/ui/button"

type ButtonProps = React.ComponentProps<typeof Button>
type NextLinkProps = React.ComponentProps<typeof Link>

export type LinkButtonProps = Omit<ButtonProps, "nativeButton" | "render"> & {
  href: NextLinkProps["href"]
  linkProps?: Omit<NextLinkProps, "href">
}

export function LinkButton({
  href,
  linkProps,
  children,
  ...buttonProps
}: LinkButtonProps) {
  return (
    <Button
      nativeButton={false}
      render={<Link href={href} {...linkProps} />}
      {...buttonProps}
    >
      {children}
    </Button>
  )
}
