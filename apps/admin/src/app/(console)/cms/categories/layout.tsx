import type { ReactNode } from "react"

export default function CmsCategoriesLayout({
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
