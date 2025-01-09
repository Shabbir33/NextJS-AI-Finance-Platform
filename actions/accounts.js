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

export async function getTableTransactions(
  accountId,
  page,
  pageSize,
  sortField,
  sortDirection
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized!");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found!");

    const account = await db.account.findUnique({
      where: {
        id: accountId,
        userId: user.id,
      },
      include: {
        // transactions: {
        //   orderBy: { date: "desc" },
        // },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!account) return null;

    const transactions = await db.transaction.findMany({
      where: {
        accountId: accountId,
      },
      skip: (page - 1) * pageSize, // Pagination logic
      take: parseInt(pageSize), // Number of transactions per page
      orderBy: {
        [sortField]: sortDirection, // Sorting by transaction date
      },
    });

    // Serialize Account data before returning as NextJS does not support Decimal values
    const serializedAccount = serializeTransaction(account);

    return {
      ...serializedAccount,
      transactions: transactions.map(serializeTransaction),
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getAccountWithTransaction(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized!");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found!");

    const account = await db.account.findUnique({
      where: {
        id: accountId,
        userId: user.id,
      },
      include: {
        transactions: {
          orderBy: { date: "desc" },
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!account) return null;

    // Serialize Account data before returning as NextJS does not support Decimal values
    const serializedAccount = serializeTransaction(account);

    return {
      account: serializedAccount,
      transactions: serializedAccount.transactions.map(serializeTransaction),
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function bulkDeleteTransactions(transactionIds) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized!");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found!");

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        id: { in: transactionIds },
      },
    });

    // Find the Balance Change and store it in the Accumulator (Even though we only delete for one account at a time, code is scalable for multiple different accounts)
    const accountBalanceChange = transactions.reduce((acc, transaction) => {
      const change =
        transaction.type === "EXPENSE"
          ? transaction.amount.toNumber()
          : -transaction.amount.toNumber();

      acc[transaction.accountId] =
        (acc[transaction.accountId]?.toNumber || 0) + change;
      return acc;
    }, {});

    // Delete transactions and update account balance in a transaction
    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: {
          id: { in: transactionIds },
          userId: user.id,
        },
      });

      for (const [accountId, balanceChange] of Object.entries(
        accountBalanceChange
      )) {
        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/account/[id]");

    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
}
