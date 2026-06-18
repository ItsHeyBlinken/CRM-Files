import { IUser, User } from '../models/User'

export function getRedirectPathForRole(role: string): string {
  switch (role.toUpperCase()) {
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

export function formatAuthUser(user: IUser) {
  return {
    id: user.id,
    email: user.email,
    name: User.getFullName(user),
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    company: user.company,
    jobTitle: user.jobTitle,
    redirectPath: getRedirectPathForRole(user.role),
  }
}
