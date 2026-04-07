import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Download, FileText, Hourglass, XCircle, Plus } from "lucide-react";
import { motion } from "motion/react";

import { apiRequest } from "@/src/api/client";
import type { DocumentRecord, PaginatedResponse } from "@/src/api/types";
import { PdfPreview } from "@/src/components/PdfPreview";
import { useAuth } from "@/src/features/auth/AuthProvider";
import { formatBytes, formatDate, formatLabel, resolveFileUrl, handleFileDownload } from "@/src/lib/archive";
import { cn } from "@/src/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDocuments() {
      try {
        const response = await apiRequest<PaginatedResponse<DocumentRecord>>("documents/mine/", {
          signal: controller.signal,
        });
        setDocuments(response.results);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : "Could not load your uploads.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadDocuments();
    return () => controller.abort();
  }, []);

  const reviewDocuments = documents.filter((document) => document.status === "pending_review" || document.status === "processing");
  const approvedDocuments = documents.filter((document) => document.status === "approved");
  const rejectedDocuments = documents.filter((document) => document.status === "rejected" || document.status === "failed");
  const recentDocuments = documents.slice(0, 3);

  const stats = [
    { label: "Total Files", value: String(documents.length).padStart(2, "0"), icon: FileText, color: "text-primary", bg: "bg-primary/10" },
    { label: "Approved", value: String(approvedDocuments.length).padStart(2, "0"), icon: BadgeCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "In Review", value: String(reviewDocuments.length).padStart(2, "0"), icon: Hourglass, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Attention", value: String(rejectedDocuments.length).padStart(2, "0"), icon: XCircle, color: "text-rose-300", bg: "bg-rose-500/10" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 pb-16 pt-24">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-primary/70">Dashboard</p>
          <h1 className="text-4xl font-semibold tracking-tight text-on-surface">My Uploads</h1>
          <p className="mt-2 max-w-2xl text-sm text-secondary">
            {user?.full_name || user?.email}, welcome to your workspace. Track your submissions, check their status, and quickly spot any that need your attention.
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-background transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-primary/10"
        >
          <Plus className="h-5 w-5" />
          <span>Upload Document</span>
        </Link>
      </header>

      {error ? <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">{error}</div> : null}

      <div className="grid gap-6">
        <section className="rounded-[1.75rem] border border-white/8 bg-surface-low p-5 md:p-6 shadow-2xl">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/70">Overview</p>
              <h2 className="text-2xl font-semibold text-on-surface">Your archive workspace</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="rounded-2xl border border-white/5 bg-background/70 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-3xl font-bold text-on-surface">{stat.value}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-secondary">{stat.label}</div>
                  </div>
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", stat.bg)}>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/8 bg-surface-low p-5 md:p-6 shadow-2xl">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/70">Recent</p>
              <h2 className="text-2xl font-semibold text-on-surface">Latest uploads</h2>
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-secondary">Newest items first</span>
          </div>

          {recentDocuments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-background/40 p-6 text-sm text-secondary">No uploads yet. Start from the upload page and this panel will fill in automatically.</div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {recentDocuments.map((item) => (
                <article key={item.id} className="flex flex-col h-full rounded-2xl border border-white/5 bg-background/70 p-4">
                  <PdfPreview file={item.file} title={item.title} className="h-32" />
                  <div className="flex flex-col flex-1 mt-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold leading-snug text-on-surface">{item.title}</h3>
                      <span className="rounded-full border border-white/10 bg-surface-high/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-secondary whitespace-nowrap">{formatLabel(item.document_type)}</span>
                    </div>
                    <p className="text-sm text-secondary flex-1">{item.module}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-secondary">{formatDate(item.uploaded_at)} - {formatBytes(item.file_size)}</p>
                    <a className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary hover:bg-primary/10" href={resolveFileUrl(item.file)} onClick={(e) => { e.preventDefault(); handleFileDownload(resolveFileUrl(item.file), item.title, item.id); }} rel="noreferrer" title="Download file"><Download className="w-3.5 h-3.5" /> Open file</a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-white/8 bg-surface-low p-0 shadow-2xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-5 md:px-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/70">Archive Table</p>
              <h2 className="text-2xl font-semibold text-on-surface">All uploads</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-background/45">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-secondary">Document</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-secondary">Preview</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-secondary">Uploaded</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-secondary">Module</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-secondary">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-secondary">Notes</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.22em] text-secondary">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr><td className="px-6 py-10 text-center text-secondary" colSpan={7}>Loading your uploads...</td></tr>
                ) : documents.length === 0 ? (
                  <tr><td className="px-6 py-10 text-center text-secondary" colSpan={7}>You have not uploaded anything yet.</td></tr>
                ) : (
                  documents.map((item) => (
                    <tr key={item.id} className="group transition-colors hover:bg-surface-high/35">
                      <td className="px-6 py-5"><div className="space-y-1"><p className="font-semibold text-on-surface">{item.title}</p><p className="text-xs uppercase tracking-[0.18em] text-secondary">{item.file_name}</p></div></td>
                      <td className="min-w-56 px-6 py-5"><PdfPreview file={item.file} title={item.title} className="h-28" /></td>
                      <td className="px-6 text-sm text-secondary py-5">{formatDate(item.uploaded_at)}</td>
                      <td className="px-6 text-sm text-secondary py-5">{item.module}</td>
                      <td className="px-6 py-5">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]", item.status === "approved" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : item.status === "pending_review" || item.status === "processing" ? "border-amber-500/20 bg-amber-500/10 text-amber-300" : "border-rose-500/20 bg-rose-500/10 text-rose-300")}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", item.status === "approved" ? "bg-emerald-300" : item.status === "pending_review" || item.status === "processing" ? "bg-amber-300" : "bg-rose-300")} />
                          {formatLabel(item.status)}
                        </span>
                      </td>
                      <td className="max-w-xs px-6 text-sm text-secondary py-5">{item.rejection_reason || item.processing_error || "Waiting for backend updates."}</td>
                      <td className="px-6 text-right py-5"><a className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary hover:bg-primary/10" href={resolveFileUrl(item.file)} onClick={(e) => { e.preventDefault(); handleFileDownload(resolveFileUrl(item.file), item.title, item.id); }} rel="noreferrer" title="Download file"><Download className="w-3.5 h-3.5" /> Preview</a></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
