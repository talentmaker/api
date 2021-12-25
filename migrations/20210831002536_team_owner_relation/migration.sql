-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_creatorId_competitionId_fkey` FOREIGN KEY (`creatorId`, `competitionId`) REFERENCES `participant`(`uid`, `competitionId`) ON DELETE CASCADE ON UPDATE CASCADE;
