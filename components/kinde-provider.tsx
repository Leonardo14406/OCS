"use client"

import type { ReactNode } from "react"
import { KindeProvider } from "@kinde-oss/kinde-auth-nextjs"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <KindeProvider waitForInitialLoad={false}>{children}</KindeProvider>
}
