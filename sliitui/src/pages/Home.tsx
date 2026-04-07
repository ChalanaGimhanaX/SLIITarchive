import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Download, Search, User } from "lucide-react";
import { motion } from "motion/react";

import { apiRequest } from "@/src/api/client";
import { PdfPreview } from "@/src/components/PdfPreview";
import type { DocumentRecord, Faculty, ModuleRecord, PaginatedResponse } from "@/src/api/types";
import { formatDate, resolveFileUrl, handleFileDownload } from "@/src/lib/archive";

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [recentDocs, setRecentDocs] = useState<DocumentRecord[]>([]);
  const [featuredModules, setFeaturedModules] = useState<ModuleRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      try {
        const [facultyResponse, documentResponse, moduleResponse] = await Promise.all([
          apiRequest<PaginatedResponse<Faculty>>("taxonomy/faculties/"),
          apiRequest<PaginatedResponse<DocumentRecord>>("documents/"),
          apiRequest<PaginatedResponse<ModuleRecord>>("taxonomy/modules/"),
        ]);

        if (!cancelled) {
          setFaculties(facultyResponse.results.slice(0, 4));
          setRecentDocs(documentResponse.results.slice(0, 3));
          setFeaturedModules(moduleResponse.results.slice(0, 4));
        }
      } catch {
        if (!cancelled) {
          setFaculties([]);
          setRecentDocs([]);
          setFeaturedModules([]);
        }
      }
    }

    void loadHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  }

  return (
    <div className="min-h-screen">
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,#031d4b_0%,transparent_70%)] opacity-50" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl w-full space-y-8"
        >
          <h1 className="text-5xl md:text-7xl font-semibold text-on-surface tracking-tight leading-tight">
            Every piece of knowledge,
            <br />
            <span className="text-primary">curated for you.</span>
          </h1>

          <form className="relative max-w-2xl mx-auto group" onSubmit={handleSearch}>
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-6 h-6" />
            <input
              className="w-full pl-16 pr-6 py-6 rounded-full bg-surface-low border border-white/5 shadow-2xl focus:ring-2 focus:ring-primary/20 text-lg placeholder:text-secondary transition-all"
              placeholder="Search by module code, title, or keyword..."
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </form>

          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <span className="text-sm text-secondary font-medium">Popular:</span>
            {featuredModules.map((module) => (
              <button
                key={module.id}
                className="px-4 py-1.5 rounded-full bg-surface-high text-primary text-xs font-bold hover:bg-surface-highest transition-colors"
                onClick={() => navigate(`/search?q=${encodeURIComponent(module.code)}`)}
                type="button"
              >
                {module.code}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-2">
            <h2 className="text-4xl font-semibold text-on-surface tracking-tighter">Browse by Faculty</h2>
            <p className="text-secondary max-w-md">
              Explore the public archive through the academic structure already managed inside Django.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {faculties.map((faculty, index) => (
            <motion.button
              key={faculty.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="md:col-span-2 group relative overflow-hidden rounded-2xl bg-surface-low p-8 h-64 flex flex-col justify-end transition-all hover:-translate-y-1 border border-white/5 text-left"
              onClick={() => navigate(`/search?faculty=${faculty.id}`)}
              type="button"
            >
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <BookOpen className="w-10 h-10 text-primary" />
                  <ArrowRight className="w-6 h-6 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-on-surface">{faculty.name}</h3>
                  <p className="text-secondary text-sm">{faculty.is_active ? "Active faculty collection" : "Currently hidden"}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="bg-surface-low py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl font-semibold text-on-surface tracking-tighter">Recently Added</h2>
            <Link to="/search" className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentDocs.map((doc, index) => (
              <motion.article
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="bg-background p-6 rounded-2xl border border-white/5 group transition-all hover:bg-surface-high"
              >
                <div className="mb-4">
                  <PdfPreview file={doc.file} title={doc.title} className="h-32" />
                  <span className="mt-2 block text-[10px] uppercase tracking-widest font-bold text-secondary">
                    {formatDate(doc.uploaded_at)}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-on-surface mb-2 leading-snug group-hover:text-primary transition-colors">
                  {doc.title}
                </h4>
                <div className="flex gap-2 mb-4 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-surface-high text-[10px] font-bold text-secondary uppercase">
                    {doc.module}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-bold text-primary uppercase">
                    {doc.document_type.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-secondary" />
                    <span className="text-xs text-secondary">{doc.uploader}</span>
                  </div>
                  <a
                    className="text-secondary hover:text-primary transition-colors cursor-pointer"
                    href={resolveFileUrl(doc.file)}
                    onClick={(e) => { e.preventDefault(); handleFileDownload(resolveFileUrl(doc.file), doc.title, doc.id); }}
                    title="Download File"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
