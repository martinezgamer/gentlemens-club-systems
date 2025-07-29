import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import * as aiService from "./ai-service";
import { aiApplicationService } from "./ai-application-service";
import superuserRoutes from "./routes/superuser";
import { insertFinancialRecordSchema, insertTimeClockSchema, insertTaskSchema, insertMessageSchema, insertMusicRequestSchema, insertScheduleSchema, insertDancerApplicationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Custom login endpoint for superuser with case-insensitive authentication  
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Normalize email to lowercase for case-insensitive comparison
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check for the superuser account (case-insensitive)
      if (normalizedEmail === 'maritnezgamer@gmail.com' && password === 'Chicago@21') {
        // Create mock session for superuser that mimics OIDC structure
        const mockUser = {
          claims: {
            sub: 'superuser-maritnez',
            email: 'maritnezgamer@gmail.com',
            first_name: 'Superuser',
            last_name: 'Admin',
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days from now
          },
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
        };
        
        // Store user in session like passport would
        req.user = mockUser;
        req.session.passport = { user: mockUser };
        
        // Ensure user exists in database
        await storage.upsertUser({
          id: 'superuser-maritnez',
          email: 'maritnezgamer@gmail.com',
          firstName: 'Superuser',
          lastName: 'Admin',
          role: 'superuser',
          clubLocation: 'club_1',
          isActive: true,
          profileCompleted: true,
        });
        
        const user = await storage.getUser('superuser-maritnez');
        res.json({ success: true, user });
      } else {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin route to update user role
  app.post('/api/admin/update-role', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { userId, role } = req.body;
      
      // For now, allow any authenticated user to set themselves as owner
      // In production, this would have proper role-based authorization
      if (currentUserId === userId || !userId) {
        const targetUserId = userId || currentUserId;
        const updatedUser = await storage.updateUserRole(targetUserId, role);
        res.json(updatedUser);
      } else {
        res.status(403).json({ message: "Forbidden" });
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
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
      const data = insertFinancialRecordSchema.parse({
        ...req.body,
        userId,
      });
      
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
      const records = await storage.getFinancialRecords(userId);
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

  // Staff management routes
  app.get('/api/staff', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only allow managers and owners to view all staff
      if (user?.role !== 'owner' && user?.role !== 'manager') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const staff = await storage.getAllStaff();
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.patch('/api/staff/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only allow managers and owners to update staff
      if (user?.role !== 'owner' && user?.role !== 'manager') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { id } = req.params;
      const updates = req.body;
      // For basic updates like role changes, we'll use the existing update method
      const updatedUser = await storage.updateUserRole(id, updates.role || 'dancer');
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating staff:", error);
      res.status(500).json({ message: "Failed to update staff" });
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
      // Filter for external customers or use empty array if no customer data exists
      const customerData = allUsers.filter(user => user.role === 'dancer') || [];
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
        storage.getAllUsers().then(users => users.filter(u => u.role === 'dancer')),
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

  // Broadcast function for real-time updates
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Store broadcast function for use in other parts of the app
  (global as any).broadcast = broadcast;

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

  return httpServer;
}
