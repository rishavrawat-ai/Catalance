-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "completedTasks" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "verifiedTasks" JSONB NOT NULL DEFAULT '[]';
