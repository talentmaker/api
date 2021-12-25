# Tests

Unit tests for express server in `./src`

Each file in `./routes` represents unit tests for each "parent" root (e.g competitions, auth, etc)

Mocks can be found at `../__mocks__`

## User Roles

-   **User 1**: joins the first competition, creates a project
-   **User 2**: joins the first competition, joins the project from user 1
-   **User 3**: an organization, creates 2 competitions
-   **User 4**: an organization, creates a competition
-   **User 5**:
    -   joins the competition
    -   tries to modify user 1's project without joining their team
    -   creates a project
    -   tries to join user 1's team after creating a project
-   **User 6** joins the first competition, creates a project and deletes it
-   **User 7** joins the first competition, joins the team of user 6 before deletion
-   **USer 8** joins user 1's team, gets removed later
