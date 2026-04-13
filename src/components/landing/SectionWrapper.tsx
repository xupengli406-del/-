import type { ReactNode } from 'react'

interface Props {
  id?: string
  children: ReactNode
  className?: string
}

export default function SectionWrapper({ id, children, className = '' }: Props) {
  return (
    <section id={id} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </section>
  )
}
