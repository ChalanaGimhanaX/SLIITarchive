import {
  ChevronDown,
  FileText,
  Gavel,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";

export default function Upload() {
  return (
    <main className="min-h-[calc(100vh-80px)] px-4 pt-24 pb-16 font-sans flex flex-col items-center">
      {/* Content Header */}
      <div className="max-w-3xl w-full mb-12 text-center">
        <h1 className="mb-4 text-4xl md:text-5xl font-semibold tracking-tight text-on-surface">Contribute to the Archive</h1>
        <p className="text-lg text-on-surface-variant">Help fellow students by sharing your lecture notes, past papers, or research materials.</p>
      </div>

      {/* Central Upload Interface */}
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Section */}
        <div className="lg:col-span-12">
          <div className="bg-surface-container-lowest rounded-2xl p-8 md:p-12 border border-outline-variant/20 shadow-xl">
            <form className="space-y-10">
              {/* Upload Zone */}
              <div className="relative group">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-outline-variant rounded-xl bg-surface-container hover:bg-surface-container-high transition-all cursor-pointer group-hover:border-primary/50" htmlFor="file-upload">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                      <UploadCloud className="w-8 h-8 text-primary" />
                    </div>
                    <p className="mb-2 text-lg font-semibold text-on-surface">Drop your files here</p>
                    <p className="text-sm text-on-surface-variant">PDF, DOCX, or PNG (Max. 50MB)</p>
                  </div>
                  <input className="hidden" id="file-upload" type="file" />
                </label>
              </div>

              {/* Form Fields Asymmetric Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-bold uppercase tracking-widest text-primary">Document Title</label>
                  <input className="w-full bg-surface-container-low border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 rounded-xl px-4 py-4 text-on-surface placeholder:text-on-surface-variant/40 transition-all" placeholder="e.g. Advanced Mathematics Quiz 2023" type="text" />
                </div>
                
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-bold uppercase tracking-widest text-primary">Document Type</label>
                  <div className="relative">
                    <select defaultValue="" className="w-full bg-surface-container-low border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 rounded-xl px-4 py-4 text-on-surface appearance-none cursor-pointer">
                      <option disabled value="">Select category</option>
                      <option value="note">Lecture Note</option>
                      <option value="past_paper">Past Paper</option>
                      <option value="tutorial">Tutorial</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-xs font-bold uppercase tracking-widest text-primary">Academic Year</label>
                  <div className="relative">
                    <select defaultValue="" className="w-full bg-surface-container-low border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 rounded-xl px-4 py-4 text-on-surface appearance-none cursor-pointer">
                      <option disabled value="">Select Year</option>
                      <option value="Y1S1">Y1 S1</option>
                      <option value="Y1S2">Y1 S2</option>
                      <option value="Y2S1">Y2 S1</option>
                      <option value="Y2S2">Y2 S2</option>
                      <option value="Y3S1">Y3 S1</option>
                      <option value="Y3S2">Y3 S2</option>
                      <option value="Y4S1">Y4 S1</option>
                      <option value="Y4S2">Y4 S2</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-xs font-bold uppercase tracking-widest text-primary">Module Code</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                    <input className="w-full bg-surface-container-low border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 rounded-xl pl-12 pr-4 py-4 text-on-surface placeholder:text-on-surface-variant/40 transition-all" placeholder="Search module (e.g. IT1010, SE2020)" type="text" />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="ml-1 text-xs font-bold uppercase tracking-widest text-primary">Description (Optional)</label>
                  <textarea 
                    className="w-full bg-surface-container-low border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 rounded-xl px-4 py-4 text-on-surface placeholder:text-on-surface-variant/40 transition-all min-h-[100px]" 
                    placeholder="Add any helpful context, specific topics covered, or notes about the document quality..."
                  ></textarea>
                </div>
              </div>

              {/* Submission Footer */}
              <div className="pt-6 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <ShieldCheck className="h-5 w-5 text-tertiary" />
                  <p className="text-sm">Files will be reviewed before appearing in the public archive.</p>
                </div>
                <button className="w-full md:w-auto bg-primary text-on-primary px-10 py-5 rounded-xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" type="submit">
                  Submit Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Guidelines Hint (Bento Style) */}
      <div className="max-w-4xl w-full mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low border border-outline-variant/10 p-6 rounded-xl flex items-start gap-4">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-tighter">High Quality</h3>
            <p className="text-xs text-on-surface-variant mt-1">Ensure text is legible and scans are clear for indexing.</p>
          </div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/10 p-6 rounded-xl flex items-start gap-4">
          <Gavel className="h-5 w-5 text-primary shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-tighter">Ownership</h3>
            <p className="text-xs text-on-surface-variant mt-1">Only upload content you have permission to share.</p>
          </div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/10 p-6 rounded-xl flex items-start gap-4">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-tighter">Metadata</h3>
            <p className="text-xs text-on-surface-variant mt-1">Accurate titles help others find your resources faster.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
