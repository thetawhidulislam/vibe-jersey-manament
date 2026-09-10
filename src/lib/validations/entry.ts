import { z } from "zod";

export const investmentSchema = z.object({
  investor: z.enum(["TAWHID", "OVI", "RABBI"]),
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.coerce.date({ required_error: "Date is required" }),
  note: z.string().optional(),
});

export const costSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.coerce.date({ required_error: "Date is required" }),
  note: z.string().optional(),
});

export const depositSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.coerce.date({ required_error: "Date is required" }),
  note: z.string().optional(),
});

export type EntryField = {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  readOnly?: boolean;
  step?: string;
};