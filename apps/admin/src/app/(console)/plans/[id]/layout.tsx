import type { ReactNode } from "react"

export default function PlanDetailLayout({
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

