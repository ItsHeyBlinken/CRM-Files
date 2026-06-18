export type P2PPaymentMethod = 'venmo' | 'zelle' | 'cashapp' | 'paypal'

/**
 * Build a client-facing payment URL from a vendor-entered handle.
 * Zelle has no universal pay link — returns null (copy-only).
 */
export function buildP2PPaymentUrl(method: P2PPaymentMethod, rawHandle: string): string | null {
  const handle = rawHandle.trim()
  if (!handle) {
    return null
  }

  switch (method) {
    case 'venmo': {
      let username = handle.replace(/^@/, '')
      const urlMatch = /venmo\.com\/(?:u\/)?([^/?#]+)/i.exec(handle)
      if (urlMatch?.[1]) {
        username = urlMatch[1]
      }
      username = username.replace(/^@/, '').trim()
      if (!username) {
        return null
      }
      return `https://venmo.com/u/${encodeURIComponent(username)}`
    }
    case 'cashapp': {
      let tag = handle
      const urlMatch = /cash\.app\/(\$?[^/?#]+)/i.exec(handle)
      if (urlMatch?.[1]) {
        tag = urlMatch[1]
      }
      const cashtag = tag.replace(/^\$/, '').trim()
      if (!cashtag) {
        return null
      }
      return `https://cash.app/$${encodeURIComponent(cashtag)}`
    }
    case 'paypal': {
      if (/^https?:\/\//i.test(handle)) {
        try {
          const url = new URL(handle)
          if (url.hostname.includes('paypal')) {
            return url.toString()
          }
        } catch {
          /* fall through */
        }
      }

      let path = handle.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
      if (path.toLowerCase().startsWith('paypal.me/')) {
        path = path.slice('paypal.me/'.length)
      }

      const username = path.split(/[/?#]/)[0]?.trim()
      if (!username) {
        return null
      }
      return `https://paypal.me/${encodeURIComponent(username)}`
    }
    case 'zelle':
      return null
    default: {
      const _exhaustive: never = method
      return _exhaustive
    }
  }
}

export function getP2POpenLabel(method: P2PPaymentMethod): string {
  switch (method) {
    case 'venmo':
      return 'Open Venmo'
    case 'cashapp':
      return 'Open Cash App'
    case 'paypal':
      return 'Open PayPal'
    case 'zelle':
      return 'Open'
    default: {
      const _exhaustive: never = method
      return _exhaustive
    }
  }
}
