/*
  Warnings:

  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `uid` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(64)` to `Char(36)`.
  - You are about to drop the `picture` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `picture` DROP FOREIGN KEY `picture_ibfk_1`;

-- AlterTable
ALTER TABLE `competition` ALTER COLUMN `deadline` DROP DEFAULT;

-- AlterTable
ALTER TABLE `organizationRequests` ALTER COLUMN `lastRequest` DROP DEFAULT;

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    MODIFY `uid` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`uid`);

-- DropTable
DROP TABLE `picture`;

-- AddForeignKey
ALTER TABLE `organization` ADD FOREIGN KEY (`uid`) REFERENCES `user`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizationRequests` ADD FOREIGN KEY (`uid`) REFERENCES `user`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participant` ADD FOREIGN KEY (`uid`) REFERENCES `user`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project` ADD FOREIGN KEY (`creator`) REFERENCES `user`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RedefineIndex
CREATE INDEX `competitionId` ON `participant`(`competitionId`);
DROP INDEX `participantCompetitionId_idx` ON `participant`;

-- RedefineIndex
CREATE INDEX `projectId` ON `participant`(`projectId`);
DROP INDEX `participantProjectId_idx` ON `participant`;

-- RedefineIndex
CREATE INDEX `competitionId` ON `project`(`competitionId`);
DROP INDEX `competitionId_idx` ON `project`;
