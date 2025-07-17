import { execSync } from 'child_process';

console.log('Pushing schema to Neon database...');

try {
  // Use --force flag to skip confirmation
  execSync('npx drizzle-kit push --force', {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('✅ Schema pushed successfully!');
} catch (error) {
  console.error('❌ Failed to push schema:', error);
  process.exit(1);
}