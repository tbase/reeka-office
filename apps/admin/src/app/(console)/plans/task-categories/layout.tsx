import type { ReactNode } from "react"

export default function PlanTaskCategoriesLayout({
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

