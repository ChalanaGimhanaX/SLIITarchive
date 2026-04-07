export type DocumentType = "past_paper" | "note" | "tutorial";

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "pending_review"
  | "approved"
  | "rejected"
  | "failed";

export type UserRole = "student" | "moderator" | "admin";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_email_verified: boolean;
}

export interface AdminUser extends User {
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface Faculty {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface DegreeProgram {
  id: number;
  name: string;
  slug: string;
  short_code: string;
  is_active: boolean;
  faculty: Faculty;
}

export interface ModuleRecord {
  id: number;
  code: string;
  title: string;
  slug: string;
  semester: string;
  academic_year: string;
  is_active: boolean;
  degree_program: DegreeProgram;
}

export interface DocumentRecord {
  id: number;
  title: string;
  document_type: DocumentType;
  status: DocumentStatus;
  module: string;
  uploader: string;
  approved_by: string | null;
  description: string;
  file: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  academic_year_label: string;
  semester_label: string;
  exam_session: string;
  is_public: boolean;
  page_count: number;
  extracted_text: string;
  processing_error: string;
  rejection_reason: string;
  uploaded_at: string;
  processed_at: string | null;
  approved_at: string | null;
}

export interface ModerationDocumentRecord {
  id: number;
  title: string;
  module: string;
  uploader: string;
  approved_by: string | null;
  document_type: DocumentType;
  status: DocumentStatus;
  file: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  page_count: number;
  processing_error: string;
  rejection_reason: string;
  uploaded_at: string;
  processed_at: string | null;
  approved_at: string | null;
}

export interface ModerationReportRecord {
  id: number;
  document: string;
  reported_by: string;
  reason: string;
  details: string;
  status: string;
  created_at: string;
}

export interface ModerationLogRecord {
  id: number;
  document: string;
  moderator: string;
  action: string;
  notes: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_visitors: number;
  visitors_last_7_days: number;
  total_page_views: number;
  page_views_last_7_days: number;
  total_downloads: number;
  downloads_last_7_days: number;
  total_users: number;
  user_roles: {
    students: number;
    moderators: number;
    admins: number;
  };
  top_downloads: Array<{
    id: number;
    title: string;
    module: string;
    downloads: number;
  }>;
  top_pages: Array<{
    path: string;
    visits: number;
  }>;
}
