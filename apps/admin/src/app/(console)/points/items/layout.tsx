import type { ReactNode } from "react"

export default function PointItemsLayout({
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
