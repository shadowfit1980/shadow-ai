/**
 * Auth Generator
 * 
 * Generate authentication code for JWT, OAuth, sessions.
 */

import { EventEmitter } from 'events';

interface AuthConfig {
    provider: 'jwt' | 'session' | 'oauth';
    providers?: ('google' | 'github' | 'discord')[];
}

export class AuthGenerator extends EventEmitter {
    private static instance: AuthGenerator;

    private constructor() { super(); }

    static getInstance(): AuthGenerator {
        if (!AuthGenerator.instance) {
            AuthGenerator.instance = new AuthGenerator();
        }
        return AuthGenerator.instance;
    }

    generateJWTAuth(): string {
        return `import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

export const hashPassword = (password: string) => bcrypt.hashSync(password, 10);
export const comparePassword = (password: string, hash: string) => bcrypt.compareSync(password, hash);

export const generateToken = (payload: { userId: string; email: string }) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const verifyToken = (token: string) => {
  try { return jwt.verify(token, JWT_SECRET) as { userId: string; email: string }; }
  catch { return null; }
};

export const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  req.user = payload;
  next();
};`;
    }

    generateNextAuth(providers: string[]): string {
        const providerImports = providers.map(p => `import ${this.capitalize(p)}Provider from 'next-auth/providers/${p}';`).join('\n');
        const providerConfigs = providers.map(p => `    ${this.capitalize(p)}Provider({
      clientId: process.env.${p.toUpperCase()}_ID!,
      clientSecret: process.env.${p.toUpperCase()}_SECRET!,
    }),`).join('\n');

        return `import NextAuth from 'next-auth';
${providerImports}

export const authOptions = {
  providers: [
${providerConfigs}
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) { token.id = user.id; }
      return token;
    },
    async session({ session, token }: any) {
      if (token) { session.user.id = token.id; }
      return session;
    },
  },
  pages: { signIn: '/auth/signin' },
};

export default NextAuth(authOptions);`;
    }

    generateAuthHook(): string {
        return `import { useSession, signIn, signOut } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    signIn: (provider?: string) => signIn(provider),
    signOut: () => signOut(),
  };
}`;
    }

    generateProtectedRoute(): string {
        return `import { useAuth } from './useAuth';
import { useRouter } from 'next/router';
import { useEffect, ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}`;
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

export const authGenerator = AuthGenerator.getInstance();
