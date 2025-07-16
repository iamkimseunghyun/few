import { relations } from "drizzle-orm/relations";
import { reviews, reviewBookmarks, users, reviewLikes, comments, notifications, reviewReports, events } from "./schema";

export const reviewBookmarksRelations = relations(reviewBookmarks, ({one}) => ({
	review: one(reviews, {
		fields: [reviewBookmarks.reviewId],
		references: [reviews.id]
	}),
	user: one(users, {
		fields: [reviewBookmarks.userId],
		references: [users.id]
	}),
}));

export const reviewsRelations = relations(reviews, ({one, many}) => ({
	reviewBookmarks: many(reviewBookmarks),
	reviewLikes: many(reviewLikes),
	comments: many(comments),
	reviewReports: many(reviewReports),
	event: one(events, {
		fields: [reviews.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	reviewBookmarks: many(reviewBookmarks),
	reviewLikes: many(reviewLikes),
	comments: many(comments),
	notifications: many(notifications),
	reviewReports: many(reviewReports),
	reviews: many(reviews),
}));

export const reviewLikesRelations = relations(reviewLikes, ({one}) => ({
	review: one(reviews, {
		fields: [reviewLikes.reviewId],
		references: [reviews.id]
	}),
	user: one(users, {
		fields: [reviewLikes.userId],
		references: [users.id]
	}),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	comment: one(comments, {
		fields: [comments.parentId],
		references: [comments.id],
		relationName: "comments_parentId_comments_id"
	}),
	comments: many(comments, {
		relationName: "comments_parentId_comments_id"
	}),
	review: one(reviews, {
		fields: [comments.reviewId],
		references: [reviews.id]
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const reviewReportsRelations = relations(reviewReports, ({one}) => ({
	review: one(reviews, {
		fields: [reviewReports.reviewId],
		references: [reviews.id]
	}),
	user: one(users, {
		fields: [reviewReports.userId],
		references: [users.id]
	}),
}));

export const eventsRelations = relations(events, ({many}) => ({
	reviews: many(reviews),
}));