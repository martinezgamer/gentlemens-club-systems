import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "superuser",
  "owner",
  "manager", 
  "house_mom",
  "house_dad",
  "dancer",
  "dj",
  "floor_host",
  "front_door",
  "bartender",
  "server",
  "barback"
]);

export const clubLocationEnum = pgEnum("club_location", [
  "wiggles_gentlemens_club",
  "fantasy_gentlemens_club"
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "under_review", 
  "approved",
  "rejected",
  "interview_scheduled",
  "background_check",
  "training"
]);

export const shiftTypeEnum = pgEnum("shift_type", ["day", "night"]);
export const financialTypeEnum = pgEnum("financial_type", ["tips", "house_fee", "payout", "sale"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "completed", "cancelled"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);
export const messageStatusEnum = pgEnum("message_status", ["sent", "delivered", "read"]);
export const customerTypeEnum = pgEnum("customer_type", ["regular", "vip", "member", "banned"]);
export const inventoryStatusEnum = pgEnum("inventory_status", ["in_stock", "low_stock", "out_of_stock", "discontinued"]);
export const eventTypeEnum = pgEnum("event_type", ["birthday", "bachelor_party", "corporate", "special_show", "private_party"]);
export const complianceStatusEnum = pgEnum("compliance_status", ["pending", "approved", "expired", "rejected"]);
export const promotionTypeEnum = pgEnum("promotion_type", ["discount", "free_drink", "vip_upgrade", "special_rate"]);

// Dancer Applications
export const dancerApplications = pgTable("dancer_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phoneNumber: varchar("phone_number").notNull(),
  address: text("address"),
  dateOfBirth: timestamp("date_of_birth"),
  ssn: varchar("ssn", { length: 11 }), // XXX-XX-XXXX format
  emergencyContact: varchar("emergency_contact"),
  emergencyPhone: varchar("emergency_phone"),
  stageName: varchar("stage_name"),
  experience: text("experience"),
  availability: text("availability"),
  idDocumentUrl: text("id_document_url"), // Uploaded ID document
  idDocumentType: varchar("id_document_type"), // drivers_license, passport, state_id
  clubLocation: clubLocationEnum("club_location").notNull(),
  status: applicationStatusEnum("status").default("pending"),
  interviewDate: timestamp("interview_date"),
  interviewNotes: text("interview_notes"),
  backgroundCheckStatus: varchar("background_check_status"),
  documents: text("documents"), // JSON array of additional document URLs/paths
  notes: text("notes"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  rejectedReason: text("rejected_reason"),
  isActive: boolean("is_active").default(false), // Active/inactive status after approval
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff Notes and Tracking
export const staffNotes = pgTable("staff_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").references(() => users.id).notNull(),
  noteType: varchar("note_type").notNull(), // 'performance', 'disciplinary', 'general', 'commendation'
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(false),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  clubLocation: clubLocationEnum("club_location").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Club Locations
export const clubLocations = pgTable("club_locations", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  address: text("address"),
  phoneNumber: varchar("phone_number"),
  managerEmail: varchar("manager_email"),
  isActive: boolean("is_active").default(true),
  operatingHours: text("operating_hours"), // JSON format
  createdAt: timestamp("created_at").defaultNow(),
});

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("dancer"),
  clubLocation: clubLocationEnum("club_location"),
  isActive: boolean("is_active").default(true),
  phoneNumber: varchar("phone_number"),
  address: text("address"),
  emergencyContact: varchar("emergency_contact"),
  emergencyPhone: varchar("emergency_phone"),
  registrationToken: varchar("registration_token"),
  profileCompleted: boolean("profile_completed").default(false),
  startDate: timestamp("start_date"),
  notes: text("notes"), // Staff notes and tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule management
export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  clubLocation: clubLocationEnum("club_location").notNull(),
  date: timestamp("date").notNull(),
  shiftType: shiftTypeEnum("shift_type").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isApproved: boolean("is_approved").default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Time clock entries
export const timeClockEntries = pgTable("time_clock_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  clubLocation: clubLocationEnum("club_location").notNull(),
  shiftType: shiftTypeEnum("shift_type").notNull(),
  clockInTime: timestamp("clock_in_time").notNull(),
  clockOutTime: timestamp("clock_out_time"),
  breakDuration: integer("break_duration").default(0), // minutes
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial records
export const financialRecords = pgTable("financial_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: financialTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  shiftType: shiftTypeEnum("shift_type"),
  timeClockEntryId: varchar("time_clock_entry_id").references(() => timeClockEntries.id),
  description: text("description"),
  isVisible: boolean("is_visible").default(true), // for privacy controls
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id),
  recipientRole: userRoleEnum("recipient_role"), // for group messages
  clubLocation: clubLocationEnum("club_location").notNull(),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  status: messageStatusEnum("status").default("sent"),
  isAnnouncement: boolean("is_announcement").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// Tasks
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  assignedBy: varchar("assigned_by").references(() => users.id).notNull(),
  status: taskStatusEnum("status").default("pending"),
  priority: taskPriorityEnum("priority").default("medium"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Music requests
export const musicRequests = pgTable("music_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  djId: varchar("dj_id").references(() => users.id),
  songTitle: varchar("song_title").notNull(),
  artist: varchar("artist"),
  notes: text("notes"),
  scheduledTime: timestamp("scheduled_time"),
  isApproved: boolean("is_approved").default(false),
  isPlayed: boolean("is_played").default(false),
  approvedAt: timestamp("approved_at"),
  playedAt: timestamp("played_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity logs for lap dances and VIP sessions
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dancerId: varchar("dancer_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // 'lap_dance' or 'vip_session'
  count: integer("count"), // for lap dances
  duration: integer("duration"), // minutes for VIP sessions
  amount: decimal("amount", { precision: 10, scale: 2 }),
  shiftType: shiftTypeEnum("shift_type"),
  timeClockEntryId: varchar("time_clock_entry_id").references(() => timeClockEntries.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// VIP rooms
export const vipRooms = pgTable("vip_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  isAvailable: boolean("is_available").default(true),
  currentSessionId: varchar("current_session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Registration tokens for staff invitation
export const registrationTokens = pgTable("registration_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token").unique().notNull(),
  role: userRoleEnum("role").notNull(),
  email: varchar("email"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert and Select schemas for DancerApplications
export const insertDancerApplicationSchema = createInsertSchema(dancerApplications, {
  email: z.string().email(),
  phoneNumber: z.string().min(10),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in XXX-XX-XXXX format").optional(),
  dateOfBirth: z.date().optional(),
  clubLocation: z.enum(["wiggles_gentlemens_club", "fantasy_gentlemens_club"]),
}).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  reviewedBy: true,
  approvedBy: true 
});

export const selectDancerApplicationSchema = createInsertSchema(dancerApplications);



// Relations
export const userRelations = relations(users, ({ many }) => ({
  schedules: many(schedules),
  timeClockEntries: many(timeClockEntries),
  financialRecords: many(financialRecords),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  assignedTasks: many(tasks, { relationName: "assignee" }),
  createdTasks: many(tasks, { relationName: "creator" }),
  musicRequests: many(musicRequests, { relationName: "requester" }),
  djMusicRequests: many(musicRequests, { relationName: "dj" }),
  activityLogs: many(activityLogs),
}));

export const scheduleRelations = relations(schedules, ({ one }) => ({
  user: one(users, {
    fields: [schedules.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [schedules.approvedBy],
    references: [users.id],
  }),
}));

export const timeClockEntryRelations = relations(timeClockEntries, ({ one, many }) => ({
  user: one(users, {
    fields: [timeClockEntries.userId],
    references: [users.id],
  }),
  financialRecords: many(financialRecords),
  activityLogs: many(activityLogs),
}));

export const financialRecordRelations = relations(financialRecords, ({ one }) => ({
  user: one(users, {
    fields: [financialRecords.userId],
    references: [users.id],
  }),
  timeClockEntry: one(timeClockEntries, {
    fields: [financialRecords.timeClockEntryId],
    references: [timeClockEntries.id],
  }),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const taskRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "assignee",
  }),
  creator: one(users, {
    fields: [tasks.assignedBy],
    references: [users.id],
    relationName: "creator",
  }),
}));

export const musicRequestRelations = relations(musicRequests, ({ one }) => ({
  requester: one(users, {
    fields: [musicRequests.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  dj: one(users, {
    fields: [musicRequests.djId],
    references: [users.id],
    relationName: "dj",
  }),
}));

export const activityLogRelations = relations(activityLogs, ({ one }) => ({
  dancer: one(users, {
    fields: [activityLogs.dancerId],
    references: [users.id],
  }),
  timeClockEntry: one(timeClockEntries, {
    fields: [activityLogs.timeClockEntryId],
    references: [timeClockEntries.id],
  }),
}));

// Dancer application relations
export const dancerApplicationRelations = relations(dancerApplications, ({ one }) => ({
  reviewer: one(users, {
    fields: [dancerApplications.reviewedBy],
    references: [users.id],
  }),
}));

// Staff notes relations
export const staffNoteRelations = relations(staffNotes, ({ one }) => ({
  staff: one(users, {
    fields: [staffNotes.staffId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [staffNotes.createdBy],
    references: [users.id],
  }),
}));



// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
});

export const insertTimeClockSchema = createInsertSchema(timeClockEntries).omit({
  id: true,
  createdAt: true,
});

export const insertFinancialRecordSchema = createInsertSchema(financialRecords).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertMusicRequestSchema = createInsertSchema(musicRequests).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  playedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertRegistrationTokenSchema = createInsertSchema(registrationTokens).omit({
  id: true,
  createdAt: true,
});



export const insertStaffNoteSchema = createInsertSchema(staffNotes).omit({
  id: true,
  createdAt: true,
});

export const insertClubLocationSchema = createInsertSchema(clubLocations).omit({
  id: true,
  createdAt: true,
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Notification relations
export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type DancerApplication = typeof dancerApplications.$inferSelect;
export type InsertDancerApplication = z.infer<typeof insertDancerApplicationSchema>;

export type StaffNote = typeof staffNotes.$inferSelect;
export type InsertStaffNote = z.infer<typeof insertStaffNoteSchema>;

export type ClubLocation = typeof clubLocations.$inferSelect;
export type InsertClubLocation = z.infer<typeof insertClubLocationSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type TimeClockEntry = typeof timeClockEntries.$inferSelect;
export type InsertTimeClockEntry = z.infer<typeof insertTimeClockSchema>;

export type FinancialRecord = typeof financialRecords.$inferSelect;
export type InsertFinancialRecord = z.infer<typeof insertFinancialRecordSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type MusicRequest = typeof musicRequests.$inferSelect;
export type InsertMusicRequest = z.infer<typeof insertMusicRequestSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type VipRoom = typeof vipRooms.$inferSelect;

export type RegistrationToken = typeof registrationTokens.$inferSelect;
export type InsertRegistrationToken = z.infer<typeof insertRegistrationTokenSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
