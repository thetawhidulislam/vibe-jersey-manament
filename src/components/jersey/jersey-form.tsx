"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jerseySchema, type JerseyInput } from "@/lib/validations/jersey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

export function JerseyForm({
  jerseyId,
  defaultValues,
}: {
  jerseyId?: string;
  defaultValues?: Partial<JerseyInput>;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<JerseyInput>({
    resolver: zodResolver(jerseySchema),
    defaultValues: defaultValues || {
      name: "",
      team: "",
      season: "",
      description: "",
      buyingPrice: 0,
      sellingPrice: 0,
      status: true,
      stocks: [{ size: "M", quantity: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "stocks" });
  const watchedStocks = watch("stocks");

  function nextAvailableSize() {
    const used = new Set((watchedStocks || []).map((s) => s.size));
    return SIZE_OPTIONS.find((s) => !used.has(s)) || SIZE_OPTIONS[0];
  }

  async function onSubmit(data: JerseyInput) {
    setSubmitting(true);
    try {
      const res = await fetch(jerseyId ? `/api/jerseys/${jerseyId}` : "/api/jerseys", {
        method: jerseyId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(typeof err.error === "string" ? err.error : "Could not save jersey");
      }
      toast.success(jerseyId ? "Jersey updated" : "Jersey added");
      router.push("/jerseys");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Jersey Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Jersey Name</Label>
            <Input id="name" {...register("name")} placeholder="Barcelona Home Jersey" />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="team">Team / Club</Label>
            <Input id="team" {...register("team")} placeholder="Barcelona" />
            {errors.team && <p className="mt-1 text-xs text-danger">{errors.team.message}</p>}
          </div>
          <div>
            <Label htmlFor="season">Season</Label>
            <Input id="season" {...register("season")} placeholder="2026" />
          </div>
          <div>
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" {...register("image")} placeholder="https://res.cloudinary.com/..." />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} placeholder="Optional notes" />
          </div>
          <div>
            <Label htmlFor="buyingPrice">Buying Price (৳)</Label>
            <Input
              id="buyingPrice"
              type="number"
              step="0.01"
              {...register("buyingPrice", { valueAsNumber: true })}
            />
            {errors.buyingPrice && <p className="mt-1 text-xs text-danger">{errors.buyingPrice.message}</p>}
          </div>
          <div>
            <Label htmlFor="sellingPrice">Selling Price (৳)</Label>
            <Input
              id="sellingPrice"
              type="number"
              step="0.01"
              {...register("sellingPrice", { valueAsNumber: true })}
            />
            {errors.sellingPrice && <p className="mt-1 text-xs text-danger">{errors.sellingPrice.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Size-wise Stock</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => append({ size: nextAvailableSize(), quantity: 0 })}
            disabled={fields.length >= SIZE_OPTIONS.length}
          >
            <Plus size={14} /> Add size
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((field, index) => {
            const currentSize = watchedStocks?.[index]?.size;
            const usedElsewhere = new Set(
              (watchedStocks || [])
                .filter((_, i) => i !== index)
                .map((s) => s.size)
            );
            return (
            <div key={field.id} className="flex items-end gap-3">
              <div className="w-32">
                <Label>Size</Label>
                <select
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-ink"
                  {...register(`stocks.${index}.size` as const)}
                >
                  {SIZE_OPTIONS.map((s) => (
                    <option key={s} value={s} disabled={usedElsewhere.has(s) && s !== currentSize}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  {...register(`stocks.${index}.quantity` as const, { valueAsNumber: true })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <Trash2 size={16} className="text-danger" />
              </Button>
            </div>
            );
          })}
          {errors.stocks && <p className="text-xs text-danger">{errors.stocks.message as string}</p>}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" variant="secondary" disabled={submitting}>
          {submitting ? "Saving..." : jerseyId ? "Update Jersey" : "Add Jersey"}
        </Button>
      </div>
    </form>
  );
}