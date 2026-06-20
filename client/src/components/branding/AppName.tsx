import React from 'react'
import { APP_NAME_PARTS } from '../../constants/branding'

interface AppNameProps {
  className?: string
  /** Tailwind classes for the "Gig" half when accentColor is not set */
  accentClassName?: string
  /** Vendor accent override (inline color on "Gig") */
  accentColor?: string
}

/** Renders SmoothGig as a two-part wordmark: Smooth + Gig */
const AppName: React.FC<AppNameProps> = ({
  className = '',
  accentClassName = 'text-indigo-600',
  accentColor,
}) => {
  const [first, second] = APP_NAME_PARTS

  return (
    <span className={className}>
      <span>{first}</span>
      <span
        className={accentColor ? undefined : accentClassName}
        style={accentColor ? { color: accentColor } : undefined}
      >
        {second}
      </span>
    </span>
  )
}

export default AppName
