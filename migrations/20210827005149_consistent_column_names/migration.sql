-- DropForeignKey
ALTER TABLE `competition` DROP FOREIGN KEY `competition_orgId_fkey`;

-- AlterTable
ALTER TABLE `competition` RENAME COLUMN `orgId` TO `organizationId`;

-- AddForeignKey
ALTER TABLE `competition` ADD CONSTRAINT `competition_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;


-- DropForeignKey
ALTER TABLE `project` DROP FOREIGN KEY `project_creator_fkey`;

-- DropIndex
DROP INDEX `project_creator_competitionId_key` ON `project`;

-- AlterTable
ALTER TABLE `project` RENAME COLUMN `creator` TO `creatorId`;

-- CreateIndex
CREATE UNIQUE INDEX `project_creatorId_competitionId_key` ON `project`(`creatorId`, `competitionId`);

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `user`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;
