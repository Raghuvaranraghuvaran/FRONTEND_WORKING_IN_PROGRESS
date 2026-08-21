export default function BrandLogo({ className = '', compact = false, alt = 'ReturnGuard' }) {
  return (
    <img
      src="/returnguard-logo.svg"
      alt={alt}
      className={`block object-contain ${compact ? 'h-8 w-[8.75rem]' : 'h-11 w-[12.5rem]'} ${className}`}
    />
  )
}