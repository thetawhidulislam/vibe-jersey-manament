import { prisma } from "@/lib/prisma";
import { JerseyForm } from "@/components/jersey/jersey-form";
import { notFound } from "next/navigation";

export default async function EditJerseyPage({ params }: { params: { id: string } }) {
  const jersey = await prisma.jersey.findUnique({
    where: { id: params.id },
    include: { stocks: true },
  });

  if (!jersey) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">Edit Jersey</h1>
        <p className="text-sm text-muted">Update details, pricing, and stock.</p>
      </div>
      <JerseyForm
        jerseyId={jersey.id}
        defaultValues={{
          name: jersey.name,
          team: jersey.team,
          season: jersey.season || "",
          description: jersey.description || "",
          image: jersey.image || "",
          buyingPrice: Number(jersey.buyingPrice),
          sellingPrice: Number(jersey.sellingPrice),
          status: jersey.status,
          stocks: jersey.stocks.map((s) => ({ size: s.size, quantity: s.quantity })),
        }}
      />
    </div>
  );
}
