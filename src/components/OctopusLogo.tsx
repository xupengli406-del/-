interface Props {
  className?: string
}

export default function OctopusLogo({ className = 'w-8 h-8' }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="32" cy="22" rx="18" ry="16" fill="#FF69B4" />
      <circle cx="25" cy="20" r="3" fill="white" />
      <circle cx="39" cy="20" r="3" fill="white" />
      <circle cx="25" cy="21" r="1.5" fill="#1a1a2e" />
      <circle cx="39" cy="21" r="1.5" fill="#1a1a2e" />
      <ellipse cx="32" cy="28" rx="3" ry="1.5" fill="#E0559E" />
      <path d="M14 34 Q10 48 8 56 Q9 58 12 56 Q14 50 18 38" fill="#FF69B4" />
      <path d="M20 36 Q18 50 16 58 Q17 60 20 58 Q22 52 24 40" fill="#FF69B4" />
      <path d="M28 38 Q27 52 26 60 Q27 62 30 60 Q30 54 30 42" fill="#FF69B4" />
      <path d="M36 38 Q37 52 38 60 Q39 62 42 60 Q41 54 38 42" fill="#FF69B4" />
      <path d="M42 36 Q44 50 46 58 Q47 60 50 58 Q48 52 44 40" fill="#FF69B4" />
      <path d="M48 34 Q52 48 54 56 Q55 58 58 56 Q56 50 50 38" fill="#FF69B4" />
    </svg>
  )
}
