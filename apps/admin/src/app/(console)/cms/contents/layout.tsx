import type { ReactNode } from "react"

export default function CmsContentsLayout({
  children,
  modal,
}: {
  children: ReactNode
  modal?: ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
