import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(DATABASE_URL);

  console.log('🧪 Testing follows table constraints...\n');

  // 테스트용 사용자 ID 가져오기
  const users = await sql`SELECT id FROM users LIMIT 2`;
  
  if (users.length < 2) {
    console.log('❌ Not enough users in database for testing');
    return;
  }

  const [user1, user2] = users;

  // 1. 정상적인 팔로우 테스트
  console.log('1️⃣ Testing normal follow...');
  try {
    // 기존 팔로우 삭제
    await sql`DELETE FROM follows WHERE follower_id = ${user1.id} AND following_id = ${user2.id}`;
    
    // 새로운 팔로우
    await sql`INSERT INTO follows (id, follower_id, following_id) VALUES (gen_random_uuid(), ${user1.id}, ${user2.id})`;
    console.log('✅ Normal follow succeeded\n');
  } catch (error: any) {
    console.log('❌ Normal follow failed:', error.message, '\n');
  }

  // 2. 중복 팔로우 테스트
  console.log('2️⃣ Testing duplicate follow (should fail)...');
  try {
    await sql`INSERT INTO follows (id, follower_id, following_id) VALUES (gen_random_uuid(), ${user1.id}, ${user2.id})`;
    console.log('❌ Duplicate follow succeeded (constraint not working!)\n');
  } catch (error: any) {
    console.log('✅ Duplicate follow prevented:', error.message, '\n');
  }

  // 3. 자기 자신 팔로우 테스트
  console.log('3️⃣ Testing self follow (should fail)...');
  try {
    await sql`INSERT INTO follows (id, follower_id, following_id) VALUES (gen_random_uuid(), ${user1.id}, ${user1.id})`;
    console.log('❌ Self follow succeeded (constraint not working!)\n');
  } catch (error: any) {
    console.log('✅ Self follow prevented:', error.message, '\n');
  }

  // 4. 인덱스 효과 확인
  console.log('4️⃣ Checking index usage...');
  const explainResult = await sql`
    EXPLAIN (ANALYZE, BUFFERS) 
    SELECT * FROM follows 
    WHERE follower_id = ${user1.id}
  `;
  
  const hasIndexScan = explainResult.some(row => 
    row['QUERY PLAN'].includes('Index Scan') || 
    row['QUERY PLAN'].includes('idx_follows_follower_id')
  );
  
  if (hasIndexScan) {
    console.log('✅ Index is being used for queries\n');
  } else {
    console.log('⚠️  Index might not be used (check query plan)\n');
  }

  // 테스트 데이터 정리
  await sql`DELETE FROM follows WHERE follower_id = ${user1.id} AND following_id = ${user2.id}`;
  
  console.log('🎉 All constraint tests completed!');
}

main().catch(console.error);