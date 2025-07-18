-- 리뷰에 미디어 타입 필드 추가
ALTER TABLE "reviews" ADD COLUMN "media_items" jsonb DEFAULT '[]'::jsonb;

-- 기존 imageUrls 데이터를 media_items로 마이그레이션
UPDATE "reviews" 
SET "media_items" = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'url', img_url,
      'type', 'image'
    )
  )
  FROM jsonb_array_elements_text("image_urls") AS img_url
)
WHERE "image_urls" IS NOT NULL AND jsonb_array_length("image_urls") > 0;