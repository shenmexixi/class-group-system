import { pgTable, serial, timestamp, varchar, integer, boolean, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 学生表
export const students = pgTable(
  "students",
  {
    id: serial().primaryKey(),
    student_id: varchar("student_id", { length: 20 }).notNull().unique(),
    name: varchar("name", { length: 50 }).notNull(),
    gender: varchar("gender", { length: 10 }),
    grade: varchar("grade", { length: 20 }),
    major: varchar("major", { length: 100 }),
    class_name: varchar("class_name", { length: 50 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("students_student_id_idx").on(table.student_id),
    index("students_class_name_idx").on(table.class_name),
    index("students_name_idx").on(table.name),
  ]
);

// 分组槽位表
export const groupSlots = pgTable(
  "group_slots",
  {
    id: serial().primaryKey(),
    class_name: varchar("class_name", { length: 50 }).notNull(),
    group_number: integer("group_number").notNull(),
    slot_number: integer("slot_number").notNull(),
    student_id: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
    is_locked: boolean("is_locked").default(false).notNull(),
    is_leader: boolean("is_leader").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("group_slots_class_name_idx").on(table.class_name),
    index("group_slots_student_id_idx").on(table.student_id),
    index("group_slots_group_number_idx").on(table.group_number),
  ]
);

// 管理员表
export const admins = pgTable(
  "admins",
  {
    id: serial().primaryKey(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("admins_username_idx").on(table.username),
  ]
);

// 选座日志表
export const seatLogs = pgTable(
  "seat_logs",
  {
    id: serial().primaryKey(),
    class_name: varchar("class_name", { length: 50 }).notNull(),
    student_id: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
    student_name: varchar("student_name", { length: 50 }).notNull(),
    group_number: integer("group_number"),
    slot_number: integer("slot_number"),
    action: varchar("action", { length: 20 }).notNull(), // 'join', 'leave', 'lock', 'unlock', 'set_leader', 'remove_leader', 'move'
    details: varchar("details", { length: 500 }), // 详细信息
    ip_address: varchar("ip_address", { length: 50 }),
    user_agent: varchar("user_agent", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("seat_logs_class_name_idx").on(table.class_name),
    index("seat_logs_student_id_idx").on(table.student_id),
    index("seat_logs_action_idx").on(table.action),
    index("seat_logs_created_at_idx").on(table.created_at),
  ]
);

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
