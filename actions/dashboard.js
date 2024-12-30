"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };

  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }

  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }

  return serialized;
};

export async function createAccount(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized!");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found!");

    // Convert Balance to Float before saving
    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount!");
    }

    // Check if this is User's first account
    const existingUsers = await db.account.findMany({
      where: { userId: user.id },
    });

    const shouldBeDefault = existingUsers.length === 0 ? true : data.isDefault;

    // If Default, make the previous Default account as False
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create the new Account
    const newAccount = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault,
      },
    });

    // Serialize Account data before returning as NextJS does not support Decimal values
    const serializedAccount = serializeTransaction(newAccount);

    revalidatePath("/dashboard");

    return { success: true, data: serializedAccount };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getUserAccounts() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized!");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found!");

    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    const serializedAccounts = accounts.map(serializeTransaction);

    return { success: true, data: serializedAccounts };
  } catch (error) {
    throw new Error(error.message);
  }
}

export const updateDefaultAccount = async (accountId) => {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized!");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found!");

    // Make the previous Default account as False
    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    // Update the Account with given id to isDefault is true
    const updatedAccount = await db.account.update({
      where: {
        id: accountId,
        userId: user.id,
      },
      data: { isDefault: true },
    });

    const serializedAccount = serializeTransaction(updatedAccount);

    revalidatePath("/dashboard");

    return { success: true, data: serializedAccount };
  } catch (error) {
    throw new Error(error.message);
  }
};
