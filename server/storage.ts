import {
  users,
  schedules,
  timeClockEntries,
  financialRecords,
  messages,
  tasks,
  musicRequests,
  activityLogs,
  vipRooms,
  registrationTokens,
  type User,
  type UpsertUser,
  type Schedule,
  type InsertSchedule,
  type TimeClockEntry,
  type InsertTimeClockEntry,
  type FinancialRecord,
  type InsertFinancialRecord,
  type Message,
  type InsertMessage,
  type Task,
  type InsertTask,
  type MusicRequest,
  type InsertMusicRequest,
  type ActivityLog,
  type InsertActivityLog,
  type VipRoom,
  type RegistrationToken,
  type InsertRegistrationToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, sum, isNull, or } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // Staff management
  getAllStaff(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  createRegistrationToken(token: InsertRegistrationToken): Promise<RegistrationToken>;
  getRegistrationToken(token: string): Promise<RegistrationToken | undefined>;
  
  // Schedule operations
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  getSchedulesByUserId(userId: string, from?: Date, to?: Date): Promise<Schedule[]>;
  getAllSchedules(from?: Date, to?: Date): Promise<(Schedule & { user: User })[]>;
  updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule>;
  
  // Time clock operations
  createTimeClockEntry(entry: InsertTimeClockEntry): Promise<TimeClockEntry>;
  getActiveTimeClockEntry(userId: string): Promise<TimeClockEntry | undefined>;
  updateTimeClockEntry(id: string, updates: Partial<TimeClockEntry>): Promise<TimeClockEntry>;
  getTimeClockEntries(userId?: string, from?: Date, to?: Date): Promise<(TimeClockEntry & { user: User })[]>;
  getCurrentlyWorking(): Promise<(TimeClockEntry & { user: User })[]>;
  
  // Financial operations
  createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord>;
  getFinancialRecords(userId?: string, from?: Date, to?: Date): Promise<(FinancialRecord & { user: User })[]>;
  getFinancialSummary(userId?: string, from?: Date, to?: Date): Promise<{
    totalTips: number;
    totalFees: number;
    totalPayouts: number;
    totalSales: number;
  }>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUserId(userId: string): Promise<(Message & { sender: User; receiver?: User })[]>;
  getUnreadMessagesCount(userId: string): Promise<number>;
  markMessageAsRead(id: string): Promise<Message>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTasks(assignedTo?: string, status?: string): Promise<(Task & { assignee?: User; creator: User })[]>;
  updateTaskStatus(id: string, status: string): Promise<Task>;
  
  // Music request operations
  createMusicRequest(request: InsertMusicRequest): Promise<MusicRequest>;
  getMusicRequests(djId?: string, pending?: boolean): Promise<(MusicRequest & { requester: User; dj?: User })[]>;
  updateMusicRequest(id: string, updates: Partial<MusicRequest>): Promise<MusicRequest>;
  
  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(dancerId?: string, from?: Date, to?: Date): Promise<(ActivityLog & { dancer: User })[]>;
  
  // VIP room operations
  getVipRooms(): Promise<VipRoom[]>;
  updateVipRoom(id: string, updates: Partial<VipRoom>): Promise<VipRoom>;
  
  // Analytics
  getDashboardMetrics(): Promise<{
    staffOnDuty: number;
    todaysTips: number;
    vipSessions: number;
    musicRequests: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        role: role as any,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllStaff(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createRegistrationToken(token: InsertRegistrationToken): Promise<RegistrationToken> {
    const [result] = await db.insert(registrationTokens).values(token).returning();
    return result;
  }

  async getRegistrationToken(token: string): Promise<RegistrationToken | undefined> {
    const [result] = await db
      .select()
      .from(registrationTokens)
      .where(and(
        eq(registrationTokens.token, token),
        eq(registrationTokens.isUsed, false),
        gte(registrationTokens.expiresAt, new Date())
      ));
    return result;
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [result] = await db.insert(schedules).values(schedule).returning();
    return result;
  }

  async getSchedulesByUserId(userId: string, from?: Date, to?: Date): Promise<Schedule[]> {
    const conditions = [eq(schedules.userId, userId)];
    
    if (from && to) {
      conditions.push(gte(schedules.date, from));
      conditions.push(lte(schedules.date, to));
    }
    
    return await db.select().from(schedules)
      .where(and(...conditions))
      .orderBy(desc(schedules.date));
  }

  async getAllSchedules(from?: Date, to?: Date): Promise<(Schedule & { user: User })[]> {
    const conditions = [];
    
    if (from && to) {
      conditions.push(gte(schedules.date, from));
      conditions.push(lte(schedules.date, to));
    }
    
    const query = db
      .select()
      .from(schedules)
      .leftJoin(users, eq(schedules.userId, users.id));
    
    const results = conditions.length > 0 
      ? await query.where(and(...conditions)).orderBy(desc(schedules.date))
      : await query.orderBy(desc(schedules.date));
    
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

  async createTimeClockEntry(entry: InsertTimeClockEntry): Promise<TimeClockEntry> {
    const [result] = await db.insert(timeClockEntries).values(entry).returning();
    return result;
  }

  async getActiveTimeClockEntry(userId: string): Promise<TimeClockEntry | undefined> {
    const [result] = await db
      .select()
      .from(timeClockEntries)
      .where(and(
        eq(timeClockEntries.userId, userId),
        eq(timeClockEntries.isActive, true),
        isNull(timeClockEntries.clockOutTime)
      ));
    return result;
  }

  async updateTimeClockEntry(id: string, updates: Partial<TimeClockEntry>): Promise<TimeClockEntry> {
    const [result] = await db
      .update(timeClockEntries)
      .set(updates)
      .where(eq(timeClockEntries.id, id))
      .returning();
    return result;
  }

  async getTimeClockEntries(userId?: string, from?: Date, to?: Date): Promise<(TimeClockEntry & { user: User })[]> {
    const conditions = [];
    if (userId) conditions.push(eq(timeClockEntries.userId, userId));
    if (from) conditions.push(gte(timeClockEntries.clockInTime, from));
    if (to) conditions.push(lte(timeClockEntries.clockInTime, to));
    
    const query = db
      .select()
      .from(timeClockEntries)
      .leftJoin(users, eq(timeClockEntries.userId, users.id));
    
    const results = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(timeClockEntries.clockInTime))
      : await query.orderBy(desc(timeClockEntries.clockInTime));
    
    return results.map(row => ({ ...row.time_clock_entries, user: row.users! }));
  }

  async getCurrentlyWorking(): Promise<(TimeClockEntry & { user: User })[]> {
    const results = await db
      .select()
      .from(timeClockEntries)
      .leftJoin(users, eq(timeClockEntries.userId, users.id))
      .where(and(
        eq(timeClockEntries.isActive, true),
        isNull(timeClockEntries.clockOutTime)
      ))
      .orderBy(timeClockEntries.clockInTime);
    
    return results.map(row => ({ ...row.time_clock_entries, user: row.users! }));
  }

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

  async markMessageAsRead(id: string): Promise<Message> {
    const [result] = await db
      .update(messages)
      .set({ readAt: new Date(), status: 'read' })
      .where(eq(messages.id, id))
      .returning();
    return result;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [result] = await db.insert(tasks).values(task).returning();
    return result;
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

  async createMusicRequest(request: InsertMusicRequest): Promise<MusicRequest> {
    const [result] = await db.insert(musicRequests).values(request).returning();
    return result;
  }

  async getMusicRequests(djId?: string, pending?: boolean): Promise<(MusicRequest & { requester: User; dj?: User })[]> {
    const conditions = [];
    if (djId) conditions.push(eq(musicRequests.djId, djId));
    if (pending) conditions.push(eq(musicRequests.isApproved, false));
    
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

  async updateMusicRequest(id: string, updates: Partial<MusicRequest>): Promise<MusicRequest> {
    const [result] = await db
      .update(musicRequests)
      .set(updates)
      .where(eq(musicRequests.id, id))
      .returning();
    return result;
  }

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
}

export const storage = new DatabaseStorage();
