import 'dotenv/config';
import jwt from 'jsonwebtoken';

export const SECRET_KEY = process.env.JWT_SECRET || 'flowfund_secret_key_change_me_in_prod';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Auth Error: No token provided in authorization header.');
        }
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Auth Error: JWT verification failed:', err.message);
                console.error('Auth Error: Secret key used for verification:', SECRET_KEY);
            }
            return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};
