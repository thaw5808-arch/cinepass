"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { FoodCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isForeignKeyRestrictionError } from "@/lib/prisma-errors";

export type FoodItemFormState =
  | {
      errors?: Partial<Record<"name" | "category" | "price" | "imageUrl", string[]>>;
      message?: string;
    }
  | undefined;

const FoodItemFormSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }).trim(),
  category: z.enum(FoodCategory, { error: "Choose a category." }),
  price: z.coerce
    .number({ error: "Enter a price." })
    .positive({ error: "Price must be greater than 0." }),
  imageUrl: z.union([z.url({ error: "Enter a valid image URL." }), z.literal("")]).optional(),
  available: z.boolean(),
});

function parseFoodItemForm(formData: FormData) {
  return FoodItemFormSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    price: formData.get("price"),
    imageUrl: formData.get("imageUrl") || "",
    // Unchecked checkboxes aren't submitted at all — absence means false.
    available: formData.get("available") === "on",
  });
}

/** ADMIN check — independent of any page-level gate, same pattern as updateUserRoleAction in actions/users.ts. */
async function requireAdmin(): Promise<{ ok: true } | { ok: false; state: FoodItemFormState }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, state: { message: "You don't have permission to manage the food & beverage catalog." } };
  }
  return { ok: true };
}

export async function createFoodItemAction(
  _prevState: FoodItemFormState,
  formData: FormData
): Promise<FoodItemFormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const validated = parseFoodItemForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const data = validated.data;

  await prisma.foodItem.create({
    data: {
      name: data.name,
      category: data.category,
      price: data.price,
      imageUrl: data.imageUrl || null,
      available: data.available,
    },
  });

  redirect("/admin/food-beverage");
}

export async function updateFoodItemAction(
  _prevState: FoodItemFormState,
  formData: FormData
): Promise<FoodItemFormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const foodItemId = formData.get("foodItemId");
  if (typeof foodItemId !== "string" || !foodItemId) {
    return { message: "Missing food item id." };
  }

  const validated = parseFoodItemForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const data = validated.data;

  const existing = await prisma.foodItem.findUnique({ where: { id: foodItemId }, select: { id: true } });
  if (!existing) {
    return { message: "Food item not found." };
  }

  await prisma.foodItem.update({
    where: { id: foodItemId },
    data: {
      name: data.name,
      category: data.category,
      price: data.price,
      imageUrl: data.imageUrl || null,
      available: data.available,
    },
  });

  redirect("/admin/food-beverage");
}

export type ToggleFoodItemResult = { ok: true; available: boolean } | { ok: false; error: string };

/**
 * Quick inline availability flip from the table row — separate from the
 * full edit form since marking something temporarily 86'd is far more
 * common than editing its price/name/etc.
 */
export async function toggleFoodItemAvailabilityAction(
  foodItemId: string,
  available: boolean
): Promise<ToggleFoodItemResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in." };
  }
  if (user.role !== "ADMIN") {
    return { ok: false, error: "You don't have permission to manage the food & beverage catalog." };
  }

  const existing = await prisma.foodItem.findUnique({ where: { id: foodItemId }, select: { id: true } });
  if (!existing) {
    return { ok: false, error: "Food item not found." };
  }

  await prisma.foodItem.update({ where: { id: foodItemId }, data: { available } });
  return { ok: true, available };
}

export type DeleteFoodItemResult = { ok: true } | { ok: false; error: string };

export async function deleteFoodItemAction(foodItemId: string): Promise<DeleteFoodItemResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please log in." };
  }
  if (user.role !== "ADMIN") {
    return { ok: false, error: "You don't have permission to delete food items." };
  }

  const existing = await prisma.foodItem.findUnique({ where: { id: foodItemId }, select: { id: true } });
  if (!existing) {
    return { ok: false, error: "Food item not found." };
  }

  // Proactive guard: FoodOrderItem -> FoodItem has no cascade in the schema
  // (it's ON DELETE RESTRICT, same shape as Booking -> Showtime), so an
  // item with real order history would block the delete at the DB level —
  // check up front instead of surfacing a raw constraint failure.
  const orderItemCount = await prisma.foodOrderItem.count({ where: { foodItemId } });
  if (orderItemCount > 0) {
    return {
      ok: false,
      error: `Can't delete — this item has been ordered ${orderItemCount} time${orderItemCount === 1 ? "" : "s"}. Mark it unavailable instead.`,
    };
  }

  try {
    // Defense-in-depth against the count-check above being stale by the
    // time this runs (e.g. an order placed concurrently) — same
    // isForeignKeyRestrictionError fallback as deleteMovieAction.
    await prisma.foodItem.delete({ where: { id: foodItemId } });
  } catch (error) {
    if (isForeignKeyRestrictionError(error)) {
      return { ok: false, error: "Can't delete — this item has order history on file." };
    }
    throw error;
  }

  return { ok: true };
}
