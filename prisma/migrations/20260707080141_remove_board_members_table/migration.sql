/*
  Warnings:

  - You are about to drop the `BoardMembers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."BoardMembers" DROP CONSTRAINT "BoardMembers_boardId_fkey";

-- DropForeignKey
ALTER TABLE "public"."BoardMembers" DROP CONSTRAINT "BoardMembers_userId_fkey";

-- DropTable
DROP TABLE "public"."BoardMembers";

-- DropEnum
DROP TYPE "public"."BoardRoles";
