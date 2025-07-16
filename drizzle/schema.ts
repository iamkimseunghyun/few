import { pgTable, foreignKey, text, timestamp, varchar, boolean, integer, json } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const reviewBookmarks = pgTable("review_bookmarks", {
	id: text().primaryKey().notNull(),
	reviewId: text("review_id").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.reviewId],
			foreignColumns: [reviews.id],
			name: "review_bookmarks_review_id_reviews_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "review_bookmarks_user_id_users_id_fk"
		}),
]);

export const reviewLikes = pgTable("review_likes", {
	id: text().primaryKey().notNull(),
	reviewId: text("review_id").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.reviewId],
			foreignColumns: [reviews.id],
			name: "review_likes_review_id_reviews_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "review_likes_user_id_users_id_fk"
		}),
]);

export const comments = pgTable("comments", {
	id: text().primaryKey().notNull(),
	reviewId: text("review_id").notNull(),
	userId: text("user_id").notNull(),
	parentId: text("parent_id"),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "comments_parent_id_comments_id_fk"
		}),
	foreignKey({
			columns: [table.reviewId],
			foreignColumns: [reviews.id],
			name: "comments_review_id_reviews_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comments_user_id_users_id_fk"
		}),
]);

export const notifications = pgTable("notifications", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	type: varchar({ length: 50 }).notNull(),
	title: text().notNull(),
	message: text().notNull(),
	relatedId: text("related_id"),
	relatedType: varchar("related_type", { length: 50 }),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}),
]);

export const reviewReports = pgTable("review_reports", {
	id: text().primaryKey().notNull(),
	reviewId: text("review_id").notNull(),
	userId: text("user_id").notNull(),
	reason: varchar({ length: 50 }).notNull(),
	description: text(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.reviewId],
			foreignColumns: [reviews.id],
			name: "review_reports_review_id_reviews_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "review_reports_user_id_users_id_fk"
		}),
]);

export const reviews = pgTable("reviews", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	eventId: text("event_id"),
	title: varchar({ length: 256 }).notNull(),
	overallRating: integer("overall_rating").notNull(),
	soundRating: integer("sound_rating"),
	viewRating: integer("view_rating"),
	safetyRating: integer("safety_rating"),
	operationRating: integer("operation_rating"),
	seatOrArea: varchar("seat_or_area", { length: 100 }),
	content: text().notNull(),
	imageUrls: json("image_urls"),
	tags: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "reviews_event_id_events_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reviews_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	username: varchar({ length: 100 }).notNull(),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const events = pgTable("events", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 256 }).notNull(),
	category: varchar({ length: 50 }),
	location: text(),
	dates: json(),
	lineup: json(),
	posterUrl: text("poster_url"),
	venueInfo: json("venue_info"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});
