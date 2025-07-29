import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertFinancialRecordSchema, insertTimeClockSchema, insertTaskSchema, insertMessageSchema, insertMusicRequestSchema, insertScheduleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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
      const currentStaff = await storage.getCurrentlyWorking();
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
      
      const entry = await storage.createTimeClockEntry(data);
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
      
      const entry = await storage.updateTimeClockEntry(activeEntry.id, {
        clockOutTime: new Date(),
        notes,
        isActive: false,
      });
      
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
      const data = insertMessageSchema.parse({
        ...req.body,
        senderId,
      });
      
      const message = await storage.createMessage(data);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
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
      const updatedUser = await storage.updateUser(id, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating staff:", error);
      res.status(500).json({ message: "Failed to update staff" });
    }
  });

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

  return httpServer;
}
