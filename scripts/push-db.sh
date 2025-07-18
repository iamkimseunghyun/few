#!/bin/bash
# Script to push database changes

echo "Pushing database schema changes..."
npx drizzle-kit push --force-disable-foreign-keys
echo "Database schema push completed!"