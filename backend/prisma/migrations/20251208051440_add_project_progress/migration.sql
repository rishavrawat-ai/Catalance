-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "attachment" JSONB;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "spent" INTEGER NOT NULL DEFAULT 0;
