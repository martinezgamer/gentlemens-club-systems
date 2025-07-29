import { Router } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { sql } from "drizzle-orm";

const router = Router();

// Superuser dashboard data
router.get("/dashboard/:clubLocation", async (req, res) => {
  try {
    const { clubLocation } = req.params;
    const user = req.user as any;

    // Check if user is superuser
    if (user?.role !== 'superuser') {
      return res.status(403).json({ message: "Access denied. Superuser role required." });
    }

    // Get dashboard metrics for the specific club
    const activeStaff = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM time_clock_entries tce 
      JOIN users u ON tce.user_id = u.id 
      WHERE tce.club_location = ${clubLocation} AND tce.is_active = true AND tce.clock_out_time IS NULL
    `);

    const unreadMessages = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM messages 
      WHERE club_location = ${clubLocation} AND status = 'sent'
    `);

    const recentActivity = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM activity_logs al
      JOIN time_clock_entries tce ON al.time_clock_entry_id = tce.id
      WHERE tce.club_location = ${clubLocation} AND al.created_at >= NOW() - INTERVAL '24 hours'
    `);

    res.json({
      activeStaff: parseInt(activeStaff[0]?.count || '0'),
      unreadMessages: parseInt(unreadMessages[0]?.count || '0'),
      recentActivity: parseInt(recentActivity[0]?.count || '0')
    });
  } catch (error) {
    console.error("Error fetching superuser dashboard:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});

// Get dancer applications for specific club
router.get("/dancer-applications/:clubLocation", async (req, res) => {
  try {
    const { clubLocation } = req.params;
    const user = req.user as any;

    if (user?.role !== 'superuser') {
      return res.status(403).json({ message: "Access denied. Superuser role required." });
    }

    const applications = await db.execute(sql`
      SELECT da.*, u.name as reviewer_name
      FROM dancer_applications da
      LEFT JOIN users u ON da.reviewed_by = u.id
      WHERE da.club_location = ${clubLocation}
      ORDER BY da.created_at DESC
    `);

    res.json(applications);
  } catch (error) {
    console.error("Error fetching dancer applications:", error);
    res.status(500).json({ message: "Failed to fetch dancer applications" });
  }
});

// Get staff notes summary for specific club
router.get("/staff-notes/summary/:clubLocation", async (req, res) => {
  try {
    const { clubLocation } = req.params;
    const user = req.user as any;

    if (user?.role !== 'superuser') {
      return res.status(403).json({ message: "Access denied. Superuser role required." });
    }

    const summary = await db.execute(sql`
      SELECT COUNT(*) as recent
      FROM staff_notes sn
      JOIN users u ON sn.staff_id = u.id
      WHERE u.club_location = ${clubLocation} AND sn.created_at >= NOW() - INTERVAL '24 hours'
    `);

    res.json({
      recent: parseInt(summary[0]?.recent || '0')
    });
  } catch (error) {
    console.error("Error fetching staff notes summary:", error);
    res.status(500).json({ message: "Failed to fetch staff notes summary" });
  }
});

export default router;