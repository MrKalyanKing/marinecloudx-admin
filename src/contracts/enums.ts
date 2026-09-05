/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source of truth: packages/contracts/enums.ts
 * Regenerate:      npm run sync:contracts   (from the repo root)
 */

/**
 * The 14 domain enums.
 *
 * Values are identical to the PostgreSQL enum types created by the original
 * Prisma migration (`prisma/migrations/20260815212852_init/migration.sql`) and
 * must stay that way — the backend's TypeORM `@Column({ type: 'enum' })`
 * definitions and this file describe the same on-disk type.
 *
 * String enums (not numeric) so the wire value equals the stored value.
 */

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INVITED = "INVITED",
  SUSPENDED = "SUSPENDED",
  DISABLED = "DISABLED",
}

export enum LeadStatus {
  OPEN = "OPEN",
  WON = "WON",
  LOST = "LOST",
  ARCHIVED = "ARCHIVED",
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ActivityType {
  LEAD_CREATED = "LEAD_CREATED",
  STATUS_CHANGED = "STATUS_CHANGED",
  STAGE_CHANGED = "STAGE_CHANGED",
  ASSIGNED = "ASSIGNED",
  UNASSIGNED = "UNASSIGNED",
  CALL = "CALL",
  EMAIL = "EMAIL",
  MEETING = "MEETING",
  MESSAGE = "MESSAGE",
  WHATSAPP = "WHATSAPP",
  PROPOSAL_SENT = "PROPOSAL_SENT",
  FOLLOW_UP = "FOLLOW_UP",
  NOTE_ADDED = "NOTE_ADDED",
  TASK_CREATED = "TASK_CREATED",
  TASK_COMPLETED = "TASK_COMPLETED",
  CONVERSATION_LINKED = "CONVERSATION_LINKED",
  OTHER = "OTHER",
}

export enum ConversationStatus {
  ACTIVE = "ACTIVE",
  ENDED = "ENDED",
  ABANDONED = "ABANDONED",
  CONVERTED = "CONVERTED",
}

export enum MessageRole {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
  SYSTEM = "SYSTEM",
  TOOL = "TOOL",
}

export enum PublicationStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum ProjectStatus {
  PLANNED = "PLANNED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ON_HOLD = "ON_HOLD",
  CANCELLED = "CANCELLED",
}

export enum NotificationChannel {
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
  IN_APP = "IN_APP",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
  AUDIO = "AUDIO",
  OTHER = "OTHER",
}

export enum ProjectMediaRole {
  GALLERY = "GALLERY",
  SCREENSHOT = "SCREENSHOT",
  DIAGRAM = "DIAGRAM",
  OTHER = "OTHER",
}

export enum TechnologyCategory {
  FRONTEND = "FRONTEND",
  BACKEND = "BACKEND",
  MOBILE = "MOBILE",
  DATABASE = "DATABASE",
  AI = "AI",
  AUTOMATION = "AUTOMATION",
  CLOUD = "CLOUD",
  DEVOPS = "DEVOPS",
  ANALYTICS = "ANALYTICS",
  OTHER = "OTHER",
}
