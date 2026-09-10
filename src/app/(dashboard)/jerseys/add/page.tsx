import { JerseyForm } from "@/components/jersey/jersey-form";

export default function AddJerseyPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">Add Jersey</h1>
        <p className="text-sm text-muted">Add a new jersey and its size-wise stock.</p>
      </div>
      <JerseyForm />
    </div>
  );
}
