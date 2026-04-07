import { useEffect, useState } from "react";
import { Archive, ArrowLeft, BarChart3, Bell, CheckCircle, FileSearch, Plus, Search, Shield, Trash2, Users, XCircle } from "lucide-react";

import { ApiError, apiRequest } from "@/src/api/client";
import { PdfPreview } from "@/src/components/PdfPreview";
import type {
  AdminUser,
  AnalyticsSummary,
  DegreeProgram,
  DocumentRecord,
  Faculty,
  ModerationDocumentRecord,
  ModerationLogRecord,
  ModerationReportRecord,
  ModuleRecord,
  PaginatedResponse,
} from "@/src/api/types";
import { useAuth } from "@/src/features/auth/AuthProvider";
import { formatBytes, formatDate, formatDateTime, formatLabel, resolveFileUrl } from "@/src/lib/archive";
import { cn } from "@/src/lib/utils";

type ViewKey = "queue" | "taxonomy" | "users" | "metrics" | "activity";

const queueStatuses = ["pending_review", "processing", "failed", "approved", "rejected"];

export default function AdminPortal() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ViewKey>("queue");
  const [queueStatus, setQueueStatus] = useState("pending_review");
  const [searchTerm, setSearchTerm] = useState("");
  const [queue, setQueue] = useState<ModerationDocumentRecord[]>([]);
  const [reports, setReports] = useState<ModerationReportRecord[]>([]);
  const [logs, setLogs] = useState<ModerationLogRecord[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [degrees, setDegrees] = useState<DegreeProgram[]>([]);
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [stats, setStats] = useState({ totalDocuments: 0, approvedDocuments: 0, pendingDocuments: 0, userCount: 0 });
  const [facultyForm, setFacultyForm] = useState({ name: "", slug: "" });
  const [degreeForm, setDegreeForm] = useState({ faculty_id: "", name: "", slug: "", short_code: "" });
  const [moduleForm, setModuleForm] = useState({ degree_program_id: "", code: "", title: "", slug: "", semester: "", academic_year: "" });
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const isAdminUser = user?.role === "admin";
  const navItems = [
    { key: "queue" as const, label: "Moderation", icon: FileSearch },
    { key: "taxonomy" as const, label: "Taxonomy", icon: Archive },
    ...(isAdminUser ? [{ key: "users" as const, label: "Users", icon: Users }] : []),
    { key: "metrics" as const, label: "Metrics", icon: BarChart3 },
    { key: "activity" as const, label: "Activity", icon: Bell },
  ];

  useEffect(() => {
    const controller = new AbortController();

    async function loadPortal() {
      setIsLoading(true);
      setError("");

      try {
        const [
          queueResponse,
          reportsResponse,
          logsResponse,
          facultiesResponse,
          degreesResponse,
          modulesResponse,
          approvedResponse,
          pendingResponse,
          rejectedResponse,
          processingResponse,
          failedResponse,
          usersResponse,
          analyticsResponse,
        ] = await Promise.all([
          apiRequest<PaginatedResponse<ModerationDocumentRecord>>("moderation/documents/", { query: { status: queueStatus }, signal: controller.signal }),
          apiRequest<PaginatedResponse<ModerationReportRecord>>("moderation/reports/", { signal: controller.signal }),
          apiRequest<PaginatedResponse<ModerationLogRecord>>("moderation/logs/", { signal: controller.signal }),
          apiRequest<PaginatedResponse<Faculty>>("taxonomy/faculties/", { signal: controller.signal }),
          apiRequest<PaginatedResponse<DegreeProgram>>("taxonomy/degrees/", { signal: controller.signal }),
          apiRequest<PaginatedResponse<ModuleRecord>>("taxonomy/modules/", { signal: controller.signal }),
          apiRequest<PaginatedResponse<DocumentRecord>>("documents/", { query: { status: "approved" }, signal: controller.signal }),
          apiRequest<PaginatedResponse<ModerationDocumentRecord>>("moderation/documents/", { query: { status: "pending_review" }, signal: controller.signal }),
          apiRequest<PaginatedResponse<ModerationDocumentRecord>>("moderation/documents/", { query: { status: "rejected" }, signal: controller.signal }),
          apiRequest<PaginatedResponse<ModerationDocumentRecord>>("moderation/documents/", { query: { status: "processing" }, signal: controller.signal }),
          apiRequest<PaginatedResponse<ModerationDocumentRecord>>("moderation/documents/", { query: { status: "failed" }, signal: controller.signal }),
          isAdminUser ? apiRequest<PaginatedResponse<AdminUser>>("auth/users/", { signal: controller.signal }) : Promise.resolve(null),
          apiRequest<AnalyticsSummary>("analytics/summary/", { signal: controller.signal }),
        ]);

        if (controller.signal.aborted) return;

        setQueue(queueResponse.results);
        setReports(reportsResponse.results);
        setLogs(logsResponse.results);
        setFaculties(facultiesResponse.results);
        setDegrees(degreesResponse.results);
        setModules(modulesResponse.results);
        setUsers(usersResponse?.results ?? []);
        setAnalyticsSummary(analyticsResponse);
        setStats({
          totalDocuments: approvedResponse.count + pendingResponse.count + rejectedResponse.count + processingResponse.count + failedResponse.count,
          approvedDocuments: approvedResponse.count,
          pendingDocuments: pendingResponse.count,
          userCount: usersResponse?.count ?? 0,
        });
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : "Could not load admin data.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadPortal();
    return () => controller.abort();
  }, [isAdminUser, queueStatus, reloadKey]);

  const visibleQueue = queue.filter((item) => `${item.title} ${item.module} ${item.uploader}`.toLowerCase().includes(searchTerm.toLowerCase()));
  const visibleUsers = users.filter((item) => `${item.full_name} ${item.email} ${item.role}`.toLowerCase().includes(searchTerm.toLowerCase()));

  async function handleModerationAction(documentId: number, action: "approve" | "reject" | "reprocess") {
    const reason = action === "reject" ? window.prompt("Enter a rejection reason") : window.prompt("Optional note");
    if (reason === null || (action === "reject" && !reason.trim())) return;

    try {
      await apiRequest(`moderation/documents/${documentId}/${action}/`, {
        method: "POST",
        body: action === "reject" ? { reason, notes: reason } : { notes: reason },
      });
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      window.alert(requestError instanceof ApiError ? requestError.message : "Action failed.");
    }
  }

  async function createRecord(path: string, body: object, onSuccess: () => void) {
    setIsSaving(true);
    setError("");
    try {
      await apiRequest(path, { method: "POST", body });
      onSuccess();
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save this record.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDocumentDelete(documentId: number, title: string) {
    const confirmed = window.confirm(`Delete "${title}" permanently? This will remove the PDF from storage too.`);
    if (!confirmed) return;

    setDeletingDocumentId(documentId);
    setError("");
    try {
      await apiRequest(`documents/${documentId}/`, { method: "DELETE" });
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not delete this PDF.");
    } finally {
      setDeletingDocumentId(null);
    }
  }

  async function handleUserSave(userId: number) {
    const target = users.find((item) => item.id === userId);
    if (!target) return;

    setIsSaving(true);
    setError("");
    try {
      await apiRequest(`auth/users/${userId}/`, {
        method: "PATCH",
        body: { full_name: target.full_name, role: target.role, is_active: target.is_active },
      });
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save user changes.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-72 flex flex-col py-8 border-r border-white/5 bg-surface-low">
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-background"><FileSearch className="w-5 h-5" /></div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter text-on-surface">The Archive</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button key={item.key} type="button" onClick={() => setActiveView(item.key)} className={cn("w-full flex items-center gap-3 px-6 py-3 text-left transition-all", activeView === item.key ? "text-primary font-semibold bg-primary/5 border-r-2 border-primary" : "text-secondary hover:bg-white/5")}>
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-6 mt-6">
          <button type="button" onClick={() => setActiveView(isAdminUser ? "taxonomy" : "queue")} className="w-full bg-primary text-background rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-lg shadow-primary/10 hover:brightness-110 transition-all">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-semibold">{isAdminUser ? "Add Record" : "Open Queue"}</span>
          </button>
        </div>

        <div className="mt-auto px-6 border-t border-white/5 pt-6">
          <div className="flex items-center gap-3 text-secondary">
            <Shield className="w-5 h-5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{user?.role}</p>
              <p className="text-sm">{user?.full_name || user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 glass-header flex items-center justify-between px-8">
          <div className="flex items-center gap-4 w-full max-w-md">
            <button onClick={() => { window.location.href = "/"; }} className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 text-secondary transition-colors" title="Back to Home" type="button">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
              <input className="w-full bg-surface-low rounded-full py-2 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/10 transition-all text-on-surface" placeholder="Search this workspace..." type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Custom in-house admin</p>
            <p className="text-[10px] text-secondary">Session secured with analytics</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="mb-10">
            <h2 className="text-4xl font-semibold tracking-tight text-on-surface mb-2">Moderation Dashboard</h2>
            <p className="text-secondary max-w-2xl">Review submissions, manage the academic catalog, and monitor usage metrics.</p>
          </div>

          {error ? <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">{error}</div> : null}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {[
              { label: "Total Documents", value: stats.totalDocuments },
              { label: "Visitors", value: analyticsSummary?.total_visitors ?? 0 },
              { label: "Downloads", value: analyticsSummary?.total_downloads ?? 0 },
              { label: "Users", value: analyticsSummary?.total_users ?? stats.userCount },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface-low p-6 rounded-2xl border border-white/5">
                <p className="text-sm font-medium text-secondary mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-on-surface">{stat.value}</h3>
              </div>
            ))}
          </div>

          {activeView === "queue" ? (
            <section className="space-y-6">
              <div className="flex flex-wrap gap-3">
                {queueStatuses.map((status) => (
                  <button key={status} type="button" onClick={() => setQueueStatus(status)} className={cn("px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.18em] border transition-all", queueStatus === status ? "bg-primary text-background border-primary" : "border-white/10 text-secondary hover:text-primary hover:border-primary/30")}>
                    {formatLabel(status)}
                  </button>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {visibleQueue.map((item) => (
                  <article key={item.id} className="bg-surface-low rounded-2xl border border-white/5 p-6 space-y-4">
                    <PdfPreview file={item.file} title={item.title} className="h-44" />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-on-surface">{item.title}</h3>
                        <p className="text-sm text-secondary">{item.module}</p>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-[0.18em] border border-primary/20 text-primary">{formatLabel(item.status)}</span>
                    </div>
                    <div className="text-sm text-secondary space-y-1">
                      <p>Uploader: {item.uploader}</p>
                      <p>{formatBytes(item.file_size)} - {item.page_count} pages - {formatDate(item.uploaded_at)}</p>
                      {item.processing_error ? <p className="text-rose-300">{item.processing_error}</p> : null}
                      {item.rejection_reason ? <p className="text-amber-200">{item.rejection_reason}</p> : null}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <a href={resolveFileUrl(item.file)} target="_blank" rel="noreferrer" className="px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors">Preview</a>
                      <button type="button" className="px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-400 border border-emerald-400/30 hover:bg-emerald-400/10 rounded-lg transition-colors" onClick={() => void handleModerationAction(item.id, "approve")}><CheckCircle className="w-4 h-4 inline mr-1" />Approve</button>
                      <button type="button" className="px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-400 border border-red-400/30 hover:bg-red-400/10 rounded-lg transition-colors" onClick={() => void handleModerationAction(item.id, "reject")}><XCircle className="w-4 h-4 inline mr-1" />Reject</button>
                      <button type="button" className="px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors" onClick={() => void handleModerationAction(item.id, "reprocess")}>Reprocess</button>
                      <button type="button" className="px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-300 border border-rose-400/30 hover:bg-rose-500/10 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60" onClick={() => void handleDocumentDelete(item.id, item.title)} disabled={deletingDocumentId === item.id}><Trash2 className="w-4 h-4 inline mr-1" />{deletingDocumentId === item.id ? "Deleting..." : "Delete PDF"}</button>
                    </div>
                  </article>
                ))}
              </div>
              {!isLoading && visibleQueue.length === 0 ? <div className="rounded-2xl border border-white/5 bg-surface-low p-8 text-sm text-secondary">No queue items match the current status and search.</div> : null}
            </section>
          ) : null}

          {activeView === "taxonomy" ? (
            <section className="space-y-6">
              {isAdminUser ? (
                <div className="grid xl:grid-cols-3 gap-6">
                  <form className="bg-surface-low rounded-2xl border border-white/5 p-6 space-y-4" onSubmit={(event) => { event.preventDefault(); void createRecord("taxonomy/faculties/", facultyForm, () => setFacultyForm({ name: "", slug: "" })); }}>
                    <h3 className="text-lg font-bold text-on-surface">Add Faculty</h3>
                    <input className="w-full rounded-xl bg-background border border-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" placeholder="Faculty name" value={facultyForm.name} onChange={(event) => setFacultyForm({ ...facultyForm, name: event.target.value })} required />
                    <input className="w-full rounded-xl bg-background border border-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" placeholder="faculty-slug" value={facultyForm.slug} onChange={(event) => setFacultyForm({ ...facultyForm, slug: event.target.value })} required />
                    <button className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-background" type="submit" disabled={isSaving}>Create Faculty</button>
                  </form>

                  <form className="bg-surface-low rounded-2xl border border-white/5 p-6 space-y-4" onSubmit={(event) => { event.preventDefault(); void createRecord("taxonomy/degrees/", degreeForm, () => setDegreeForm({ faculty_id: "", name: "", slug: "", short_code: "" })); }}>
                    <h3 className="text-lg font-bold text-on-surface">Add Degree</h3>
                    <select className="w-full rounded-xl bg-background border border-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" value={degreeForm.faculty_id} onChange={(event) => setDegreeForm({ ...degreeForm, faculty_id: event.target.value })} required>
                      <option value="">Select faculty</option>
                      {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
                    </select>
                    <input className="w-full rounded-xl bg-background border border-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" placeholder="Degree name" value={degreeForm.name} onChange={(event) => setDegreeForm({ ...degreeForm, name: event.target.value })} required />
                    <input className="w-full rounded-xl bg-background border border-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" placeholder="degree-slug" value={degreeForm.slug} onChange={(event) => setDegreeForm({ ...degreeForm, slug: event.target.value })} required />
                    <input className="w-full rounded-xl bg-background border border-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" placeholder="Short code" value={degreeForm.short_code} onChange={(event) => setDegreeForm({ ...degreeForm, short_code: event.target.value })} required />
                    <button className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-background" type="submit" disabled={isSaving}>Create Degree</button>
                  </form>

                  <form className="bg-surface-low rounded-2xl border border-white/5 p-6 space-y-4" onSubmit={(event) => { event.preventDefault(); void createRecord("taxonomy/modules/", moduleForm, () => setModuleForm({ degree_program_id: "", code: "", title: "", slug: "", semester: "", academic_year: "" })); }}>
                    <h3 className="text-lg font-bold text-on-surface">Add Module</h3>
                    <select className="w-full rounded-xl bg-background border border-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" value={moduleForm.degree_program_id} onChange={(event) => setModuleForm({ ...moduleForm, degree_program_id: event.target.value })} required>
                      <option value="">Select degree</option>
                      {degrees.map((degree) => <option key={degree.id} value={degree.id}>{degree.short_code} - {degree.name}</option>)}
                    </select>
                    <input className="w-full rounded-xl bg-background border border-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" placeholder="Module code" value={moduleForm.code} onChange={(event) => setModuleForm({ ...moduleForm, code: event.target.value })} required />
                    <input className="w-full rounded-xl bg-background border border-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" placeholder="Module title" value={moduleForm.title} onChange={(event) => setModuleForm({ ...moduleForm, title: event.target.value })} required />
                    <input className="w-full rounded-xl bg-background border border-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" placeholder="module-slug" value={moduleForm.slug} onChange={(event) => setModuleForm({ ...moduleForm, slug: event.target.value })} required />
                    <button className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-background" type="submit" disabled={isSaving}>Create Module</button>
                  </form>
                </div>
              ) : null}

              <div className="grid xl:grid-cols-3 gap-6">
                <div className="bg-surface-low rounded-2xl border border-white/5 p-6"><h3 className="text-lg font-bold text-on-surface mb-4">Faculties</h3><div className="space-y-3">{faculties.map((faculty) => <div key={faculty.id} className="rounded-xl bg-background px-4 py-3"><p className="text-sm font-semibold text-on-surface">{faculty.name}</p><p className="text-xs text-secondary">{faculty.slug}</p></div>)}</div></div>
                <div className="bg-surface-low rounded-2xl border border-white/5 p-6"><h3 className="text-lg font-bold text-on-surface mb-4">Degrees</h3><div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">{degrees.map((degree) => <div key={degree.id} className="rounded-xl bg-background px-4 py-3"><p className="text-sm font-semibold text-on-surface">{degree.name}</p><p className="text-xs text-secondary">{degree.short_code} - {degree.faculty.name}</p></div>)}</div></div>
                <div className="bg-surface-low rounded-2xl border border-white/5 p-6"><h3 className="text-lg font-bold text-on-surface mb-4">Modules</h3><div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">{modules.map((module) => <div key={module.id} className="rounded-xl bg-background px-4 py-3"><p className="text-sm font-semibold text-on-surface">{module.code} - {module.title}</p><p className="text-xs text-secondary">{module.degree_program.short_code} - {module.semester || "Semester not set"}</p></div>)}</div></div>
              </div>
            </section>
          ) : null}

          {activeView === "users" && isAdminUser ? (
            <section className="grid xl:grid-cols-2 gap-6">
              {visibleUsers.map((member) => (
                <article key={member.id} className="bg-surface-low rounded-2xl border border-white/5 p-6 space-y-4">
                  <input className="w-full rounded-xl bg-background border border-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 text-on-surface" value={member.full_name} onChange={(event) => setUsers((current) => current.map((item) => item.id === member.id ? { ...item, full_name: event.target.value } : item))} />
                  <p className="text-sm text-secondary">{member.email}</p>
                  <div className="flex flex-wrap gap-3">
                    <select className="rounded-xl bg-background border border-white/5 px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20" value={member.role} onChange={(event) => setUsers((current) => current.map((item) => item.id === member.id ? { ...item, role: event.target.value as AdminUser["role"] } : item))}>
                      <option value="student">Student</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                    <label className="inline-flex items-center gap-2 rounded-xl bg-background border border-white/5 px-4 py-3 text-sm text-secondary">
                      <input type="checkbox" checked={member.is_active} onChange={(event) => setUsers((current) => current.map((item) => item.id === member.id ? { ...item, is_active: event.target.checked } : item))} />
                      Active
                    </label>
                    <button className="rounded-xl bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-background" type="button" onClick={() => void handleUserSave(member.id)} disabled={isSaving}>Save</button>
                  </div>
                  <p className="text-xs text-secondary">Joined {formatDate(member.date_joined)} - Last login {formatDateTime(member.last_login)}</p>
                </article>
              ))}
              {!isLoading && visibleUsers.length === 0 ? <div className="rounded-2xl border border-white/5 bg-surface-low p-8 text-sm text-secondary">No users match the current search.</div> : null}
            </section>
          ) : null}

          {activeView === "metrics" ? (
            <section className="space-y-6">
              <div className="grid lg:grid-cols-4 gap-6">
                {[
                  { label: "Visitors", value: analyticsSummary?.total_visitors ?? 0, hint: `${analyticsSummary?.visitors_last_7_days ?? 0} in last 7 days` },
                  { label: "Page Views", value: analyticsSummary?.total_page_views ?? 0, hint: `${analyticsSummary?.page_views_last_7_days ?? 0} in last 7 days` },
                  { label: "Downloads", value: analyticsSummary?.total_downloads ?? 0, hint: `${analyticsSummary?.downloads_last_7_days ?? 0} in last 7 days` },
                  { label: "Users", value: analyticsSummary?.total_users ?? 0, hint: `${analyticsSummary?.user_roles.students ?? 0} students` },
                ].map((metric) => (
                  <div key={metric.label} className="bg-surface-low p-6 rounded-2xl border border-white/5">
                    <p className="text-sm font-medium text-secondary mb-1">{metric.label}</p>
                    <h3 className="text-3xl font-bold text-on-surface">{metric.value}</h3>
                    <p className="text-xs uppercase tracking-[0.18em] text-secondary mt-2">{metric.hint}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-surface-low rounded-2xl border border-white/5 p-6">
                  <h3 className="text-lg font-bold text-on-surface mb-4">User Roles</h3>
                  <div className="space-y-3">
                    <div className="rounded-xl bg-background px-4 py-3 flex items-center justify-between"><span className="text-sm text-secondary">Students</span><span className="text-sm font-bold text-on-surface">{analyticsSummary?.user_roles.students ?? 0}</span></div>
                    <div className="rounded-xl bg-background px-4 py-3 flex items-center justify-between"><span className="text-sm text-secondary">Moderators</span><span className="text-sm font-bold text-on-surface">{analyticsSummary?.user_roles.moderators ?? 0}</span></div>
                    <div className="rounded-xl bg-background px-4 py-3 flex items-center justify-between"><span className="text-sm text-secondary">Admins</span><span className="text-sm font-bold text-on-surface">{analyticsSummary?.user_roles.admins ?? 0}</span></div>
                  </div>
                </div>

                <div className="bg-surface-low rounded-2xl border border-white/5 p-6 lg:col-span-2">
                  <h3 className="text-lg font-bold text-on-surface mb-4">Top Downloaded PDFs</h3>
                  <div className="space-y-3">
                    {analyticsSummary?.top_downloads.length ? (
                      analyticsSummary.top_downloads.map((item) => (
                        <div key={item.id} className="rounded-xl bg-background px-4 py-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{item.title}</p>
                            <p className="text-xs text-secondary mt-1">{item.module}</p>
                          </div>
                          <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{item.downloads} downloads</span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl bg-background px-4 py-4 text-sm text-secondary">No download activity recorded yet.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-surface-low rounded-2xl border border-white/5 p-6">
                <h3 className="text-lg font-bold text-on-surface mb-4">Top Pages</h3>
                <div className="grid lg:grid-cols-2 gap-4">
                  {analyticsSummary?.top_pages.length ? (
                    analyticsSummary.top_pages.map((item) => (
                      <div key={item.path} className="rounded-xl bg-background px-4 py-4 flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-on-surface break-all">{item.path}</p>
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{item.visits} visits</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-background px-4 py-4 text-sm text-secondary">No page-view activity recorded yet.</div>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {activeView === "activity" ? (
            <section className="grid lg:grid-cols-2 gap-6">
              <div className="bg-surface-low rounded-2xl border border-white/5 p-6"><h3 className="text-lg font-bold text-on-surface mb-4">Reports</h3><div className="space-y-4">{reports.map((report) => <div key={report.id} className="rounded-xl bg-background px-4 py-4"><p className="text-sm font-semibold text-on-surface">{report.document}</p><p className="text-xs text-secondary mt-1">{formatLabel(report.reason)} by {report.reported_by}</p><p className="text-xs text-secondary mt-2">{report.details || "No extra details provided."}</p></div>)}</div></div>
              <div className="bg-surface-low rounded-2xl border border-white/5 p-6"><h3 className="text-lg font-bold text-on-surface mb-4">Moderation Logs</h3><div className="space-y-4">{logs.map((log) => <div key={log.id} className="rounded-xl bg-background px-4 py-4"><p className="text-sm font-semibold text-on-surface">{log.document}</p><p className="text-xs text-secondary mt-1">{formatLabel(log.action)} by {log.moderator}</p><p className="text-xs text-secondary mt-2">{log.notes || "No note added."}</p><p className="text-[10px] uppercase tracking-[0.2em] text-secondary mt-2">{formatDateTime(log.created_at)}</p></div>)}</div></div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
