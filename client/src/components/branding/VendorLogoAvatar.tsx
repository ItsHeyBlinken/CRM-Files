import React, { useState } from 'react'

type VendorLogoAvatarProps = {
  logoUrl: string | null
  label: string
  accentColor: string
  className?: string
}

const VendorLogoAvatar: React.FC<VendorLogoAvatarProps> = ({
  logoUrl,
  label,
  accentColor,
  className = 'h-10 w-10 rounded-xl',
}) => {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(logoUrl) && !failed

  if (showImage) {
    return (
      <img
        src={logoUrl!}
        alt=""
        onError={() => setFailed(true)}
        className={`${className} object-cover border border-gray-200 shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${className} flex items-center justify-center text-white text-sm font-semibold shrink-0`}
      style={{ backgroundColor: accentColor }}
    >
      {label.slice(0, 1).toUpperCase()}
    </div>
  )
}

export default VendorLogoAvatar
