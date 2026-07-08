import type { HTMLInputTypeAttribute } from 'react'

/** Campo de formulario de auth (label-caps + input con el focus del sistema). */
export function AuthField({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  required = false,
  minLength,
  hint,
}: {
  id: string
  name: string
  label: string
  type?: HTMLInputTypeAttribute
  placeholder?: string
  autoComplete?: string
  required?: boolean
  minLength?: number
  hint?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="label-caps mb-2 block text-muted">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="w-full rounded-card border border-hairline bg-white px-4 py-3 text-base text-ink placeholder:text-muted/50"
      />
      {hint && <p className="mt-1.5 text-xs text-muted/70">{hint}</p>}
    </div>
  )
}
