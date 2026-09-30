import type {
  ApplicationSource,
  ApplicationStatus,
  EmploymentType,
  JobStatus,
} from "@/contracts";

export interface CareersDashboard {
  total: number;
  new: number;
  underReview: number;
  shortlisted: number;
  interview: number;
  selected: number;
  rejected: number;
  byStatus: Record<ApplicationStatus, number>;
  jobId: string | null;
}

export interface JobListItem {
  id: string;
  jobCode: string;
  title: string;
  slug: string;
  department: string | null;
  location: string | null;
  employmentType: EmploymentType;
  experience: string | null;
  description: string;
  responsibilities: string | null;
  requirements: string | null;
  niceToHave: string | null;
  salaryRange: string | null;
  applicationDeadline: string | null;
  status: JobStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  applicationCount: number;
}

export interface EducationEntry {
  institution?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface WorkExperienceEntry {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string | null;
  description?: string;
  isCurrent?: boolean;
}

export interface ApplicationListItem {
  id: string;
  applicationCode: string;
  candidateName: string;
  email: string;
  phone: string | null;
  location: string | null;
  currentJobTitle: string | null;
  yearsOfExperience: number | null;
  skills: string[];
  status: ApplicationStatus;
  applicationSource: ApplicationSource;
  hasResume: boolean;
  resumeFileName: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    jobCode: string;
    title: string;
    slug: string;
    status: JobStatus;
  } | null;
}

export interface ApplicationActivity {
  id: string;
  action: string;
  description: string | null;
  oldStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus | null;
  createdAt: string;
  performedBy: { id: string; name: string } | null;
}

export interface ApplicationDetail extends ApplicationListItem {
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  summary: string | null;
  education: EducationEntry[];
  workExperience: WorkExperienceEntry[];
  coverLetter: string | null;
  noticePeriod: string | null;
  currentCtc: string | null;
  expectedCtc: string | null;
  resumeMimeType: string | null;
  resumeSize: number | null;
  resumeUploadedAt: string | null;
  activities: ApplicationActivity[];
}

export interface ResumeUrlResponse {
  url: string;
  fileName: string;
  mimeType: string;
  expiresInSeconds: number;
}
