# Telegram Bot Sticker Tagging Project

## Setup

You need Node.js to work on this project. Get it!

Run `npm install` at the root directory to have everything you need.

## Project Overview

This app is a Telegram bot that allows a user to tag certain stickers privately, enabling them to retrieve stickers via tags using an in-line command.

### Functionality Requirements

1. **Tagging**:

   - Users can tag individual stickers with case-insensitive tags.
   - Users can remove or edit tags as needed.

2. **Inline Request**:
   - Users can invoke the bot via an inline request, formatted as `@bot_username tag`.
   - The user receives a scrollable list of stickers associated with the tag.
   - Selecting a sticker sends it in the chat.

### Example Scenario

- A sticker can have multiple tags.
- Users can have their own tags for their stickers, which are different from other users' tags.
- For example:
  - User 1 tags Sticker A with "feet" and Sticker B with "feet".
  - User 2 tags Sticker A with "tail" and Sticker B with "paws".
  - User 1 should be able to look up all of their "feet" stickers.

## Database Structure

### Tables

#### Users Table

- **user_id** (Primary Key) (integer): A unique identifier for each user.
- **telegram_user_id** (string): The Telegram user ID.

#### Stickers Table

- **sticker_id** (Primary Key) (integer): A unique identifier for each sticker entry.
- **sticker_file_id** (string): The file ID of the sticker as provided by Telegram.

#### Tags Table

- **tag_id** (Primary Key) (integer): A unique identifier for each tag.
- **tag_name** (string): The name of the tag, stored in lowercase for case insensitivity.

#### User_Sticker_Tags Table

- **id** (Primary Key) (integer): A unique identifier for each record.
- **user_id** (Foreign Key): References the user who tagged the sticker.
- **sticker_id** (Foreign Key): References the sticker being tagged.
- **tag_id** (Foreign Key): References the tag applied to the sticker.

## Git Branching Strategy

### 1. Main Branches

- **main:** This branch should always contain the stable, production-ready code. No direct commits should be made to this branch; only merge commits from develop or release branches are allowed.

- **develop:** This is the integration branch for features and the latest development code. All new work should be merged here once it's reviewed and tested.

### 2. Feature Branches

- **Naming Convention:** feature/short-description (e.g., feature/sticker-tagging)
- **Purpose:** Use feature branches for developing new features or making significant changes. Each feature should have its own branch.
- **Creating a Branch:**

```bash
git checkout develop
git pull origin develop
git checkout -b feature/short-description
```

- **Merging:** Once the feature is complete and tested, create a pull request to merge it into develop.

### 3. Bugfix Branches

- **Naming Convention:** bugfix/short-description (e.g., bugfix/sticker-tagging-fix)
- **Purpose:** Use bugfix branches to address issues found in the develop branch or reported by QA.
- **Creating a Branch:**

```bash
git checkout develop
git pull origin develop
git checkout -b bugfix/short-description
```

- **Merging:** After fixing the bug and testing, create a pull request to merge it into develop.

### 4. Release Branches

- **Naming Convention:** release/x.x.x (e.g., release/1.0.0)
- **Purpose:** When you're ready to prepare a new release, create a release branch from develop. Use this branch to finalize the release (e.g., fix minor bugs, update documentation).
- **Creating a Branch:**

```bash
git checkout develop
git pull origin develop
git checkout -b release/x.x.x
```

- **Merging:** After everything is finalized, merge the release branch into both main and develop.

### 5. Hotfix Branches

- **Naming Convention:** hotfix/x.x.x (e.g., hotfix/1.0.1)
- **Purpose:** Use hotfix branches to quickly address critical issues in the main branch.
- **Creating a Branch:**

```bash
git checkout main
git pull origin main
git checkout -b hotfix/x.x.x
```

- **Merging:** After fixing the issue, merge the hotfix branch into both main and develop.

### General Guidelines

- **Branch frequently:** Create branches for every new feature, bugfix, or hotfix to keep work isolated and manageable.
- **Keep branches small:** Regularly merge small changes instead of one large one to make reviews easier and reduce the chance of conflicts.
- **Update regularly:** Regularly pull changes from the develop branch to your feature branches to stay up-to-date and reduce merge conflicts.
- **Use descriptive commit messages:** Write clear commit messages that describe what the commit does, which makes it easier to understand the history.
- **Pull Request (PR) Reviews:** All branches should be reviewed via a pull request before merging into develop or main.

### Example Workflow

1. Start a Feature:

- Create a feature branch: feature/sticker-tagging
- Develop your feature.
- Commit changes to the feature branch.

2. Submit for Review:

- Push the feature branch to the remote repo.
- Create a pull request to merge feature/sticker-tagging into develop.
- After approval, merge the branch.

3. Prepare for Release:

- Create a release branch: release/1.0.0.
- Finalize the release, fix minor issues.
- Merge the release branch into main and develop.

4. Hotfix if Needed:

- Create a hotfix branch: hotfix/1.0.1.
- Fix the issue.
- Merge the hotfix branch into main and develop.
