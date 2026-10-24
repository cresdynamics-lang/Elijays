import { PageHeader } from "@/components/admin/PageHeader";

export default function NewJournalPostPage() {
  return (
    <div>
      <PageHeader title="New post" subtitle="Journal" />
      <form className="max-w-3xl space-y-4 rounded-xl border border-line bg-noir-soft/40 p-6">
        <Field label="Title" />
        <Field label="Slug" />
        <Field label="Excerpt" />
        <textarea
          rows={10}
          placeholder="Body"
          className="w-full rounded-lg border border-line bg-noir px-3 py-2 text-sm text-ivory"
        />
        <button
          type="button"
          disabled
          className="rounded-full border border-gold/40 px-6 py-2 text-xs uppercase tracking-widest text-gold opacity-60"
        >
          Publish (wire later)
        </button>
      </form>
    </div>
  );
}

function Field({ label }: { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
        {label}
      </span>
      <input className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory" />
    </label>
  );
}
