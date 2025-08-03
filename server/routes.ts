import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import * as aiService from "./ai-service";
import { aiApplicationService } from "./ai-application-service";
import superuserRoutes from "./routes/superuser";
import { insertFinancialRecordSchema, insertTimeClockSchema, insertTaskSchema, insertMessageSchema, insertMusicRequestSchema, insertScheduleSchema, insertDancerApplicationSchema, insertDancerSchema, insertDancerLineupSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Legacy superuser endpoint for backward compatibility 
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Check for the superuser account (case-insensitive)
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail === process.env.SUPERUSER_EMAIL?.toLowerCase() && password === process.env.SUPERUSER_PASSWORD) {
        // Create superuser if doesn't exist
        let user = await storage.getUserByEmail(normalizedEmail);
        if (!user) {
          user = await storage.createUser({
            email: normalizedEmail,
            password: 'legacy-superuser',
            firstName: 'Superuser',
            lastName: 'Admin',
            role: 'superuser',
            clubLocation: 'both_clubs',
            isActive: true,
            profileCompleted: true,
            profileImageUrl: null,
            phoneNumber: null,
            address: null,
            emergencyContact: null,
            emergencyPhone: null,
            registrationToken: null,
            startDate: null,
            notes: null,
          });
        }
        
        // Log in the user using passport
        req.login(user, (err: any) => {
          if (err) {
            console.error("Login error:", err);
            return res.status(500).json({ message: "Login failed" });
          }
          res.json({ success: true, user });
        });
      } else {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Update user endpoint for new auth system
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Validation middleware for role-based authorization
  const requireRole = (allowedRoles: string[]) => {
    return async (req: any, res: any, next: any) => {
      try {
        const user = req.user;
        
        if (!user || !user.role || !allowedRoles.includes(user.role)) {
          return res.status(403).json({ 
            message: "Unauthorized: Insufficient privileges for this operation" 
          });
        }
        
        req.currentUser = user;
        next();
      } catch (error) {
        console.error("Role validation error:", error);
        res.status(500).json({ message: "Authorization check failed" });
      }
    };
  };

  // SECURE: Role update endpoint with proper RBAC
  app.post('/api/admin/update-role', isAuthenticated, requireRole(['superuser']), async (req: any, res) => {
    try {
      const { role, targetUserId } = req.body;
      const currentUser = req.currentUser;

      // For development: Allow self-role changes, in production restrict further
      const userId = req.user.id;
      const finalTargetUserId = targetUserId || userId;

      // Validate role exists
      const validRoles = ['superuser', 'owner', 'manager', 'house_mom', 'house_dad', 
                         'dj', 'host', 'floor_host', 'front_door', 'bartender', 'server', 'barback'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          message: "Invalid role specified" 
        });
      }

      const user = await storage.updateUserRole(finalTargetUserId, role);
      
      // Broadcast role change event
      const broadcast = (global as any).broadcast;
      if (broadcast) {
        broadcast('STAFF_UPDATE', { userId: finalTargetUserId, newRole: role }, 'User role updated');
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get('/api/dashboard/current-staff', isAuthenticated, async (req, res) => {
    try {
      const currentStaff = await storage.getCurrentStaff();
      res.json(currentStaff);
    } catch (error) {
      console.error("Error fetching current staff:", error);
      res.status(500).json({ message: "Failed to fetch current staff" });
    }
  });

  // Time clock routes
  app.post('/api/timeclock/clock-in', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertTimeClockSchema.parse({
        ...req.body,
        userId,
        clockInTime: new Date(),
      });
      
      // Check if user is already clocked in
      const existing = await storage.getActiveTimeClockEntry(userId);
      if (existing) {
        return res.status(400).json({ message: "User is already clocked in" });
      }
      
      const entry = await storage.clockIn(data);
      res.json(entry);
    } catch (error) {
      console.error("Error clocking in:", error);
      res.status(500).json({ message: "Failed to clock in" });
    }
  });

  app.post('/api/timeclock/clock-out', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { notes } = req.body;
      
      const activeEntry = await storage.getActiveTimeClockEntry(userId);
      if (!activeEntry) {
        return res.status(400).json({ message: "No active clock entry found" });
      }
      
      const entry = await storage.clockOut(userId);
      
      res.json(entry);
    } catch (error) {
      console.error("Error clocking out:", error);
      res.status(500).json({ message: "Failed to clock out" });
    }
  });

  app.get('/api/timeclock/entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getTimeClockEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching time clock entries:", error);
      res.status(500).json({ message: "Failed to fetch time clock entries" });
    }
  });

  app.get('/api/timeclock/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activeEntry = await storage.getActiveTimeClockEntry(userId);
      res.json(activeEntry);
    } catch (error) {
      console.error("Error fetching active time clock entry:", error);
      res.status(500).json({ message: "Failed to fetch active time clock entry" });
    }
  });

  // Financial routes
  app.post('/api/financial/records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const data = insertFinancialRecordSchema.parse({
        ...req.body,
        userId,
      });
      
      // Validate access based on record type and user role
      const recordType = data.type;
      const userRole = user.role as string;
      
      // Personal expense records - only workers can create for themselves
      if (recordType === 'personal_expense') {
        const workerRoles = ['dancer', 'bartender', 'server', 'dj', 'host', 'floor_host', 'front_door', 'barback', 'house_mom', 'house_dad'];
        if (!workerRoles.includes(userRole)) {
          return res.status(403).json({ message: "Only workers can create personal expense records" });
        }
        data.isPersonal = true;
      }
      
      // Tips, bonus, overtime - workers can create for themselves, managers can create for others
      if (['tips', 'bonus', 'overtime'].includes(recordType)) {
        const allowedRoles = ['dancer', 'bartender', 'server', 'dj', 'host', 'floor_host', 'front_door', 'barback', 'house_mom', 'house_dad', 'manager', 'superuser', 'owner'];
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ message: "Insufficient permissions to create this record type" });
        }
      }
      
      // Paychecks - only managers/owners can create
      if (recordType === 'paycheck') {
        const managementRoles = ['manager', 'superuser', 'owner'];
        if (!managementRoles.includes(userRole)) {
          return res.status(403).json({ message: "Only management can create paycheck records" });
        }
      }
      
      // House fees, payouts, sales - management only
      if (['house_fee', 'payout', 'sale'].includes(recordType)) {
        const managementRoles = ['manager', 'superuser', 'owner', 'house_mom', 'house_dad'];
        if (!managementRoles.includes(userRole)) {
          return res.status(403).json({ message: "Only management can create this record type" });
        }
      }
      
      const record = await storage.createFinancialRecord(data);
      res.json(record);
    } catch (error) {
      console.error("Error creating financial record:", error);
      res.status(500).json({ message: "Failed to create financial record" });
    }
  });

  app.get('/api/financial/records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Users can only see their own financial records unless they are management
      const managementRoles = ['manager', 'superuser', 'owner'];
      const targetUserId = req.query.userId as string;
      
      if (targetUserId && targetUserId !== userId && !managementRoles.includes(user.role as string)) {
        return res.status(403).json({ message: "You can only view your own financial records" });
      }
      
      const records = await storage.getFinancialRecords(targetUserId || userId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching financial records:", error);
      res.status(500).json({ message: "Failed to fetch financial records" });
    }
  });

  app.get('/api/financial/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const summary = await storage.getFinancialSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching financial summary:", error);
      res.status(500).json({ message: "Failed to fetch financial summary" });
    }
  });

  // Personal Financial Tracking Endpoints - Workers Only (Not Owners/Managers)
  app.get('/api/financial/personal/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only allow workers (non-management roles) to access personal finance tracking
      const workerRoles = ['dancer', 'bartender', 'server', 'dj', 'host', 'floor_host', 'front_door', 'barback', 'house_mom', 'house_dad'];
      if (!user || !workerRoles.includes(user.role as string)) {
        return res.status(403).json({ message: "Personal finance tracking is only available for workers" });
      }
      
      const period = req.query.period as 'daily' | 'weekly' | 'bi_weekly' | 'monthly' || 'weekly';
      const summary = await storage.getPersonalFinancialSummary(userId, period);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching personal financial summary:", error);
      res.status(500).json({ message: "Failed to fetch personal financial summary" });
    }
  });

  app.get('/api/financial/personal/expenses-by-category', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only allow workers to access personal expense categories
      const workerRoles = ['dancer', 'bartender', 'server', 'dj', 'host', 'floor_host', 'front_door', 'barback', 'house_mom', 'house_dad'];
      if (!user || !workerRoles.includes(user.role as string)) {
        return res.status(403).json({ message: "Personal expense tracking is only available for workers" });
      }
      
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;
      const expenses = await storage.getPersonalExpensesByCategory(userId, from, to);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses by category:", error);
      res.status(500).json({ message: "Failed to fetch expenses by category" });
    }
  });

  // Admin routes for user management
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const currentUser = await storage.getUser(currentUserId);
      
      // Only allow managers and above to see all users
      if (!['owner', 'manager', 'house_mom', 'house_dad'].includes(currentUser?.role || '')) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Schedule routes
  app.post('/api/schedules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertScheduleSchema.parse({
        ...req.body,
        userId,
      });
      
      const schedule = await storage.createSchedule(data);
      res.json(schedule);
    } catch (error) {
      console.error("Error creating schedule:", error);
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  app.get('/api/schedules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let schedules;
      if (user?.role === 'owner' || user?.role === 'manager' || user?.role === 'house_mom' || user?.role === 'house_dad') {
        schedules = await storage.getAllSchedules();
      } else {
        schedules = await storage.getSchedulesByUserId(userId);
      }
      
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  // Message routes
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const { subject, content, receiverId, recipientRole } = req.body;
      
      if (recipientRole) {
        // Group message by role - create individual messages for each user with that role
        const users = await storage.getAllUsers();
        const targetUsers = users.filter(user => user.role === recipientRole && user.id !== senderId);
        
        const messages = [];
        for (const targetUser of targetUsers) {
          const data = insertMessageSchema.parse({
            subject,
            content,
            senderId,
            receiverId: targetUser.id,
            recipientRole,
            status: 'delivered'
          });
          const message = await storage.createMessage(data);
          messages.push(message);
        }
        
        res.json({ success: true, messagesSent: messages.length });
      } else {
        // Individual message
        const data = insertMessageSchema.parse({
          subject,
          content,
          senderId,
          receiverId,
          status: 'delivered'
        });
        
        const message = await storage.createMessage(data);
        res.json(message);
      }
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // AI-powered announcement endpoint
  app.post('/api/messages/ai-announcement', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const { subject, content, targetRole } = req.body;
      
      // Use AI to enhance the announcement
      const enhancedAnnouncement = await aiService.enhanceAnnouncement({
        subject,
        content,
        targetRole,
        senderRole: (await storage.getUser(senderId))?.role as string
      });
      
      // Get target users
      const users = await storage.getAllUsers();
      const targetUsers = targetRole 
        ? users.filter(user => user.role === targetRole && user.id !== senderId)
        : users.filter(user => user.id !== senderId); // All users if no specific role
      
      const messages = [];
      for (const targetUser of targetUsers) {
        const data = insertMessageSchema.parse({
          subject: enhancedAnnouncement.subject,
          content: enhancedAnnouncement.content,
          senderId,
          receiverId: targetUser.id,
          recipientRole: targetRole,
          isAnnouncement: true,
          status: 'delivered'
        });
        const message = await storage.createMessage(data);
        messages.push(message);
      }
      
      res.json({ 
        success: true, 
        messagesSent: messages.length,
        enhancedContent: enhancedAnnouncement
      });
    } catch (error) {
      console.error("Error creating AI announcement:", error);
      res.status(500).json({ message: "Failed to create AI announcement" });
    }
  });

  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getMessagesByUserId(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get('/api/messages/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadMessagesCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch('/api/messages/:id/read', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const message = await storage.markMessageAsRead(id);
      res.json(message);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Message sentiment analysis for AI insights
  app.get('/api/messages/sentiment-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only allow management roles to access sentiment analysis
      if (!['owner', 'manager', 'house_mom', 'house_dad'].includes(user?.role || '')) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      const messages = await storage.getAllMessages();
      const analysis = await aiService.analyzeMessageSentiment(messages);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing message sentiment:", error);
      res.status(500).json({ message: "Failed to analyze message sentiment" });
    }
  });

  // Task routes
  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const assignedBy = req.user.claims.sub;
      const data = insertTaskSchema.parse({
        ...req.body,
        assignedBy,
      });
      
      const task = await storage.createTask(data);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let tasks;
      if (user?.role === 'owner' || user?.role === 'manager' || user?.role === 'house_mom' || user?.role === 'house_dad') {
        tasks = await storage.getTasks();
      } else {
        tasks = await storage.getTasks(userId);
      }
      
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.patch('/api/tasks/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const task = await storage.updateTaskStatus(id, status);
      res.json(task);
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(500).json({ message: "Failed to update task status" });
    }
  });

  // Music request routes
  app.post('/api/music-requests', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.claims.sub;
      const data = insertMusicRequestSchema.parse({
        ...req.body,
        requesterId,
      });
      
      const request = await storage.createMusicRequest(data);
      res.json(request);
    } catch (error) {
      console.error("Error creating music request:", error);
      res.status(500).json({ message: "Failed to create music request" });
    }
  });

  app.get('/api/music-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let requests;
      if (user?.role === 'dj') {
        requests = await storage.getMusicRequests(userId);
      } else {
        requests = await storage.getMusicRequests();
      }
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching music requests:", error);
      res.status(500).json({ message: "Failed to fetch music requests" });
    }
  });

  app.patch('/api/music-requests/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const request = await storage.updateMusicRequest(id, updates);
      res.json(request);
    } catch (error) {
      console.error("Error updating music request:", error);
      res.status(500).json({ message: "Failed to update music request" });
    }
  });

  app.delete('/api/music-requests/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMusicRequest(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting music request:", error);
      res.status(500).json({ message: "Failed to delete music request" });
    }
  });

  // AI Music Routes
  app.post('/api/music/ai/generate-playlist', isAuthenticated, async (req: any, res) => {
    try {
      const { generateSmartPlaylist } = await import('./ai-music-service');
      const params = req.body;
      const playlist = await generateSmartPlaylist(params);
      res.json(playlist);
    } catch (error) {
      console.error("Error generating AI playlist:", error);
      res.status(500).json({ message: "Failed to generate playlist" });
    }
  });

  app.get('/api/music/ai/analyze-requests', isAuthenticated, async (req: any, res) => {
    try {
      const { analyzeMusicRequests } = await import('./ai-music-service');
      const requests = await storage.getAllMusicRequests();
      const analysis = await analyzeMusicRequests(requests);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing music requests:", error);
      res.status(500).json({ message: "Failed to analyze requests" });
    }
  });

  app.post('/api/music/ai/prioritize-requests', isAuthenticated, async (req: any, res) => {
    try {
      const { prioritizeMusicRequests } = await import('./ai-music-service');
      const { requests, djPreferences } = req.body;
      const prioritization = await prioritizeMusicRequests(requests, djPreferences);
      res.json(prioritization);
    } catch (error) {
      console.error("Error prioritizing music requests:", error);
      res.status(500).json({ message: "Failed to prioritize requests" });
    }
  });

  app.post('/api/music/ai/suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const { generateMusicSuggestions } = await import('./ai-music-service');
      const params = req.body;
      const suggestions = await generateMusicSuggestions(params);
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating music suggestions:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  // Playlist Routes
  app.post('/api/playlists', isAuthenticated, async (req: any, res) => {
    try {
      const djId = req.user.claims.sub;
      const data = { ...req.body, djId };
      const playlist = await storage.createPlaylist(data);
      res.json(playlist);
    } catch (error) {
      console.error("Error creating playlist:", error);
      res.status(500).json({ message: "Failed to create playlist" });
    }
  });

  app.get('/api/playlists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const djId = user?.role === 'dj' ? userId : undefined;
      const clubLocation = req.query.clubLocation as string;
      
      const playlists = await storage.getPlaylists(djId, clubLocation);
      res.json(playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ message: "Failed to fetch playlists" });
    }
  });

  app.get('/api/playlists/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const playlist = await storage.getPlaylistWithTracks(id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      res.json(playlist);
    } catch (error) {
      console.error("Error fetching playlist:", error);
      res.status(500).json({ message: "Failed to fetch playlist" });
    }
  });

  app.patch('/api/playlists/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const playlist = await storage.updatePlaylist(id, updates);
      res.json(playlist);
    } catch (error) {
      console.error("Error updating playlist:", error);
      res.status(500).json({ message: "Failed to update playlist" });
    }
  });

  app.delete('/api/playlists/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePlaylist(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting playlist:", error);
      res.status(500).json({ message: "Failed to delete playlist" });
    }
  });

  app.post('/api/playlists/:id/tracks', isAuthenticated, async (req, res) => {
    try {
      const { id: playlistId } = req.params;
      const trackData = { ...req.body, playlistId };
      const track = await storage.addTrackToPlaylist(trackData);
      res.json(track);
    } catch (error) {
      console.error("Error adding track to playlist:", error);
      res.status(500).json({ message: "Failed to add track" });
    }
  });

  app.delete('/api/playlist-tracks/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeTrackFromPlaylist(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing track from playlist:", error);
      res.status(500).json({ message: "Failed to remove track" });
    }
  });

  app.post('/api/playlists/:id/reorder', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { trackOrders } = req.body;
      await storage.reorderPlaylistTracks(id, trackOrders);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering tracks:", error);
      res.status(500).json({ message: "Failed to reorder tracks" });
    }
  });

  // Music Analytics Routes
  app.post('/api/music/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const djId = req.user.claims.sub;
      const data = { ...req.body, djId };
      const analytics = await storage.recordMusicPlay(data);
      res.json(analytics);
    } catch (error) {
      console.error("Error recording music play:", error);
      res.status(500).json({ message: "Failed to record play" });
    }
  });

  app.get('/api/music/analytics', isAuthenticated, async (req, res) => {
    try {
      const clubLocation = req.query.clubLocation as string;
      const analytics = await storage.getMusicAnalytics(clubLocation);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching music analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Enhanced Staff management routes
  app.get('/api/staff', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { clubLocation } = req.query;
      
      // Allow managers, owners, and superusers to view staff
      if (!['owner', 'manager', 'superuser', 'house_mom', 'house_dad'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Superusers can view all clubs, others see their assigned club
      if (user?.role === 'superuser') {
        const staff = clubLocation ? await storage.getStaffByClub(clubLocation as string) : await storage.getAllStaff();
        res.json(staff);
      } else {
        const staff = await storage.getStaffByClub(user?.clubLocation || undefined);
        res.json(staff);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.patch('/api/staff/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Allow managers, owners, and superusers to update staff
      if (!['owner', 'manager', 'superuser'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { id } = req.params;
      const updates = req.body;
      
      // Use comprehensive staff update method
      const updatedUser = await storage.updateStaffDetails(id, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating staff:", error);
      res.status(500).json({ message: "Failed to update staff" });
    }
  });

  app.post('/api/staff/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!['owner', 'manager', 'superuser', 'house_mom', 'house_dad'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const noteData = {
        ...req.body,
        createdBy: userId,
      };
      
      const note = await storage.createStaffNote(noteData);
      res.json(note);
    } catch (error) {
      console.error("Error creating staff note:", error);
      res.status(500).json({ message: "Failed to create staff note" });
    }
  });

  app.get('/api/staff/:id/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { id } = req.params;
      
      if (!['owner', 'manager', 'superuser', 'house_mom', 'house_dad'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const notes = await storage.getStaffNotes(id);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching staff notes:", error);
      res.status(500).json({ message: "Failed to fetch staff notes" });
    }
  });

  app.get('/api/staff/ai-insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!['owner', 'manager', 'superuser'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const allStaff = await storage.getAllStaff();
      const timeClockEntries = await storage.getAllTimeClockEntries();
      const financialRecords = await storage.getAllFinancialRecords();
      
      const staffWithData = allStaff.map(staff => ({
        ...staff,
        timeEntries: timeClockEntries.filter(entry => entry.userId === staff.id),
        financialEntries: financialRecords.filter(record => record.userId === staff.id)
      }));
      
      const aiService = await import('./ai-service');
      const insights = await aiService.analyzeStaffPerformance(staffWithData);
      res.json(insights);
    } catch (error) {
      console.error("Error generating staff insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  // AI-Enhanced Features
  app.get('/api/ai/schedule-insights', isAuthenticated, async (req, res) => {
    try {
      const schedules = await storage.getAllSchedules();
      const allUsers = await storage.getAllUsers();
      const insights = await aiService.optimizeSchedule(schedules, allUsers);
      res.json(insights);
    } catch (error) {
      console.error("AI schedule insights error:", error);
      res.status(500).json({ message: "Failed to generate schedule insights" });
    }
  });

  app.get('/api/ai/financial-analysis', isAuthenticated, async (req, res) => {
    try {
      const financialRecords = await storage.getAllFinancialRecords();
      const analysis = await aiService.analyzeFinancialData(financialRecords);
      res.json(analysis);
    } catch (error) {
      console.error("AI financial analysis error:", error);
      res.status(500).json({ message: "Failed to generate financial analysis" });
    }
  });

  app.get('/api/ai/staff-performance', isAuthenticated, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const timeClockEntries = await storage.getAllTimeClockEntries();
      const performanceData = allUsers.map(user => ({
        ...user,
        clockEntries: timeClockEntries.filter(entry => entry.userId === user.id)
      }));
      const analysis = await aiService.analyzeStaffPerformance(performanceData);
      res.json(analysis);
    } catch (error) {
      console.error("AI staff performance error:", error);
      res.status(500).json({ message: "Failed to generate staff performance analysis" });
    }
  });

  app.get('/api/ai/customer-insights', isAuthenticated, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      // Use empty array as dancers are in separate table
      const customerData: any[] = [];
      const insights = await aiService.analyzeCustomerData(customerData);
      res.json(insights);
    } catch (error) {
      console.error("AI customer insights error:", error);
      res.status(500).json({ message: "Failed to generate customer insights" });
    }
  });

  app.post('/api/ai/music-playlist', isAuthenticated, async (req, res) => {
    try {
      const { timeOfDay, crowdSize, specialEvents } = req.body;
      const musicRequests = await storage.getAllMusicRequests();
      const context = {
        timeOfDay: timeOfDay || new Date().getHours().toString(),
        crowdSize: crowdSize || 50,
        specialEvents: specialEvents || [],
        previousRequests: musicRequests
      };
      const playlist = await aiService.generateMusicPlaylist(context);
      res.json(playlist);
    } catch (error) {
      console.error("AI music playlist error:", error);
      res.status(500).json({ message: "Failed to generate music playlist" });
    }
  });

  app.get('/api/ai/task-prioritization', isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      const prioritized = await aiService.prioritizeTasks(tasks);
      res.json(prioritized);
    } catch (error) {
      console.error("AI task prioritization error:", error);
      res.status(500).json({ message: "Failed to prioritize tasks" });
    }
  });

  app.get('/api/ai/message-sentiment', isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getAllMessages();
      const sentiment = await aiService.analyzeMessageSentiment(messages);
      res.json(sentiment);
    } catch (error) {
      console.error("AI message sentiment error:", error);
      res.status(500).json({ message: "Failed to analyze message sentiment" });
    }
  });

  app.get('/api/ai/business-intelligence', isAuthenticated, async (req, res) => {
    try {
      const [schedules, financial, staff, customers, tasks] = await Promise.all([
        storage.getAllSchedules(),
        storage.getAllFinancialRecords(),
        storage.getAllUsers(),
        Promise.resolve([]), // Dancers are in separate table
        storage.getAllTasks()
      ]);
      
      const intelligence = await aiService.generateBusinessIntelligence({
        schedules,
        financial,
        staff,
        customers,
        tasks
      });
      res.json(intelligence);
    } catch (error) {
      console.error("AI business intelligence error:", error);
      res.status(500).json({ message: "Failed to generate business intelligence" });
    }
  });

  // AI Chat Assistant Endpoint
  app.post('/api/ai/chat', isAuthenticated, async (req, res) => {
    try {
      const { message, context } = req.body;
      
      // Enhanced AI chat that can handle various club management queries
      const response = await aiService.processChatMessage(message, context);
      res.json(response);
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // AI-Enhanced Task Management Routes
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { status, priority, assignedTo, clubLocation } = req.query;
      
      let tasks = [];
      
      if (clubLocation) {
        tasks = await storage.getTasksByClub(clubLocation as string);
      } else if (assignedTo) {
        tasks = await storage.getTasksByUser(assignedTo as string);
      } else if (status) {
        tasks = await storage.getTasksByStatus(status as string);
      } else if (priority) {
        tasks = await storage.getTasksByPriority(priority as string);
      } else {
        // Role-based filtering
        if (user?.role === 'superuser') {
          tasks = await storage.getAllTasks();
        } else {
          tasks = await storage.getTasksByClub(user?.clubLocation || undefined);
        }
      }
      
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskData = insertTaskSchema.parse({
        ...req.body,
        assignedBy: userId,
      });
      
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (updates.status === 'completed') {
        const task = await storage.completeTask(id);
        res.json(task);
      } else {
        const task = await storage.updateTask(id, updates);
        res.json(task);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTask(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.get('/api/tasks/statistics', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getTaskStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching task statistics:", error);
      res.status(500).json({ message: "Failed to fetch task statistics" });
    }
  });

  app.get('/api/tasks/overdue', isAuthenticated, async (req, res) => {
    try {
      const overdueTasks = await storage.getOverdueTasks();
      res.json(overdueTasks);
    } catch (error) {
      console.error("Error fetching overdue tasks:", error);
      res.status(500).json({ message: "Failed to fetch overdue tasks" });
    }
  });

  // AI-Enhanced Task Features
  app.post('/api/ai/tasks/enhance', isAuthenticated, async (req, res) => {
    try {
      const taskData = req.body;
      const aiTaskService = await import('./ai-task-service');
      const enhancement = await aiTaskService.enhanceTaskCreation(taskData);
      res.json(enhancement);
    } catch (error) {
      console.error("AI task enhancement error:", error);
      res.status(500).json({ message: "Failed to enhance task" });
    }
  });

  app.get('/api/ai/tasks/workload-analysis', isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      const staff = await storage.getAllStaff();
      const aiTaskService = await import('./ai-task-service');
      const analysis = await aiTaskService.analyzeTaskWorkload(tasks, staff);
      res.json(analysis);
    } catch (error) {
      console.error("AI workload analysis error:", error);
      res.status(500).json({ message: "Failed to analyze workload" });
    }
  });

  app.get('/api/ai/tasks/insights', isAuthenticated, async (req, res) => {
    try {
      const allTasks = await storage.getAllTasks();
      const completedTasks = await storage.getTasksByStatus('completed');
      const aiTaskService = await import('./ai-task-service');
      const insights = await aiTaskService.generateTaskInsights(allTasks, completedTasks);
      res.json(insights);
    } catch (error) {
      console.error("AI task insights error:", error);
      res.status(500).json({ message: "Failed to generate task insights" });
    }
  });

  app.post('/api/ai/tasks/suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { clubLocation } = req.body;
      
      const recentActivity: any[] = []; // TODO: Gather recent activity data
      const aiTaskService = await import('./ai-task-service');
      const suggestions = await aiTaskService.generateTaskSuggestions(
        clubLocation || user?.clubLocation || 'wiggles_gentlemens_club',
        recentActivity
      );
      res.json(suggestions);
    } catch (error) {
      console.error("AI task suggestions error:", error);
      res.status(500).json({ message: "Failed to generate task suggestions" });
    }
  });

  // Real-time AI Insights Endpoint
  app.get('/api/ai/live-insights', isAuthenticated, async (req, res) => {
    try {
      const insights = await aiService.getLiveInsights();
      res.json(insights);
    } catch (error) {
      console.error("Live insights error:", error);
      res.status(500).json({ message: "Failed to get live insights" });
    }
  });

  // Dancer application routes
  app.post('/api/dancer-applications', isAuthenticated, async (req: any, res) => {
    try {
      const application = insertDancerApplicationSchema.parse(req.body);
      const result = await storage.createDancerApplication(application);
      res.json(result);
    } catch (error) {
      console.error("Error creating dancer application:", error);
      res.status(400).json({ message: "Failed to create dancer application" });
    }
  });

  app.get('/api/dancer-applications', isAuthenticated, async (req: any, res) => {
    try {
      const { clubLocation } = req.query;
      const applications = await storage.getDancerApplications(clubLocation);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching dancer applications:", error);
      res.status(500).json({ message: "Failed to fetch dancer applications" });
    }
  });

  // Get active dancers
  app.get('/api/dancers/active', isAuthenticated, async (req: any, res) => {
    try {
      const { clubLocation } = req.query;
      const dancers = await storage.getActiveDancers(clubLocation);
      res.json(dancers);
    } catch (error) {
      console.error("Error fetching active dancers:", error);
      res.status(500).json({ message: "Failed to fetch active dancers" });
    }
  });

  // Get inactive dancers
  app.get('/api/dancers/inactive', isAuthenticated, async (req: any, res) => {
    try {
      const { clubLocation } = req.query;
      const dancers = await storage.getInactiveDancers(clubLocation);
      res.json(dancers);
    } catch (error) {
      console.error("Error fetching inactive dancers:", error);
      res.status(500).json({ message: "Failed to fetch inactive dancers" });
    }
  });

  // Approve dancer application
  app.put('/api/dancer-applications/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user has permission to approve applications
      const allowedRoles = ['superuser', 'manager', 'house_mom', 'house_dad'];
      if (!user || !allowedRoles.includes(user.role as string)) {
        return res.status(403).json({ message: "Access denied. Insufficient permissions." });
      }

      const result = await storage.updateDancerApplicationStatus(
        id, 
        'approved', 
        userId, 
        'Application approved'
      );

      // Create notification for the applicant (if they have a user account)
      try {
        const application = await storage.getDancerApplicationById(id);
        if (application) {
          // Find user by email to send notification
          const users = await storage.getAllUsers();
          const applicantUser = users.find(u => u.email === application.email);
          
          if (applicantUser) {
            await storage.createNotification({
              userId: applicantUser.id,
              type: 'application_approved',
              title: 'Application Approved!',
              message: `Your dancer application has been approved. Welcome to the team!`,
              data: { applicationId: id, dancerName: `${application.firstName} ${application.lastName}` }
            });
          }

          // Create notification for managers/house staff
          const managementUsers = users.filter(u => 
            ['superuser', 'manager', 'house_mom', 'house_dad'].includes(u.role as string)
          );
          
          for (const manager of managementUsers) {
            if (manager.id !== userId) { // Don't notify the person who approved it
              await storage.createNotification({
                userId: manager.id,
                type: 'dancer_activated',
                title: 'New Dancer Approved',
                message: `${application.firstName} "${application.stageName || ''}" ${application.lastName} has been approved and is now active.`,
                data: { applicationId: id, dancerName: `${application.firstName} ${application.lastName}` }
              });
            }
          }

          // Broadcast real-time notification
          const broadcast = (global as any).broadcast;
          if (broadcast) {
            broadcast({
              type: 'notification',
              data: {
                type: 'dancer_activated',
                title: 'New Dancer Approved',
                message: `${application.firstName} "${application.stageName || ''}" ${application.lastName} has been approved and is now active.`
              }
            });
          }
        }
      } catch (notificationError) {
        console.error("Error creating approval notifications:", notificationError);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error approving dancer application:", error);
      res.status(500).json({ message: "Failed to approve dancer application" });
    }
  });

  // Reject dancer application
  app.put('/api/dancer-applications/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user has permission to reject applications
      const allowedRoles = ['superuser', 'manager', 'house_mom', 'house_dad'];
      if (!user || !allowedRoles.includes(user.role as string)) {
        return res.status(403).json({ message: "Access denied. Insufficient permissions." });
      }

      const result = await storage.updateDancerApplicationStatus(
        id, 
        'rejected', 
        userId, 
        reason || 'Application rejected'
      );

      // Create notification for the applicant (if they have a user account)
      try {
        const application = await storage.getDancerApplicationById(id);
        if (application) {
          // Find user by email to send notification
          const users = await storage.getAllUsers();
          const applicantUser = users.find(u => u.email === application.email);
          
          if (applicantUser) {
            await storage.createNotification({
              userId: applicantUser.id,
              type: 'application_rejected',
              title: 'Application Update',
              message: `Your dancer application has been reviewed. Please contact management for more details.`,
              data: { applicationId: id, dancerName: `${application.firstName} ${application.lastName}`, reason }
            });
          }

          // Create notification for managers/house staff
          const managementUsers = users.filter(u => 
            ['superuser', 'manager', 'house_mom', 'house_dad'].includes(u.role as string)
          );
          
          for (const manager of managementUsers) {
            if (manager.id !== userId) { // Don't notify the person who rejected it
              await storage.createNotification({
                userId: manager.id,
                type: 'application_rejected',
                title: 'Application Rejected',
                message: `Application from ${application.firstName} ${application.lastName} has been rejected.`,
                data: { applicationId: id, dancerName: `${application.firstName} ${application.lastName}`, reason }
              });
            }
          }

          // Broadcast real-time notification
          const broadcast = (global as any).broadcast;
          if (broadcast) {
            broadcast({
              type: 'notification',
              data: {
                type: 'application_rejected',
                title: 'Application Rejected',
                message: `Application from ${application.firstName} ${application.lastName} has been rejected.`
              }
            });
          }
        }
      } catch (notificationError) {
        console.error("Error creating rejection notifications:", notificationError);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error rejecting dancer application:", error);
      res.status(500).json({ message: "Failed to reject dancer application" });
    }
  });

  app.put('/api/dancer-applications/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user has permission to approve
      const allowedRoles = ['superuser', 'manager', 'house_mom', 'house_dad'];
      if (!user || !allowedRoles.includes(user.role as string)) {
        return res.status(403).json({ message: "Access denied. Insufficient permissions." });
      }

      const result = await storage.approveDancerApplication(id, userId);
      res.json(result);
    } catch (error) {
      console.error("Error approving dancer application:", error);
      res.status(500).json({ message: "Failed to approve dancer application" });
    }
  });

  app.put('/api/dancer-applications/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user has permission to reject
      const allowedRoles = ['superuser', 'manager', 'house_mom', 'house_dad'];
      if (!user || !allowedRoles.includes(user.role as string)) {
        return res.status(403).json({ message: "Access denied. Insufficient permissions." });
      }

      const result = await storage.rejectDancerApplication(id, userId, reason);
      res.json(result);
    } catch (error) {
      console.error("Error rejecting dancer application:", error);
      res.status(500).json({ message: "Failed to reject dancer application" });
    }
  });

  app.get('/api/dancers/active', isAuthenticated, async (req: any, res) => {
    try {
      const { clubLocation } = req.query;
      const dancers = await storage.getActiveDancers(clubLocation);
      res.json(dancers);
    } catch (error) {
      console.error("Error fetching active dancers:", error);
      res.status(500).json({ message: "Failed to fetch active dancers" });
    }
  });

  app.get('/api/dancers/inactive', isAuthenticated, async (req: any, res) => {
    try {
      const { clubLocation } = req.query;
      const dancers = await storage.getInactiveDancers(clubLocation);
      res.json(dancers);
    } catch (error) {
      console.error("Error fetching inactive dancers:", error);
      res.status(500).json({ message: "Failed to fetch inactive dancers" });
    }
  });

  app.put('/api/dancers/:id/toggle-status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user has permission to toggle status
      const allowedRoles = ['superuser', 'manager', 'house_mom', 'house_dad'];
      if (!user || !allowedRoles.includes(user.role as string)) {
        return res.status(403).json({ message: "Access denied. Insufficient permissions." });
      }

      const application = await storage.getDancerApplicationById(id);
      if (!application) {
        return res.status(404).json({ message: "Dancer not found" });
      }

      const result = await storage.updateDancerApplicationStatus(
        id, 
        application.status as string, 
        userId, 
        `Status toggled to ${!application.isActive ? 'active' : 'inactive'}`
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error toggling dancer status:", error);
      res.status(500).json({ message: "Failed to toggle dancer status" });
    }
  });

  // Change club location for dancer application
  app.put('/api/dancer-applications/:id/change-location', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { clubLocation } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user has permission to change locations
      const allowedRoles = ['superuser', 'manager', 'house_mom', 'house_dad'];
      if (!user || !allowedRoles.includes(user.role as string)) {
        return res.status(403).json({ message: "Access denied. Insufficient permissions." });
      }

      const result = await storage.updateDancerApplicationStatus(
        id, 
        'pending', // Keep current status
        userId, 
        `Club location changed to ${clubLocation}`
      );
      
      // Update the club location specifically
      await storage.updateDancerApplication(id, { clubLocation });
      
      res.json(result);
    } catch (error) {
      console.error("Error changing club location:", error);
      res.status(500).json({ message: "Failed to change club location" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotificationsByUserId(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const result = await storage.markNotificationAsRead(id);
      res.json(result);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // AI Application Helper Routes
  app.post('/api/ai/application-help', async (req: any, res) => {
    try {
      const { field, value, context } = req.body;
      
      let suggestion = '';
      switch (field) {
        case 'experience':
          suggestion = await aiApplicationService.enhanceExperience(value, context);
          break;
        case 'availability':
          suggestion = await aiApplicationService.improveAvailability(value);
          break;
        case 'stageName':
          suggestion = await aiApplicationService.suggestStageName(context);
          break;
        default:
          suggestion = value;
      }
      
      res.json({ suggestion });
    } catch (error) {
      console.error("AI application help error:", error);
      res.status(500).json({ message: "Failed to get AI suggestions" });
    }
  });

  // Dancer management endpoints (independent contractors)
  app.get('/api/dancers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) return res.status(401).json({ message: "User not found" });

      let clubLocation: string | undefined;
      
      // Superusers see all, others see only their club
      if (user.role !== 'superuser') {
        clubLocation = user.clubLocation || undefined;
      }

      const dancers = await storage.getDancersByClub(clubLocation);
      res.json(dancers);
    } catch (error) {
      console.error("Error fetching dancers:", error);
      res.status(500).json({ message: "Failed to fetch dancers" });
    }
  });

  app.post('/api/dancers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !user.id || !user.role || !['superuser', 'owner', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertDancerSchema.parse(req.body);
      const dancer = await storage.createDancer(validatedData);
      res.json(dancer);
    } catch (error: any) {
      console.error("Error creating dancer:", error);
      res.status(400).json({ message: error.message || "Failed to create dancer" });
    }
  });

  // Dancer Lineup endpoints
  app.get('/api/lineup/today', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) return res.status(401).json({ message: "User not found" });

      let clubLocation: string | undefined;
      
      // Superusers see all, others see only their club
      if (user.role !== 'superuser') {
        clubLocation = user.clubLocation || undefined;
      }

      const lineup = await storage.getTodaysLineup(clubLocation);
      res.json(lineup);
    } catch (error) {
      console.error("Error fetching today's lineup:", error);
      res.status(500).json({ message: "Failed to fetch lineup" });
    }
  });

  app.get('/api/lineup/current/:clubLocation', isAuthenticated, async (req: any, res) => {
    try {
      const { clubLocation } = req.params;
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) return res.status(401).json({ message: "User not found" });

      // Allow access for all staff members to view both clubs
      const lineup = await storage.getCurrentDancersByClub(clubLocation);
      res.json(lineup);
    } catch (error) {
      console.error("Error fetching current dancers:", error);
      res.status(500).json({ message: "Failed to fetch current dancers" });
    }
  });

  app.post('/api/lineup', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !user.role || !['superuser', 'owner', 'manager', 'house_mom', 'house_dad'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      if (!user.id) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const validatedData = insertDancerLineupSchema.parse({
        ...req.body,
        scheduledBy: user.id
      });
      
      const lineup = await storage.addToLineup(validatedData);
      
      res.json(lineup);
    } catch (error: any) {
      console.error("Error adding to lineup:", error);
      res.status(400).json({ message: error.message || "Failed to add to lineup" });
    }
  });

  app.put('/api/lineup/:id/check-in', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !user.role || !['superuser', 'owner', 'manager', 'house_mom', 'house_dad', 'host', 'front_door'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const lineup = await storage.checkInDancer(id);
      
      res.json(lineup);
    } catch (error: any) {
      console.error("Error checking in dancer:", error);
      res.status(400).json({ message: error.message || "Failed to check in dancer" });
    }
  });

  app.put('/api/lineup/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !user.id || !user.role || !['superuser', 'owner', 'manager', 'house_mom', 'house_dad', 'host', 'front_door'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const { status, currentStatus } = req.body;
      const lineup = await storage.updateLineupStatus(id, status, currentStatus);
      
      res.json(lineup);
    } catch (error: any) {
      console.error("Error updating lineup status:", error);
      res.status(400).json({ message: error.message || "Failed to update status" });
    }
  });

  // Public Dancer Application Route (no auth required)
  app.post('/api/dancer-applications/public', async (req: any, res) => {
    try {
      const application = insertDancerApplicationSchema.parse(req.body);
      const result = await storage.createDancerApplication(application);
      
      // Optional: Get AI feedback on the application
      try {
        const feedback = await aiApplicationService.reviewApplication(application);
        console.log(`Application submitted with AI score: ${feedback.score}/10`);
      } catch (error) {
        console.error("AI review error:", error);
      }

      // Create notification for management about new application
      try {
        const users = await storage.getAllUsers();
        const managementUsers = users.filter(u => 
          ['superuser', 'manager', 'house_mom', 'house_dad'].includes(u.role as string)
        );
        
        for (const manager of managementUsers) {
          await storage.createNotification({
            userId: manager.id,
            type: 'new_application',
            title: 'New Dancer Application',
            message: `${application.firstName} ${application.lastName} has submitted a new application for ${application.clubLocation}.`,
            data: { 
              applicationId: result.id, 
              dancerName: `${application.firstName} ${application.lastName}`,
              clubLocation: application.clubLocation
            }
          });
        }

        // Broadcast real-time notification
        const broadcast = (global as any).broadcast;
        if (broadcast) {
          broadcast({
            type: 'notification',
            data: {
              type: 'new_application',
              title: 'New Dancer Application',
              message: `${application.firstName} ${application.lastName} has submitted a new application for ${application.clubLocation}.`
            }
          });
        }
      } catch (notificationError) {
        console.error("Error creating new application notifications:", notificationError);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error creating public dancer application:", error);
      res.status(400).json({ message: "Failed to create dancer application" });
    }
  });

  // Public file upload endpoint (no auth required)
  app.post('/api/upload', async (req: any, res) => {
    try {
      // For now, just return a mock URL since we don't have file storage configured
      // In production, this would upload to a cloud storage service
      res.json({ 
        url: `/uploads/documents/${Date.now()}-document.pdf`,
        message: "File upload functionality would be implemented with cloud storage in production"
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // File upload endpoint for dancer applications (authenticated)
  app.post('/api/upload-document', isAuthenticated, async (req: any, res) => {
    try {
      // For now, just return a mock URL since we don't have file storage configured
      // In production, this would upload to a cloud storage service
      res.json({ 
        url: `/uploads/documents/${Date.now()}-document.pdf`,
        message: "File upload functionality would be implemented with cloud storage in production"
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Mount superuser routes
  app.use('/api/superuser', isAuthenticated, superuserRoutes);

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection established');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('Received WebSocket message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'join_room':
            // Join a specific room for targeted updates
            break;
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
    
    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'Connected to FantasyCompanions real-time server' 
    }));
  });

  // Enhanced broadcast function for granular real-time updates
  const broadcast = (event: string, data: any, message?: string) => {
    const payload = {
      event,
      type: event, // Backward compatibility
      data,
      message,
      timestamp: new Date().toISOString()
    };
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(payload));
      }
    });
  };

  // Legacy broadcast function for backward compatibility
  const legacyBroadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Store broadcast functions for use in other parts of the app
  (global as any).broadcast = broadcast;
  (global as any).legacyBroadcast = legacyBroadcast;

  // Comprehensive Analytics API Routes
  app.get("/api/analytics/customers", isAuthenticated, async (req: any, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/analytics/daily-metrics", isAuthenticated, async (req: any, res) => {
    try {
      const metrics = await storage.getDailyMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching daily metrics:", error);
      res.status(500).json({ message: "Failed to fetch daily metrics" });
    }
  });

  app.get("/api/inventory/items", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/events", isAuthenticated, async (req: any, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/security/incidents", isAuthenticated, async (req: any, res) => {
    try {
      const incidents = await storage.getSecurityIncidents();
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching security incidents:", error);
      res.status(500).json({ message: "Failed to fetch security incidents" });
    }
  });

  app.get("/api/marketing/promotions", isAuthenticated, async (req: any, res) => {
    try {
      const promotions = await storage.getPromotions();
      res.json(promotions);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  app.get("/api/analytics/staff-performance", isAuthenticated, async (req: any, res) => {
    try {
      const performance = await storage.getStaffPerformance();
      res.json(performance);
    } catch (error) {
      console.error("Error fetching staff performance:", error);
      res.status(500).json({ message: "Failed to fetch staff performance" });
    }
  });

  app.get("/api/equipment/inventory", isAuthenticated, async (req: any, res) => {
    try {
      const equipment = await storage.getEquipmentInventory();
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });

  app.get("/api/financial/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const expenses = await storage.getBusinessExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get("/api/customers/visits", isAuthenticated, async (req: any, res) => {
    try {
      const visits = await storage.getCustomerVisits();
      res.json(visits);
    } catch (error) {
      console.error("Error fetching customer visits:", error);
      res.status(500).json({ message: "Failed to fetch customer visits" });
    }
  });

  app.get("/api/compliance/documents", isAuthenticated, async (req: any, res) => {
    try {
      const documents = await storage.getComplianceDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching compliance documents:", error);
      res.status(500).json({ message: "Failed to fetch compliance documents" });
    }
  });

  app.get("/api/maintenance/schedules", isAuthenticated, async (req: any, res) => {
    try {
      const schedules = await storage.getMaintenanceSchedules();
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching maintenance schedules:", error);
      res.status(500).json({ message: "Failed to fetch maintenance schedules" });
    }
  });

  // AI Optimization Analysis Routes
  app.post('/api/ai/analyze-codebase', isAuthenticated, async (req: any, res) => {
    try {
      const { analyzeCodebase, generateImplementationPlan } = await import('./ai-optimization-service');
      
      // Get user role to ensure only authorized users can perform analysis
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !['superuser', 'owner', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized: Analysis requires admin privileges" });
      }

      // Gather comprehensive codebase information
      const fs = await import('fs');
      const path = await import('path');

      const schemaContent = fs.readFileSync(path.join(process.cwd(), 'shared/schema.ts'), 'utf8');
      const routesContent = fs.readFileSync(path.join(process.cwd(), 'server/routes.ts'), 'utf8');
      const dashboardContent = fs.readFileSync(path.join(process.cwd(), 'client/src/pages/dashboard.tsx'), 'utf8');
      const packageContent = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8');
      const replitMdContent = fs.readFileSync(path.join(process.cwd(), 'replit.md'), 'utf8');

      const codebaseInfo = {
        schema: schemaContent.substring(0, 4000), // Limit for AI processing
        routes: routesContent.substring(0, 3000),
        frontend: dashboardContent.substring(0, 2000),
        packageJson: packageContent,
        projectDescription: replitMdContent.substring(0, 2000)
      };

      const analysis = await analyzeCodebase(codebaseInfo);
      const implementationPlan = await generateImplementationPlan(analysis);

      res.json({
        analysis,
        implementationPlan,
        timestamp: new Date().toISOString(),
        analyzedBy: user.email
      });
    } catch (error) {
      console.error("Error analyzing codebase:", error);
      res.status(500).json({ 
        message: "Failed to analyze codebase", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  return httpServer;
}
