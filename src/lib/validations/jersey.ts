import { z } from "zod";

export const stockInputSchema = z.object({
  size: z.string().min(1),
  quantity: z.number().int().min(0),
});

export const jerseySchema = z.object({
  name: z.string().min(1, "Jersey name is required"),
  team: z.string().min(1, "Team name is required"),
  season: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  buyingPrice: z.number().positive("Buying price must be greater than 0"),
  sellingPrice: z.number().positive("Selling price must be greater than 0"),
  status: z.boolean().default(true),
  stocks: z
    .array(stockInputSchema)
    .min(1, "Add at least one size")
    .refine(
      (stocks) => new Set(stocks.map((s) => s.size)).size === stocks.length,
      { message: "Each size can only be added once" }
    ),
});

export type JerseyInput = z.infer<typeof jerseySchema>;