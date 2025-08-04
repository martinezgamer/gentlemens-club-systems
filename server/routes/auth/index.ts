import { Router } from 'express';
import crypto from 'crypto';
import { storage } from '../../storage';
import { isAuthenticated } from '../../replitAuth';

const router = Router();

router.post('/login', async (req: any, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === process.env.SUPERUSER_EMAIL?.toLowerCase() && password === process.env.SUPERUSER_PASSWORD) {
      const mockUser = {
        claims: {
          sub: 'superuser-maritnez',
          email: process.env.SUPERUSER_EMAIL,
          first_name: 'Superuser',
          last_name: 'Admin',
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        },
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };
      req.user = mockUser;
      req.session.passport = { user: mockUser };
      await storage.upsertUser({
        id: 'superuser-maritnez',
        email: process.env.SUPERUSER_EMAIL!,
        firstName: 'Superuser',
        lastName: 'Admin',
        role: 'superuser',
        clubLocation: 'both_clubs'
      });
      res.json({ success: true });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/user', isAuthenticated, async (req: any, res) => {
  const userId = req.user.claims.sub;
  const user = await storage.getUser(userId);
  res.json(user);
});

router.post('/register', async (req, res) => {
  try {
    const { token, firstName, lastName, email, password } = req.body;
    if (!token || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const regToken = await storage.getRegistrationToken(token);
    if (!regToken || regToken.isUsed || regToken.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const user = await storage.upsertUser({
      id: crypto.randomUUID(),
      email,
      firstName,
      lastName,
      role: regToken.role,
      registrationToken: token,
    });
    await storage.useRegistrationToken(regToken.id);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

export default router;
