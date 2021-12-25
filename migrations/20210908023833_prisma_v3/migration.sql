-- DropForeignKey
ALTER TABLE `competition` DROP FOREIGN KEY `competition_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `organization` DROP FOREIGN KEY `organization_uid_fkey`;

-- DropForeignKey
ALTER TABLE `organizationRequests` DROP FOREIGN KEY `organizationRequests_uid_fkey`;

-- DropForeignKey
ALTER TABLE `participant` DROP FOREIGN KEY `participant_competitionId_fkey`;

-- DropForeignKey
ALTER TABLE `participant` DROP FOREIGN KEY `participant_uid_fkey`;

-- DropForeignKey
ALTER TABLE `project` DROP FOREIGN KEY `project_competitionId_fkey`;

-- DropForeignKey
ALTER TABLE `project` DROP FOREIGN KEY `project_creatorId_fkey`;

-- DropForeignKey
ALTER TABLE `project` DROP FOREIGN KEY `project_creatorId_competitionId_fkey`;

-- AddForeignKey
ALTER TABLE `competition` ADD CONSTRAINT `competition_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organization` ADD CONSTRAINT `organization_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `user`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizationRequests` ADD CONSTRAINT `organizationRequests_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `user`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participant` ADD CONSTRAINT `participant_competitionId_fkey` FOREIGN KEY (`competitionId`) REFERENCES `competition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participant` ADD CONSTRAINT `participant_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `user`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_creatorId_competitionId_fkey` FOREIGN KEY (`creatorId`, `competitionId`) REFERENCES `participant`(`uid`, `competitionId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_competitionId_fkey` FOREIGN KEY (`competitionId`) REFERENCES `competition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `user`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;
