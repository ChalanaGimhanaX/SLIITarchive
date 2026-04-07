export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 pb-20 pt-28">
      <h1 className="text-4xl font-semibold tracking-tight text-on-surface">About SLIIT Archive</h1>
      <p className="mt-4 text-secondary">
        SLIIT Archive is a student-first repository for lecture notes, tutorials, and past papers. Every upload is reviewed
        before being publicly searchable so the collection stays useful, safe, and academically relevant.
      </p>
      <section className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-surface-low p-6 text-secondary">
        <p>1. Upload PDF resources with clear titles and module mappings.</p>
        <p>2. Moderators review content quality and policy alignment.</p>
        <p>3. Approved resources appear in search for all students.</p>
      </section>
    </main>
  );
}
