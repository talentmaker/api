-- DropIndex
DROP INDEX `competition_name_idx` ON `competition`;

-- DropIndex
DROP INDEX `project_name_idx` ON `project`;

-- DropIndex
DROP INDEX `user_username_idx` ON `user`;

-- CreateIndex
CREATE FULLTEXT INDEX `competition_name_fulltext` ON `competition`(`name`, `shortDesc`);

-- CreateIndex
CREATE FULLTEXT INDEX `project_name_fulltext` ON `project`(`name`);

-- CreateIndex
CREATE FULLTEXT INDEX `user_username_fulltext` ON `user`(`username`);
