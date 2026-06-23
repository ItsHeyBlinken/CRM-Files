import React from 'react'
import { Link } from 'react-router-dom'
import { PLATFORM_LOGO_ALT, PLATFORM_LOGO_SRC } from '../../constants/branding'

interface PlatformLogoProps {
  /** Tailwind height class — width scales automatically */
  heightClass?: string
  className?: string
  /** Wrap in a home link (default true when `to` is set) */
  to?: string | null
}

const PlatformLogo: React.FC<PlatformLogoProps> = ({
  heightClass = 'h-10',
  className = '',
  to = '/',
}) => {
  const image = (
    <span className="marketing-logo-frame">
      <img
        src={PLATFORM_LOGO_SRC}
        alt={PLATFORM_LOGO_ALT}
        className={`${heightClass} w-auto max-w-[min(100%,280px)] object-contain object-left rounded-2xl ${className}`}
      />
    </span>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex shrink-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        {image}
      </Link>
    )
  }

  return image
}

export default PlatformLogo
