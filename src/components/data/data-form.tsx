"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { EntryField } from "@/lib/validations/entry";

export function DataForm({
  fields,
  initialValues,
  onSubmit,
  submitLabel = "Add entry",
}: {
  fields: EntryField[];
  initialValues: Record<string, string | number>;
  onSubmit: (values: Record<string, string | number>) => Promise<void>;
  submitLabel?: string;
}) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Record<string, string | number>>({ defaultValues: initialValues });

  useEffect(() => reset(initialValues), [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.name} className={field.name === "note" ? "sm:col-span-2" : undefined}>
          <Label htmlFor={field.name}>{field.label}</Label>
          {field.type === "select" ? (
            <Select id={field.name} {...register(field.name, { required: field.required })}>
              <option value="">Select {field.label.toLowerCase()}</option>
              {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          ) : (
            <Input id={field.name} type={field.type} step={field.step} readOnly={field.readOnly} {...register(field.name, { required: field.required, valueAsNumber: field.type === "number" })} />
          )}
        </div>
      ))}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : submitLabel}</Button>
      </div>
    </form>
  );
}