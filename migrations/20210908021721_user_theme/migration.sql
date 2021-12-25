-- AlterTable
ALTER TABLE `user` ADD COLUMN `theme` ENUM('Light', 'Dark') NOT NULL DEFAULT 'Light';
