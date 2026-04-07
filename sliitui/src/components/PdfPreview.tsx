import { ExternalLink, FileText } from "lucide-react";

import { resolveFileUrl } from "@/src/lib/archive";
import { cn } from "@/src/lib/utils";

interface PdfPreviewProps {
  file: string;
  title: string;
  className?: string;
}

export function PdfPreview({ file, title, className }: PdfPreviewProps) {
  const fileUrl = resolveFileUrl(file);
  const previewUrl = fileUrl ? `${fileUrl}#page=1&view=FitH` : "";

  if (!fileUrl) {
    return (
      <div className={cn("flex h-40 w-full items-center justify-center rounded-xl border border-white/10 bg-background", className)}>
        <FileText className="h-8 w-8 text-secondary" />
      </div>
    );
  }

  return (
    <div className={cn("relative h-40 w-full overflow-hidden rounded-xl border border-white/10 bg-background", className)}>
      <iframe title={`${title} preview`} src={previewUrl} className="h-full w-full" loading="lazy" />
      <a
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white hover:bg-black/75"
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
      >
        Open
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
