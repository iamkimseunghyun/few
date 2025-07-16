#!/bin/bash

# Load environment variables
source .env.local

# Run the migration SQL
psql $DATABASE_URL -f drizzle/0001_pink_talon.sql

echo "Migration completed!"