/*
  Warnings:

  - A unique constraint covering the columns `[creator,competitionId]` on the table `project` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `project_creator_competitionId_key` ON `project`(`creator`, `competitionId`);
