/*
  Warnings:

  - You are about to drop the column `productId` on the `Image` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_productId_fkey";

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "productId";
