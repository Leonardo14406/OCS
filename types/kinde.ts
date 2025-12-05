// types/kinde.d.ts
import { NextRequest } from 'next/server';

declare module 'next/server' {
  interface NextRequest {
    kindeAuth?: {
      user?: {
        id?: string;
        email?: string;
        given_name?: string;
        family_name?: string;
        org_role?: string; // Your custom role field
        // Add other fields as needed (e.g., permissions: string[])
      };
      isAuthenticated?: boolean;
      // Extend as your app grows
    };
  }
}