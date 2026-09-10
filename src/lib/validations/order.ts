import { z } from "zod";

export const orderItemSchema = z.object({
  jerseyId: z.string().min(1),
  size: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(6, "Valid phone number is required"),
  customerAddress: z.string().optional(),
  assignedToId: z.string().min(1, "Assign this order to a team member"),
  items: z.array(orderItemSchema).min(1, "Add at least one jersey"),
  deliveryCharge: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
