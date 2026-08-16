/*
  Warnings:

  - Added the required column `tree_id` to the `Person` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "address" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "is_locked" BOOLEAN,
ADD COLUMN     "lastName2" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "tree_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_admin" BOOLEAN;

-- CreateTable
CREATE TABLE "tree" (
    "id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "tree_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treeUser" (
    "id_tree" UUID NOT NULL,
    "id_user" TEXT NOT NULL,

    CONSTRAINT "tree_user_pk" PRIMARY KEY ("id_tree","id_user")
);

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "tree_fk" FOREIGN KEY ("tree_id") REFERENCES "tree"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "treeUser" ADD CONSTRAINT "tree_fk" FOREIGN KEY ("id_tree") REFERENCES "tree"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "treeUser" ADD CONSTRAINT "user_fk" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
