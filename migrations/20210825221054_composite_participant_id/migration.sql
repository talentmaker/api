/*
  Warnings:

  - The primary key for the `participant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `participant` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `competition` DROP FOREIGN KEY `competition_ibfk_1`;

-- DropForeignKey
ALTER TABLE `organization` DROP FOREIGN KEY `organization_ibfk_1`;

-- DropForeignKey
ALTER TABLE `organizationRequests` DROP FOREIGN KEY `organizationRequests_ibfk_1`;

-- DropForeignKey
ALTER TABLE `participant` DROP FOREIGN KEY `participant_ibfk_1`;

-- DropForeignKey
ALTER TABLE `participant` DROP FOREIGN KEY `participant_ibfk_2`;

-- DropForeignKey
ALTER TABLE `participant` DROP FOREIGN KEY `participant_ibfk_3`;

-- DropForeignKey
ALTER TABLE `project` DROP FOREIGN KEY `project_ibfk_1`;

-- DropForeignKey
ALTER TABLE `project` DROP FOREIGN KEY `project_ibfk_2`;

-- AlterTable
ALTER TABLE `participant` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`uid`, `competitionId`);

-- AddForeignKey
ALTER TABLE `competition` ADD CONSTRAINT `competition_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `organization`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organization` ADD CONSTRAINT `organization_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `user`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizationRequests` ADD CONSTRAINT `organizationRequests_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `user`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participant` ADD CONSTRAINT `participant_competitionId_fkey` FOREIGN KEY (`competitionId`) REFERENCES `competition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participant` ADD CONSTRAINT `participant_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participant` ADD CONSTRAINT `participant_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `user`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_competitionId_fkey` FOREIGN KEY (`competitionId`) REFERENCES `competition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_creator_fkey` FOREIGN KEY (`creator`) REFERENCES `user`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RedefineIndex
CREATE UNIQUE INDEX `user_email_key` ON `user`(`email`);
DROP INDEX `user.email_unique` ON `user`;

-- RedefineIndex
CREATE UNIQUE INDEX `user_uid_key` ON `user`(`uid`);
DROP INDEX `user.uid_unique` ON `user`;
