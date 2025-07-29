import {
  users,
  timeClockEntries,
  financialRecords,
  schedules,
  messages,
  tasks,
  musicRequests,
  registrationTokens,
  activityLogs,
  vipRooms,
  dancerApplications,
  staffNotes,
  type User,
  type UpsertUser,
  type TimeClockEntry,
  type InsertTimeClockEntry,
  type FinancialRecord,
  type InsertFinancialRecord,
  type Schedule,
  type InsertSchedule,
  type Message,
  type InsertMessage,
  type Task,
  type InsertTask,
  type MusicRequest,
  type InsertMusicRequest,
  type RegistrationToken,
  type InsertRegistrationToken,
  type ActivityLog,
  type InsertActivityLog,
  type VipRoom,
  type DancerApplication,
  type InsertDancerApplication,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, desc, count, sum, isNull, ne, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Staff management
  getAllStaff(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  
  // Registration tokens
  createRegistrationToken(token: InsertRegistrationToken): Promise<RegistrationToken>;
  getRegistrationToken(token: string): Promise<RegistrationToken | undefined>;
  useRegistrationToken(id: string): Promise<RegistrationToken>;
  
  // Time clock operations
  clockIn(entry: InsertTimeClockEntry): Promise<TimeClockEntry>;
  clockOut(userId: string): Promise<TimeClockEntry>;
  getTimeClockEntries(userId: string): Promise<TimeClockEntry[]>;
  getAllTimeClockEntries(): Promise<TimeClockEntry[]>;
  getActiveTimeClockEntry(userId: string): Promise<TimeClockEntry | undefined>;
  getCurrentStaff(): Promise<(TimeClockEntry & { user: User })[]>;
  
  // Financial operations
  createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord>;
  getFinancialRecords(userId?: string, from?: Date, to?: Date): Promise<(FinancialRecord & { user: User })[]>;
  getAllFinancialRecords(): Promise<FinancialRecord[]>;
  getFinancialSummary(userId?: string, from?: Date, to?: Date): Promise<{
    totalTips: number;
    totalFees: number;
    totalPayouts: number;
    totalSales: number;
  }>;
  
  // Messaging operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUserId(userId: string): Promise<(Message & { sender: User; receiver?: User })[]>;
  getAllMessages(): Promise<Message[]>;
  getUnreadMessagesCount(userId: string): Promise<number>;
  markMessageAsRead(id: string): Promise<Message>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getAllTasks(): Promise<Task[]>;
  getTasks(assignedTo?: string, status?: string): Promise<(Task & { assignee?: User; creator: User })[]>;
  updateTaskStatus(id: string, status: string): Promise<Task>;
  
  // Schedule operations
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  getSchedules(userId?: string): Promise<(Schedule & { user: User })[]>;
  getAllSchedules(): Promise<(Schedule & { user: User })[]>;
  getSchedulesByUserId(userId: string): Promise<(Schedule & { user: User })[]>;
  updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule>;
  
  // Music request operations
  createMusicRequest(request: InsertMusicRequest): Promise<MusicRequest>;
  getMusicRequests(djId?: string): Promise<(MusicRequest & { requester: User; dj?: User })[]>;
  getAllMusicRequests(): Promise<MusicRequest[]>;
  updateMusicRequest(id: string, updates: Partial<MusicRequest>): Promise<MusicRequest>;
  
  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(dancerId?: string, from?: Date, to?: Date): Promise<(ActivityLog & { dancer: User })[]>;
  
  // VIP room operations
  getVipRooms(): Promise<VipRoom[]>;
  updateVipRoom(id: string, updates: Partial<VipRoom>): Promise<VipRoom>;
  
  // Dancer application operations
  createDancerApplication(application: InsertDancerApplication): Promise<DancerApplication>;
  getDancerApplications(clubLocation?: string): Promise<DancerApplication[]>;
  getDancerApplicationById(id: string): Promise<DancerApplication | undefined>;
  updateDancerApplicationStatus(id: string, status: string, reviewedBy: string, notes?: string): Promise<DancerApplication>;
  approveDancerApplication(id: string, approvedBy: string): Promise<DancerApplication>;
  rejectDancerApplication(id: string, rejectedBy: string, reason: string): Promise<DancerApplication>;
  getActiveDancers(clubLocation?: string): Promise<DancerApplication[]>;
  getInactiveDancers(clubLocation?: string): Promise<DancerApplication[]>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    staffOnDuty: number;
    todaysTips: number;
    vipSessions: number;
    musicRequests: number;
  }>;

  // Analytics operations
  getCustomers(): Promise<any[]>;
  getDailyMetrics(): Promise<any[]>;
  getInventoryItems(): Promise<any[]>;
  getEvents(): Promise<any[]>;
  getSecurityIncidents(): Promise<any[]>;
  getPromotions(): Promise<any[]>;
  getStaffPerformance(): Promise<any[]>;
  getEquipmentInventory(): Promise<any[]>;
  getBusinessExpenses(): Promise<any[]>;
  getCustomerVisits(): Promise<any[]>;
  getComplianceDocuments(): Promise<any[]>;
  getMaintenanceSchedules(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Staff management
  async getAllStaff(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.id, users.id));
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as any })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Registration tokens
  async createRegistrationToken(token: InsertRegistrationToken): Promise<RegistrationToken> {
    const [result] = await db.insert(registrationTokens).values(token).returning();
    return result;
  }

  async getRegistrationToken(token: string): Promise<RegistrationToken | undefined> {
    const [result] = await db
      .select()
      .from(registrationTokens)
      .where(eq(registrationTokens.token, token));
    return result;
  }

  async useRegistrationToken(id: string): Promise<RegistrationToken> {
    const [result] = await db
      .update(registrationTokens)
      .set({ isUsed: true })
      .where(eq(registrationTokens.id, id))
      .returning();
    return result;
  }

  // Time clock operations
  async clockIn(entry: InsertTimeClockEntry): Promise<TimeClockEntry> {
    const [result] = await db.insert(timeClockEntries).values(entry).returning();
    return result;
  }

  async clockOut(userId: string): Promise<TimeClockEntry> {
    const [result] = await db
      .update(timeClockEntries)
      .set({
        clockOutTime: new Date(),
        isActive: false,
      })
      .where(and(
        eq(timeClockEntries.userId, userId),
        eq(timeClockEntries.isActive, true)
      ))
      .returning();
    return result;
  }

  async getTimeClockEntries(userId: string): Promise<TimeClockEntry[]> {
    return await db
      .select()
      .from(timeClockEntries)
      .where(eq(timeClockEntries.userId, userId))
      .orderBy(desc(timeClockEntries.clockInTime));
  }

  async getAllTimeClockEntries(): Promise<TimeClockEntry[]> {
    return await db.select().from(timeClockEntries);
  }

  async getActiveTimeClockEntry(userId: string): Promise<TimeClockEntry | undefined> {
    const [entry] = await db
      .select()
      .from(timeClockEntries)
      .where(and(
        eq(timeClockEntries.userId, userId),
        eq(timeClockEntries.isActive, true)
      ));
    return entry;
  }

  async getCurrentStaff(): Promise<(TimeClockEntry & { user: User })[]> {
    const results = await db
      .select()
      .from(timeClockEntries)
      .leftJoin(users, eq(timeClockEntries.userId, users.id))
      .where(and(
        eq(timeClockEntries.isActive, true),
        isNull(timeClockEntries.clockOutTime)
      ));
    
    return results.map(row => ({ ...row.time_clock_entries, user: row.users! }));
  }

  // Financial operations
  async createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord> {
    const [result] = await db.insert(financialRecords).values(record).returning();
    return result;
  }

  async getFinancialRecords(userId?: string, from?: Date, to?: Date): Promise<(FinancialRecord & { user: User })[]> {
    const conditions = [];
    if (userId) conditions.push(eq(financialRecords.userId, userId));
    if (from) conditions.push(gte(financialRecords.createdAt, from));
    if (to) conditions.push(lte(financialRecords.createdAt, to));
    
    const query = db
      .select()
      .from(financialRecords)
      .leftJoin(users, eq(financialRecords.userId, users.id));
    
    const results = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(financialRecords.createdAt))
      : await query.orderBy(desc(financialRecords.createdAt));
    
    return results.map(row => ({ ...row.financial_records, user: row.users! }));
  }

  async getFinancialSummary(userId?: string, from?: Date, to?: Date): Promise<{
    totalTips: number;
    totalFees: number;
    totalPayouts: number;
    totalSales: number;
  }> {
    const conditions = [];
    if (userId) conditions.push(eq(financialRecords.userId, userId));
    if (from) conditions.push(gte(financialRecords.createdAt, from));
    if (to) conditions.push(lte(financialRecords.createdAt, to));
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [tips] = await db
      .select({ total: sum(financialRecords.amount) })
      .from(financialRecords)
      .where(whereClause ? and(whereClause, eq(financialRecords.type, 'tips')) : eq(financialRecords.type, 'tips'));
    
    const [fees] = await db
      .select({ total: sum(financialRecords.amount) })
      .from(financialRecords)
      .where(whereClause ? and(whereClause, eq(financialRecords.type, 'house_fee')) : eq(financialRecords.type, 'house_fee'));
    
    const [payouts] = await db
      .select({ total: sum(financialRecords.amount) })
      .from(financialRecords)
      .where(whereClause ? and(whereClause, eq(financialRecords.type, 'payout')) : eq(financialRecords.type, 'payout'));
    
    const [sales] = await db
      .select({ total: sum(financialRecords.amount) })
      .from(financialRecords)
      .where(whereClause ? and(whereClause, eq(financialRecords.type, 'sale')) : eq(financialRecords.type, 'sale'));
    
    return {
      totalTips: Number(tips?.total || 0),
      totalFees: Number(fees?.total || 0),
      totalPayouts: Number(payouts?.total || 0),
      totalSales: Number(sales?.total || 0),
    };
  }

  async getAllFinancialRecords(): Promise<FinancialRecord[]> {
    return await db.select().from(financialRecords);
  }

  // Messaging operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    return result;
  }

  async getMessagesByUserId(userId: string): Promise<(Message & { sender: User; receiver?: User })[]> {
    const results = await db
      .select()
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .leftJoin(users, eq(messages.receiverId, users.id))
      .where(or(
        eq(messages.receiverId, userId),
        eq(messages.senderId, userId)
      ))
      .orderBy(desc(messages.createdAt));
    
    return results.map(row => ({
      ...row.messages,
      sender: row.users!,
      receiver: row.users || undefined
    }));
  }

  async getUnreadMessagesCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .where(and(
        eq(messages.receiverId, userId),
        isNull(messages.readAt)
      ));
    
    return result?.count || 0;
  }

  async getAllMessages(): Promise<Message[]> {
    return await db.select().from(messages);
  }

  async markMessageAsRead(id: string): Promise<Message> {
    const [result] = await db
      .update(messages)
      .set({ readAt: new Date(), status: 'read' })
      .where(eq(messages.id, id))
      .returning();
    return result;
  }



  // Task operations
  async createTask(task: InsertTask): Promise<Task> {
    const [result] = await db.insert(tasks).values(task).returning();
    return result;
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTasks(assignedTo?: string, status?: string): Promise<(Task & { assignee?: User; creator: User })[]> {
    const conditions = [];
    if (assignedTo) conditions.push(eq(tasks.assignedTo, assignedTo));
    if (status) conditions.push(eq(tasks.status, status as any));
    
    const query = db
      .select()
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .leftJoin(users, eq(tasks.assignedBy, users.id));
    
    const results = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(tasks.createdAt))
      : await query.orderBy(desc(tasks.createdAt));
    
    return results.map(row => ({
      ...row.tasks,
      assignee: row.users || undefined,
      creator: row.users!
    }));
  }

  async updateTaskStatus(id: string, status: string): Promise<Task> {
    const updates: Partial<Task> = { status: status as any };
    if (status === 'completed') {
      updates.completedAt = new Date();
    }
    
    const [result] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return result;
  }

  // Schedule operations
  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [result] = await db.insert(schedules).values(schedule).returning();
    return result;
  }

  async getSchedules(userId?: string): Promise<(Schedule & { user: User })[]> {
    const query = db
      .select()
      .from(schedules)
      .leftJoin(users, eq(schedules.userId, users.id));
    
    const results = userId
      ? await query.where(eq(schedules.userId, userId)).orderBy(schedules.date)
      : await query.orderBy(schedules.date);
    
    return results.map(row => ({ ...row.schedules, user: row.users! }));
  }

  async getAllSchedules(): Promise<(Schedule & { user: User })[]> {
    const results = await db
      .select()
      .from(schedules)
      .leftJoin(users, eq(schedules.userId, users.id))
      .orderBy(schedules.date);
    
    return results.map(row => ({ ...row.schedules, user: row.users! }));
  }

  async getSchedulesByUserId(userId: string): Promise<(Schedule & { user: User })[]> {
    const results = await db
      .select()
      .from(schedules)
      .leftJoin(users, eq(schedules.userId, users.id))
      .where(eq(schedules.userId, userId))
      .orderBy(schedules.date);
    
    return results.map(row => ({ ...row.schedules, user: row.users! }));
  }

  async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule> {
    const [result] = await db
      .update(schedules)
      .set(updates)
      .where(eq(schedules.id, id))
      .returning();
    return result;
  }

  // Music request operations
  async createMusicRequest(request: InsertMusicRequest): Promise<MusicRequest> {
    const [result] = await db.insert(musicRequests).values(request).returning();
    return result;
  }

  async getMusicRequests(djId?: string): Promise<(MusicRequest & { requester: User; dj?: User })[]> {
    const conditions = [];
    if (djId) conditions.push(eq(musicRequests.djId, djId));
    
    const query = db
      .select()
      .from(musicRequests)
      .leftJoin(users, eq(musicRequests.requesterId, users.id))
      .leftJoin(users, eq(musicRequests.djId, users.id));
    
    const results = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(musicRequests.createdAt))
      : await query.orderBy(desc(musicRequests.createdAt));
    
    return results.map(row => ({
      ...row.music_requests,
      requester: row.users!,
      dj: row.users || undefined
    }));
  }

  async getAllMusicRequests(): Promise<MusicRequest[]> {
    return await db.select().from(musicRequests);
  }

  async updateMusicRequest(id: string, updates: Partial<MusicRequest>): Promise<MusicRequest> {
    const [result] = await db
      .update(musicRequests)
      .set(updates)
      .where(eq(musicRequests.id, id))
      .returning();
    return result;
  }

  // Activity log operations
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [result] = await db.insert(activityLogs).values(log).returning();
    return result;
  }

  async getActivityLogs(dancerId?: string, from?: Date, to?: Date): Promise<(ActivityLog & { dancer: User })[]> {
    const conditions = [];
    if (dancerId) conditions.push(eq(activityLogs.dancerId, dancerId));
    if (from) conditions.push(gte(activityLogs.createdAt, from));
    if (to) conditions.push(lte(activityLogs.createdAt, to));
    
    const query = db
      .select()
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.dancerId, users.id));
    
    const results = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(activityLogs.createdAt))
      : await query.orderBy(desc(activityLogs.createdAt));
    
    return results.map(row => ({ ...row.activity_logs, dancer: row.users! }));
  }

  // VIP room operations
  async getVipRooms(): Promise<VipRoom[]> {
    return await db.select().from(vipRooms);
  }

  async updateVipRoom(id: string, updates: Partial<VipRoom>): Promise<VipRoom> {
    const [result] = await db
      .update(vipRooms)
      .set(updates)
      .where(eq(vipRooms.id, id))
      .returning();
    return result;
  }

  // Dancer application operations
  async createDancerApplication(application: InsertDancerApplication): Promise<DancerApplication> {
    const [result] = await db.insert(dancerApplications).values({
      ...application,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result;
  }

  async getDancerApplications(clubLocation?: string): Promise<DancerApplication[]> {
    if (clubLocation) {
      return await db.select().from(dancerApplications)
        .where(eq(dancerApplications.clubLocation, clubLocation as any))
        .orderBy(desc(dancerApplications.createdAt));
    }
    return await db.select().from(dancerApplications)
      .orderBy(desc(dancerApplications.createdAt));
  }

  async getDancerApplicationById(id: string): Promise<DancerApplication | undefined> {
    const [result] = await db.select().from(dancerApplications)
      .where(eq(dancerApplications.id, id));
    return result;
  }

  async updateDancerApplicationStatus(id: string, status: string, reviewedBy: string, notes?: string): Promise<DancerApplication> {
    const [result] = await db.update(dancerApplications)
      .set({
        status: status as any,
        reviewedBy,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(dancerApplications.id, id))
      .returning();
    return result;
  }

  async approveDancerApplication(id: string, approvedBy: string): Promise<DancerApplication> {
    const [result] = await db.update(dancerApplications)
      .set({
        status: "approved",
        approvedBy,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(dancerApplications.id, id))
      .returning();
    return result;
  }

  async rejectDancerApplication(id: string, rejectedBy: string, reason: string): Promise<DancerApplication> {
    const [result] = await db.update(dancerApplications)
      .set({
        status: "rejected",
        reviewedBy: rejectedBy,
        rejectedReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(dancerApplications.id, id))
      .returning();
    return result;
  }

  async getActiveDancers(clubLocation?: string): Promise<DancerApplication[]> {
    let query = db.select().from(dancerApplications)
      .where(and(
        eq(dancerApplications.status, "approved"),
        eq(dancerApplications.isActive, true)
      ));
    
    if (clubLocation) {
      query = db.select().from(dancerApplications)
        .where(and(
          eq(dancerApplications.status, "approved"),
          eq(dancerApplications.isActive, true),
          eq(dancerApplications.clubLocation, clubLocation as any)
        ));
    }
    
    return await query.orderBy(desc(dancerApplications.createdAt));
  }

  async getInactiveDancers(clubLocation?: string): Promise<DancerApplication[]> {
    let query = db.select().from(dancerApplications)
      .where(and(
        eq(dancerApplications.status, "approved"),
        eq(dancerApplications.isActive, false)
      ));
    
    if (clubLocation) {
      query = db.select().from(dancerApplications)
        .where(and(
          eq(dancerApplications.status, "approved"),
          eq(dancerApplications.isActive, false),
          eq(dancerApplications.clubLocation, clubLocation as any)
        ));
    }
    
    return await query.orderBy(desc(dancerApplications.updatedAt));
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    staffOnDuty: number;
    todaysTips: number;
    vipSessions: number;
    musicRequests: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Staff currently on duty
    const [staffOnDutyResult] = await db
      .select({ count: count() })
      .from(timeClockEntries)
      .where(and(
        eq(timeClockEntries.isActive, true),
        isNull(timeClockEntries.clockOutTime)
      ));

    // Today's tips
    const [tipsResult] = await db
      .select({ total: sum(financialRecords.amount) })
      .from(financialRecords)
      .where(and(
        eq(financialRecords.type, 'tips'),
        gte(financialRecords.createdAt, today),
        lte(financialRecords.createdAt, tomorrow)
      ));

    // VIP sessions today
    const [vipResult] = await db
      .select({ count: count() })
      .from(activityLogs)
      .where(and(
        eq(activityLogs.type, 'vip_session'),
        gte(activityLogs.createdAt, today),
        lte(activityLogs.createdAt, tomorrow)
      ));

    // Pending music requests
    const [musicResult] = await db
      .select({ count: count() })
      .from(musicRequests)
      .where(eq(musicRequests.isApproved, false));

    return {
      staffOnDuty: staffOnDutyResult?.count || 0,
      todaysTips: Number(tipsResult?.total || 0),
      vipSessions: vipResult?.count || 0,
      musicRequests: musicResult?.count || 0,
    };
  }

  // Analytics operations
  async getCustomers(): Promise<any[]> {
    const results = await db.execute(`SELECT * FROM customers ORDER BY created_at DESC`);
    return results.rows || [];
  }

  async getDailyMetrics(): Promise<any[]> {
    const results = await db.execute(`SELECT * FROM daily_metrics ORDER BY date DESC LIMIT 30`);
    return results.rows || [];
  }

  async getInventoryItems(): Promise<any[]> {
    const results = await db.execute(`
      SELECT i.*, c.name as category_name 
      FROM inventory_items i 
      LEFT JOIN inventory_categories c ON i.category_id = c.id 
      ORDER BY i.name
    `);
    return results.rows || [];
  }

  async getEvents(): Promise<any[]> {
    const results = await db.execute(`
      SELECT e.*, c.first_name, c.last_name, v.name as room_name
      FROM events e 
      LEFT JOIN customers c ON e.customer_id = c.id 
      LEFT JOIN vip_rooms v ON e.room_id = v.id 
      ORDER BY e.event_date
    `);
    return results.rows || [];
  }

  async getSecurityIncidents(): Promise<any[]> {
    const results = await db.execute(`
      SELECT s.*, u.first_name, u.last_name 
      FROM security_incidents s 
      LEFT JOIN users u ON s.reported_by = u.id 
      ORDER BY s.incident_date DESC
    `);
    return results.rows || [];
  }

  async getPromotions(): Promise<any[]> {
    const results = await db.execute(`SELECT * FROM promotions ORDER BY created_at DESC`);
    return results.rows || [];
  }

  async getStaffPerformance(): Promise<any[]> {
    const results = await db.execute(`
      SELECT sp.*, u.first_name, u.last_name, u.role 
      FROM staff_performance sp 
      LEFT JOIN users u ON sp.user_id = u.id 
      ORDER BY sp.date DESC
    `);
    return results.rows || [];
  }

  async getEquipmentInventory(): Promise<any[]> {
    const results = await db.execute(`SELECT * FROM equipment_inventory ORDER BY equipment_name`);
    return results.rows || [];
  }

  async getBusinessExpenses(): Promise<any[]> {
    const results = await db.execute(`
      SELECT e.*, c.name as category_name 
      FROM business_expenses e 
      LEFT JOIN expense_categories c ON e.category_id = c.id 
      ORDER BY e.expense_date DESC
    `);
    return results.rows || [];
  }

  async getCustomerVisits(): Promise<any[]> {
    const results = await db.execute(`
      SELECT cv.*, c.first_name, c.last_name 
      FROM customer_visits cv 
      LEFT JOIN customers c ON cv.customer_id = c.id 
      ORDER BY cv.visit_date DESC
    `);
    return results.rows || [];
  }

  async getComplianceDocuments(): Promise<any[]> {
    const results = await db.execute(`SELECT * FROM compliance_documents ORDER BY expiry_date`);
    return results.rows || [];
  }

  async getMaintenanceSchedules(): Promise<any[]> {
    const results = await db.execute(`
      SELECT ms.*, ei.equipment_name 
      FROM maintenance_schedules ms 
      LEFT JOIN equipment_inventory ei ON ms.equipment_id = ei.id 
      ORDER BY ms.next_due
    `);
    return results.rows || [];
  }
}

export const storage = new DatabaseStorage();