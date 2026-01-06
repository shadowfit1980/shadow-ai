/**
 * Security Tools Generator
 * 
 * Generate security implementations including JWT, OAuth,
 * encryption, password hashing, and security headers.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface JWTConfig {
    algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
    expiresIn: string;
    issuer?: string;
    audience?: string;
    refreshToken?: boolean;
}

export interface OAuthConfig {
    provider: 'google' | 'github' | 'facebook' | 'microsoft' | 'auth0' | 'custom';
    clientId: string;
    clientSecret: string;
    callbackURL: string;
    scope: string[];
}

export interface EncryptionConfig {
    algorithm: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';
    keyDerivation: 'pbkdf2' | 'scrypt' | 'argon2';
}

// ============================================================================
// SECURITY TOOLS GENERATOR
// ============================================================================

export class SecurityToolsGenerator extends EventEmitter {
    private static instance: SecurityToolsGenerator;

    private constructor() {
        super();
    }

    static getInstance(): SecurityToolsGenerator {
        if (!SecurityToolsGenerator.instance) {
            SecurityToolsGenerator.instance = new SecurityToolsGenerator();
        }
        return SecurityToolsGenerator.instance;
    }

    // ========================================================================
    // JWT AUTHENTICATION
    // ========================================================================

    generateJWTAuth(config: JWTConfig): string {
        return `import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-this';
const JWT_EXPIRES_IN = '${config.expiresIn}';
const JWT_REFRESH_EXPIRES_IN = '7d';

export interface TokenPayload {
    userId: string;
    email: string;
    role?: string;
    [key: string]: any;
}

export interface TokenPair {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
}

// Generate access token
export function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        algorithm: '${config.algorithm}',
        expiresIn: JWT_EXPIRES_IN,
        ${config.issuer ? `issuer: '${config.issuer}',` : ''}
        ${config.audience ? `audience: '${config.audience}',` : ''}
    });
}

${config.refreshToken ? `
// Generate refresh token
export function generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(
        { userId: payload.userId },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
}

// Generate token pair
export function generateTokenPair(payload: TokenPayload): TokenPair {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    return {
        accessToken,
        refreshToken,
        expiresIn: getExpiresInSeconds(JWT_EXPIRES_IN),
    };
}

// Refresh access token
export function refreshAccessToken(refreshToken: string): TokenPair {
    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
        
        // Fetch user data from database
        // const user = await getUserById(decoded.userId);
        
        const newPayload: TokenPayload = {
            userId: decoded.userId,
            email: 'user@example.com', // Replace with actual user data
        };
        
        return generateTokenPair(newPayload);
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
}
` : ''}

// Verify token
export function verifyToken(token: string): TokenPayload {
    try {
        return jwt.verify(token, JWT_SECRET, {
            ${config.issuer ? `issuer: '${config.issuer}',` : ''}
            ${config.audience ? `audience: '${config.audience}',` : ''}
        }) as TokenPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

// Middleware
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    try {
        const payload = verifyToken(token);
        (req as any).user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Role-based authorization
export function authorize(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user as TokenPayload;
        
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        if (roles.length > 0 && !roles.includes(user.role || '')) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        
        next();
    };
}

// Helper function
function getExpiresInSeconds(expiresIn: string): number {
    const match = expiresIn.match(/(\\d+)([smhd])/);
    if (!match) return 3600;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers: Record<string, number> = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400,
    };
    
    return value * (multipliers[unit] || 3600);
}
`;
    }

    // ========================================================================
    // OAUTH 2.0
    // ========================================================================

    generateOAuth(config: OAuthConfig): string {
        const strategyCode = this.getOAuthStrategy(config);

        return `import passport from 'passport';
${strategyCode.import}

passport.use(new ${strategyCode.strategyName}({
    clientID: process.env.${config.provider.toUpperCase()}_CLIENT_ID!,
    clientSecret: process.env.${config.provider.toUpperCase()}_CLIENT_SECRET!,
    callbackURL: '${config.callbackURL}',
    ${strategyCode.extraConfig}
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Find or create user
        // let user = await findUserByProviderId(profile.id);
        // if (!user) {
        //     user = await createUser({
        //         providerId: profile.id,
        //         provider: '${config.provider}',
        //         email: profile.emails?.[0]?.value,
        //         name: profile.displayName,
        //     });
        // }
        
        const user = {
            id: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
        };
        
        return done(null, user);
    } catch (error) {
        return done(error as Error);
    }
}));

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        // const user = await findUserById(id);
        const user = { id };
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// Routes
import { Router } from 'express';

export const authRouter = Router();

// Initiate OAuth flow
authRouter.get('/auth/${config.provider}',
    passport.authenticate('${config.provider}', {
        scope: ${JSON.stringify(config.scope)},
    })
);

// OAuth callback
authRouter.get('/auth/${config.provider}/callback',
    passport.authenticate('${config.provider}', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication
        res.redirect('/dashboard');
    }
);

// Logout
authRouter.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.redirect('/');
    });
});
`;
    }

    private getOAuthStrategy(config: OAuthConfig): { import: string; strategyName: string; extraConfig: string } {
        const strategies: Record<string, { import: string; strategyName: string; extraConfig: string }> = {
            google: {
                import: "import { Strategy as GoogleStrategy } from 'passport-google-oauth20';",
                strategyName: 'GoogleStrategy',
                extraConfig: '',
            },
            github: {
                import: "import { Strategy as GitHubStrategy } from 'passport-github2';",
                strategyName: 'GitHubStrategy',
                extraConfig: '',
            },
            facebook: {
                import: "import { Strategy as FacebookStrategy } from 'passport-facebook';",
                strategyName: 'FacebookStrategy',
                extraConfig: "profileFields: ['id', 'emails', 'name'],",
            },
            microsoft: {
                import: "import { Strategy as MicrosoftStrategy } from 'passport-microsoft';",
                strategyName: 'MicrosoftStrategy',
                extraConfig: '',
            },
            auth0: {
                import: "import { Strategy as Auth0Strategy } from 'passport-auth0';",
                strategyName: 'Auth0Strategy',
                extraConfig: "domain: process.env.AUTH0_DOMAIN!,",
            },
        };

        return strategies[config.provider] || strategies.google;
    }

    // ========================================================================
    // ENCRYPTION
    // ========================================================================

    generateEncryption(config: EncryptionConfig): string {
        return `import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = '${config.algorithm}';

export interface EncryptedData {
    encrypted: string;
    iv: string;
    tag?: string;
    salt?: string;
}

// Encrypt data
export function encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY),
        iv
    );
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const result: EncryptedData = {
        encrypted,
        iv: iv.toString('hex'),
    };
    
    ${config.algorithm.includes('gcm') ? `
    const tag = cipher.getAuthTag();
    result.tag = tag.toString('hex');
    ` : ''}
    
    return result;
}

// Decrypt data
export function decrypt(encryptedData: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY),
        Buffer.from(encryptedData.iv, 'hex')
    );
    
    ${config.algorithm.includes('gcm') ? `
    if (encryptedData.tag) {
        decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    }
    ` : ''}
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        
        ${this.getKeyDerivationCode(config.keyDerivation, true)}
    });
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const [salt, hash] = hashedPassword.split(':');
        
        ${this.getKeyDerivationCode(config.keyDerivation, false)}
    });
}

// Generate random token
export function generateRandomToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

// Generate secure random string
export function generateSecureRandom(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomBytes = crypto.randomBytes(length);
    
    return Array.from(randomBytes)
        .map(byte => chars[byte % chars.length])
        .join('');
}
`;
    }

    private getKeyDerivationCode(method: string, isHashing: boolean): string {
        if (method === 'pbkdf2') {
            return isHashing
                ? `crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
            if (err) reject(err);
            resolve(salt + ':' + derivedKey.toString('hex'));
        });`
                : `crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
            if (err) reject(err);
            resolve(hash === derivedKey.toString('hex'));
        });`;
        } else if (method === 'scrypt') {
            return isHashing
                ? `crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(salt + ':' + derivedKey.toString('hex'));
        });`
                : `crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(hash === derivedKey.toString('hex'));
        });`;
        }
        return '// Use bcrypt or argon2 library for better security';
    }

    // ========================================================================
    // SECURITY HEADERS
    // ========================================================================

    generateSecurityHeaders(): string {
        return `import helmet from 'helmet';
import { Express } from 'express';

export function setupSecurityHeaders(app: Express) {
    // Use helmet for security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: true,
        crossOriginOpenerPolicy: true,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        dnsPrefetchControl: true,
        frameguard: { action: 'deny' },
        hidePoweredBy: true,
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
        ieNoOpen: true,
        noSniff: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        xssFilter: true,
    }));
}

// CORS configuration
import cors from 'cors';

export const corsOptions = cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
});
`;
    }

    // ========================================================================
    // API KEY MANAGEMENT
    // ========================================================================

    generateAPIKeyAuth(): string {
        return `import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export interface APIKey {
    id: string;
    key: string;
    name: string;
    userId: string;
    scopes: string[];
    rateLimit: number;
    createdAt: Date;
    expiresAt?: Date;
    lastUsedAt?: Date;
}

// Generate API key
export function generateAPIKey(prefix: string = 'sk'): string {
    const randomPart = crypto.randomBytes(24).toString('base64url');
    return \`\${prefix}_\${randomPart}\`;
}

// Hash API key for storage
export function hashAPIKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// API key middleware
export function authenticateAPIKey(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }
    
    // Validate API key
    const hashedKey = hashAPIKey(apiKey);
    
    // TODO: Fetch from database
    // const keyData = await findAPIKey(hashedKey);
    
    // if (!keyData) {
    //     return res.status(401).json({ error: 'Invalid API key' });
    // }
    
    // if (keyData.expiresAt && keyData.expiresAt < new Date()) {
    //     return res.status(401).json({ error: 'API key expired' });
    // }
    
    // Update last used
    // await updateAPIKeyLastUsed(keyData.id);
    
    (req as any).apiKey = {
        id: 'key-123',
        userId: 'user-123',
        scopes: ['read', 'write'],
    };
    
    next();
}

// Scope-based authorization
export function requireScopes(...scopes: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const apiKey = (req as any).apiKey as APIKey;
        
        if (!apiKey) {
            return res.status(401).json({ error: 'API key required' });
        }
        
        const hasRequiredScopes = scopes.every(scope => apiKey.scopes.includes(scope));
        
        if (!hasRequiredScopes) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: scopes,
                provided: apiKey.scopes,
            });
        }
        
        next();
    };
}
`;
    }
}

export const securityToolsGenerator = SecurityToolsGenerator.getInstance();
