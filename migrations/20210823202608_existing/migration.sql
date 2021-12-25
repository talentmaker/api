-- CreateTable
CREATE TABLE `competition` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64),
    `desc` TEXT,
    `videoURL` VARCHAR(256),
    `deadline` TIMESTAMP(0) NOT NULL,
    `website` VARCHAR(256),
    `email` VARCHAR(128),
    `orgId` CHAR(36) NOT NULL,
    `coverImageURL` VARCHAR(256),
    `shortDesc` VARCHAR(128) NOT NULL,
    `topics` VARCHAR(128),

    INDEX `orgId_idx`(`orgId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organization` (
    `uid` CHAR(36) NOT NULL,

    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organizationRequests` (
    `uid` CHAR(36) NOT NULL,
    `lastRequest` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participant` (
    `id` VARCHAR(64) NOT NULL,
    `uid` CHAR(36) NOT NULL,
    `role` VARCHAR(32),
    `desc` VARCHAR(256),
    `competitionId` INTEGER UNSIGNED NOT NULL,
    `projectId` INTEGER UNSIGNED,

    INDEX `participantCompetitionId_idx`(`competitionId`),
    INDEX `participantProjectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `picture` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(256) NOT NULL,
    `projectId` INTEGER UNSIGNED NOT NULL,

    INDEX `projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `creator` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL,
    `desc` TEXT,
    `srcURL` VARCHAR(256),
    `demoURL` VARCHAR(256),
    `license` TEXT,
    `videoURL` VARCHAR(256),
    `coverImageURL` VARCHAR(256),
    `competitionId` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(64),
    `topics` VARCHAR(128),

    INDEX `competitionId_idx`(`competitionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `uid` VARCHAR(64) NOT NULL,
    `email` VARCHAR(256) NOT NULL,
    `username` VARCHAR(32) NOT NULL,

    UNIQUE INDEX `user.uid_unique`(`uid`),
    UNIQUE INDEX `user.email_unique`(`email`),
    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `competition` ADD FOREIGN KEY (`orgId`) REFERENCES `organization`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participant` ADD FOREIGN KEY (`competitionId`) REFERENCES `competition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participant` ADD FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `picture` ADD FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project` ADD FOREIGN KEY (`competitionId`) REFERENCES `competition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
