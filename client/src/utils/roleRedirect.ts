export type AppRole = 'VENDOR' | 'CLIENT' | 'ADMIN'

export function getHomePathForRole(role: string): string {
  switch (role.toUpperCase() as AppRole) {
    case 'VENDOR':
      return '/dashboard'
    case 'CLIENT':
      return '/portal'
    case 'ADMIN':
      return '/admin'
    default:
      return '/login'
  }
}
