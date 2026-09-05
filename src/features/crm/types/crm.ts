/**
 * Client-safe CRM types.
 *
 * TRANSITIONAL (Phase 11): the pre-monorepo file derived every type from the
 * server repositories, now in `apps/backend`. These hand-written shapes match
 * the current backend responses (`/admin/crm/config`, `/admin/dashboard`,
 * `/admin/pipeline`, `/admin/leads`, `/admin/contacts`, `/admin/tasks`). To be
 * promoted into `packages/contracts` and tightened in a follow-up.
 */

import type { LeadStatus, Priority, TaskStatus } from "@/contracts";

/* JSON has no Date — every timestamp arrives as an ISO string. */
export type Serialized<T> = T;

export interface TaxonomyRef {
  id: string;
  name: string;
  slug: string;
}
type StageRef = TaxonomyRef & { order: number; isWon: boolean; isLost: boolean };

export interface AssignableUser {
  id: string;
  name: string;
  roleSlug: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  role?: any;
}

export interface CrmConfig {
  pipelineStages: StageRef[];
  sources: (TaxonomyRef & { order: number; isActive: boolean })[];
  industries: TaxonomyRef[];
  services: { id: string; name: string; slug: string }[];
  users: AssignableUser[];
}

export interface DashboardData {
  leads: { total: number; open: number; won: number; lost: number; archived: number };
  contacts: { total: number };
  tasks: { open: number; overdue: number; dueToday: number };
  pipeline: (StageRef & { leadCount: number })[];
  recentLeads: LeadListItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentActivities: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentStageChanges: any[];
}

export interface PipelineColumn {
  stage: StageRef;
  leadCount: number;
  leads: LeadListItem[];
}

export interface PipelineBoardData {
  columns: PipelineColumn[];
  cardsPerStage: number;
}

interface ContactRef {
  jobTitle?: string | null;
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
}

export interface LeadListItem {
  id: string;
  companyName: string | null;
  status: LeadStatus;
  priority: Priority;
  requirement: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  qualificationScore: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string | null;
  timeline: string | null;
  contact: ContactRef;
  source: TaxonomyRef;
  pipelineStage: StageRef;
  assignedUser: { id: string; name: string } | null;
  service: TaxonomyRef | null;
  industry: TaxonomyRef | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface LeadDetail extends LeadListItem {
  activities: LeadActivityItem[];
  notes: LeadNoteItem[];
  tasks: LeadTaskItem[];
  conversations: LeadConversationItem[];
}

export interface ContactListItem {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  website: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { leads: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ContactDetail extends ContactListItem {
  leads: LeadListItem[];
}

export interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  leadId: string | null;
  assignedUserId: string | null;
  createdById: string | null;
  lead?: { id: string; contact: ContactRef } | null;
  assignedUser?: { id: string; name: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface LeadActivityItem {
  id: string;
  type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
  userId: string | null;
  user?: { id: string; name: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface LeadNoteItem {
  id: string;
  content: string;
  createdAt: string;
  authorId: string | null;
  author?: { id: string; name: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export type LeadTaskItem = TaskListItem;

export interface LeadConversationItem {
  id: string;
  sessionId?: string;
  status: string;
  startedAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
