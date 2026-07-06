/** Marca VALIO: isotipo (V petrol + punto dorado) + wordmark en Geist. */
export function ValioWordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const icon = size === 'lg' ? 32 : size === 'md' ? 26 : 22
  const text = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-lg'
  return (
    <span className="flex items-center gap-2.5">
      <svg width={icon} height={icon} viewBox="0 0 200 200" fill="none" aria-hidden="true">
        <path
          d="M40 60L100 160L160 60"
          stroke="var(--color-petrol)"
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="100" cy="160" r="14" fill="var(--color-gold)" />
        <path d="M70 40H130" stroke="var(--color-petrol)" strokeWidth="12" strokeLinecap="round" />
      </svg>
      <span className={`font-display font-bold tracking-tight text-petrol-deep ${text}`}>
        VALIO
      </span>
    </span>
  )
}
