ALTER TABLE "reviews" ALTER COLUMN "event_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "title" varchar(256);--> statement-breakpoint
UPDATE "reviews" SET "title" = CONCAT('리뷰 - ', LEFT("content", 50)) WHERE "title" IS NULL;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "title" SET NOT NULL;