import { createContext } from 'react'

export interface AuthUser {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  role: string
  avatarUrl?: string
  phone?: string
  company?: string
  jobTitle?: string
  redirectPath?: string
}

export interface ClientRegisterInput {
  token: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<AuthUser>
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
    company?: string,
    jobTitle?: string
  ) => Promise<AuthUser>
  registerClient: (input: ClientRegisterInput) => Promise<AuthUser>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
