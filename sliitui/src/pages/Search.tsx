import { useEffect, useState } from "react";
import { startTransition, useDeferredValue } from "react";
import { ChevronLeft, ChevronRight, Download, Filter, Grid, List, Search } from "lucide-react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router-dom";

import { apiRequest } from "@/src/api/client";
import { PdfPreview } from "@/src/components/PdfPreview";
import type { DocumentRecord, Faculty, PaginatedResponse } from "@/src/api/types";
import { formatBytes, formatDate, formatLabel, resolveFileUrl, handleFileDownload } from "@/src/lib/archive";
import { cn } from "@/src/lib/utils";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [documentType, setDocumentType] = useState(searchParams.get("type") ?? "");
  const [facultyId, setFacultyId] = useState(searchParams.get("faculty") ?? "");
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [results, setResults] = useState<DocumentRecord[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (query.trim()) nextParams.set("q", query.trim());
    if (documentType) nextParams.set("type", documentType);
    if (facultyId) nextParams.set("faculty", facultyId);
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [facultyId, documentType, query, searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    async function loadFaculties() {
      try {
        const response = await apiRequest<PaginatedResponse<Faculty>>("taxonomy/faculties/");
        if (!cancelled) setFaculties(response.results);
      } catch {
        if (!cancelled) setFaculties([]);
      }
    }
    void loadFaculties();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    async function loadResults() {
      try {
        const response = await apiRequest<PaginatedResponse<DocumentRecord>>("documents/", {
          query: { q: deferredQuery, document_type: documentType || undefined, faculty: facultyId || undefined },
          signal: controller.signal,
        });
        startTransition(() => {
          setResults(response.results);
          setResultCount(response.count);
        });
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : "Could not load documents.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadResults();
    return () => controller.abort();
  }, [deferredQuery, documentType, facultyId]);

  return (
    <div className="max-w-7xl mx-auto pt-24 pb-12 px-6 flex gap-8">
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <div className="sticky top-24 space-y-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">Filter by</h3>
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm font-semibold text-primary">Keyword</p>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
                  <input type="text" className="w-full bg-surface-low border border-white/5 rounded-lg py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Module code or topic" />
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-semibold text-primary">Document Type</p>
                <div className="space-y-2">
                  {[{ value: "", label: "All documents" }, { value: "past_paper", label: "Past papers" }, { value: "note", label: "Notes" }, { value: "tutorial", label: "Tutorials" }].map((type) => (
                    <label key={type.value || "all"} className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="documentType" className="rounded border-white/10 bg-surface-low text-primary focus:ring-primary/20" checked={documentType === type.value} onChange={() => setDocumentType(type.value)} />
                      <span className="text-sm text-secondary group-hover:text-primary transition-colors">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-semibold text-primary">Faculty</p>
                <select className="w-full bg-surface-low border border-white/5 rounded-lg text-sm text-secondary focus:ring-2 focus:ring-primary/20 py-2.5 outline-none" value={facultyId} onChange={(event) => setFacultyId(event.target.value)}>
                  <option value="">All faculties</option>
                  {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
                </select>
              </div>
              <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-secondary hover:text-primary hover:border-primary/30 transition-all" onClick={() => { setQuery(""); setDocumentType(""); setFacultyId(""); }} type="button">
                <Filter className="w-4 h-4" />
                Reset filters
              </button>
            </div>
          </div>
        </div>
      </aside>

      <section className="flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-on-surface tracking-tight">Search Results</h1>
            <p className="text-sm text-secondary mt-1">
              {isLoading ? "Searching the archive..." : `Showing ${resultCount} documents`}
              {query ? <> for <span className="text-primary">"{query}"</span></> : null}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-surface-low p-1 rounded-xl border border-white/5">
            <button className={cn("p-2 rounded-lg transition-colors", viewMode === "grid" ? "bg-surface-high text-primary" : "text-secondary")} onClick={() => setViewMode("grid")} type="button"><Grid className="w-5 h-5" /></button>
            <button className={cn("p-2 rounded-lg transition-colors", viewMode === "list" ? "bg-surface-high text-primary" : "text-secondary")} onClick={() => setViewMode("list")} type="button"><List className="w-5 h-5" /></button>
          </div>
        </div>

        {error ? <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">{error}</div> : null}

        {isLoading ? (
          <div className="rounded-2xl border border-white/5 bg-surface-low p-12 text-center text-secondary">Loading archive results...</div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-surface-low p-12 text-center text-secondary">No documents matched that search yet.</div>
        ) : (
          <div className={cn(viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4")}>
            {results.map((doc, index) => (
              <motion.article key={doc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className={cn("group p-6 rounded-2xl border border-white/5 transition-all duration-300 hover:bg-surface-high relative overflow-hidden flex justify-between gap-6", viewMode === "grid" ? "bg-surface-low flex-col" : "bg-surface-low flex-col md:flex-row md:items-center")}>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <PdfPreview file={doc.file} title={doc.title} className="h-36" />
                    <span className="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{formatLabel(doc.status)}</span>
                  </div>
                  <h2 className="text-lg font-bold text-on-surface leading-tight mb-2">{doc.title}</h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-[11px] font-bold bg-surface-high text-secondary px-2 py-0.5 rounded uppercase">{doc.module}</span>
                    <span className="text-[11px] font-bold bg-surface-high text-secondary px-2 py-0.5 rounded uppercase">{formatLabel(doc.document_type)}</span>
                  </div>
                  <p className="text-sm text-secondary leading-6">{doc.description || doc.extracted_text.slice(0, 180) || "No preview available yet."}</p>
                </div>
                <div className={cn("flex flex-col justify-between", viewMode === "list" ? "md:w-64" : "") }>
                  <div className="text-[11px] text-secondary">
                    <p className="font-medium text-on-surface/70">Uploaded {formatDate(doc.uploaded_at)}</p>
                    <p>By {doc.uploader}</p>
                    <p>{formatBytes(doc.file_size)}</p>
                  </div>
                  <a className="mt-4 bg-surface-high text-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-background transition-all active:scale-95 border border-white/5" href={resolveFileUrl(doc.file)} onClick={(e) => { e.preventDefault(); handleFileDownload(resolveFileUrl(doc.file), doc.title, doc.id); }} target="_blank" rel="noreferrer"><Download className="w-4 h-4" />Download</a>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        <div className="mt-12 flex items-center justify-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-secondary hover:bg-surface-high transition-colors" type="button"><ChevronLeft className="w-5 h-5" /></button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all bg-primary text-background">1</button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-secondary hover:bg-surface-high transition-colors" type="button"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </section>
    </div>
  );
}
