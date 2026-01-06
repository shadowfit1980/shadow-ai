// Social Auth Generator - Generate social authentication
import Anthropic from '@anthropic-ai/sdk';

class SocialAuthGenerator {
    private anthropic: Anthropic | null = null;

    generateNextAuthConfig(): string {
        return `import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                // Implement your own logic here
                const user = await validateCredentials(credentials?.email, credentials?.password);
                return user;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            if (account) {
                token.accessToken = account.access_token;
                token.provider = account.provider;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id;
            session.user.role = token.role;
            session.accessToken = token.accessToken;
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    session: { strategy: 'jwt' },
};

export default NextAuth(authOptions);
`;
    }

    generatePassportStrategies(): string {
        return `import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as LocalStrategy } from 'passport-local';

// Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await findUserByProviderId('google', profile.id);
        if (!user) {
            user = await createUser({
                email: profile.emails?.[0]?.value,
                name: profile.displayName,
                avatar: profile.photos?.[0]?.value,
                provider: 'google',
                providerId: profile.id,
            });
        }
        done(null, user);
    } catch (error) {
        done(error);
    }
}));

// GitHub OAuth
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_ID!,
    clientSecret: process.env.GITHUB_SECRET!,
    callbackURL: '/auth/github/callback',
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await findUserByProviderId('github', profile.id);
        if (!user) {
            user = await createUser({
                email: profile.emails?.[0]?.value,
                name: profile.displayName || profile.username,
                avatar: profile.photos?.[0]?.value,
                provider: 'github',
                providerId: profile.id,
            });
        }
        done(null, user);
    } catch (error) {
        done(error);
    }
}));

// Local Strategy
passport.use(new LocalStrategy({
    usernameField: 'email',
}, async (email, password, done) => {
    try {
        const user = await findUserByEmail(email);
        if (!user || !await verifyPassword(password, user.password)) {
            return done(null, false, { message: 'Invalid credentials' });
        }
        done(null, user);
    } catch (error) {
        done(error);
    }
}));

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
    const user = await findUserById(id);
    done(null, user);
});

export default passport;
`;
    }

    generateOAuthRoutes(): string {
        return `import { Router } from 'express';
import passport from './passport';

const router = Router();

// Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/error' }),
    (req, res) => {
        res.redirect('/dashboard');
    }
);

// GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/auth/error' }),
    (req, res) => {
        res.redirect('/dashboard');
    }
);

// Local login
router.post('/login',
    passport.authenticate('local'),
    (req, res) => {
        res.json({ success: true, user: req.user });
    }
);

// Logout
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.json({ success: true });
    });
});

// Current user
router.get('/me', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user: req.user });
});

export default router;
`;
    }

    generateFirebaseAuth(): string {
        return `import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Sign in with Google
export async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
}

// Sign in with GitHub
export async function signInWithGithub() {
    const result = await signInWithPopup(auth, githubProvider);
    return result.user;
}

// Sign in with email/password
export async function signInWithEmail(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
}

// Sign up with email/password
export async function signUpWithEmail(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
}

// Sign out
export async function logOut() {
    await signOut(auth);
}

// Auth state hook
export function useAuth(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}
`;
    }
}

export const socialAuthGenerator = new SocialAuthGenerator();
