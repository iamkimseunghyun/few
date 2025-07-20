// Central export file for all database schemas
// This file aggregates all modular schemas for easy importing

// Shared enums and types
export * from './schema/shared/enums';

// Core domain schemas
export * from './schema/users';
export * from './schema/events';
export * from './schema/reviews';
export * from './schema/comments';
export * from './schema/notifications';
export * from './schema/music-diary';
export * from './schema/follows';