-- follows 테이블에 unique constraint 추가 (중복 팔로우 방지)
ALTER TABLE "follows" ADD CONSTRAINT "unique_follow" UNIQUE ("follower_id", "following_id");

-- 자기 자신을 팔로우하는 것을 방지하는 check constraint
ALTER TABLE "follows" ADD CONSTRAINT "check_no_self_follow" CHECK ("follower_id" != "following_id");

-- 성능 개선을 위한 인덱스 추가
CREATE INDEX "idx_follows_follower_id" ON "follows" ("follower_id");
CREATE INDEX "idx_follows_following_id" ON "follows" ("following_id");
CREATE INDEX "idx_follows_created_at" ON "follows" ("created_at" DESC);