/*
  Warnings:

  - You are about to drop the column `updatedAd` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "updatedAd",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
