# Telegram TagMyStickiesBot

## Node Setup

- You need Node.js to work on this project. Get it! https://nodejs.org/en/download/

- Once installed, Run `npm install` in terminal at the root directory of this project to install the node packages required. You should run this every time you pull/fetch.

- Create a file called `.env` in the root directory. It needs to have `ENVIRONMENT_CONTEXT = development` and
  `TELEGRAM_BOT_TOKEN = <Token>`, `SECRET_KEY=<Token>`. You should make your own bot for dev purposes using @botfather on telegram! He'll give you a token you can paste into `.env`

- Check out https://github.com/yagop/node-telegram-bot-api, https://core.telegram.org/bots/api for info on the telegram bot api

- Make sure you have git and know how to use it. You'll make your own feature branches and create pull requests to update the main code. You should always pull/fetch from the `development` branch and make pull requests to `development`. When you start a new feature, follow the feature branch convention detailed at the bottom of this doc.

- Advanced: learn to use jest and test your code with unit tests.

## Django Setup

- For Django, you'll need python, make sure you have it installed.

- Open a terminal in the /Django directory of the project. Run `python3 -m venv env` and then `source env/bin/activate` to create and activate a virtual python environment in your terminal. If you're on windows you'll need to run `cd env/Scripts && activate && cd ../../` instead. You'll need to do this only for python when working with Django, so I recommend you have 1 terminal open for node stuff and 1 for Django. You'll need to make sure you activate the virtual environment every time you close your terminal to keep working with Django.

- Once that's done, run `pip install -r requirements.txt` to install all the python packages from the requirements.txt file. These are instaled only in your virtual environment and not globally, to keep things clean. Just like with `node install` you'll want to install the python requirements every time you pull/fetch.

- Once you have your python virtual environment set up, you can change directories into the `Django/tagmystickies` folder and run `python manage.py makemigrations` then `python manage.py migrate` to set up the database. DO THIS EVERY TIME you pull/fetch or change any `models.py` file. No harm in running this every time you start a session of work.

- Once that's all set up, launch django's development server by running `python manage.py runserver`

- You should now be able to visit `http://127.0.0.1:8000/` in a browser and get a 404 page. It should show you a list of all the URLs it tried, which kinda tells you what URLs are available. Browse something like http://127.0.0.1:8000/records/user-entries/ to see the API.

- The API documentation isn't the best. You may want to look at the `/records/urls.py` and `/records/views.py` files to see how each endpoint is supposed to work.

- look at https://www.django-rest-framework.org/tutorial/quickstart/ and https://docs.djangoproject.com/en/5.1/ for more information on Django and Django Rest Framework

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
  - User 1 tags Sticker A with "hug" and Sticker B with "hug".
  - User 2 tags Sticker A with "happy" and Sticker B with "sad".
  - User 1 should be able to look up all of their "hug" stickers, etc.

## Database Structure

### Tables

#### Users Table

- **chat_id** (integer): telegram chat ID
- **telegram_user_id** (primary key)(string): The Telegram user ID.

#### Stickers Table

- **sticker_file_id** (primary key)(string): The file ID of the sticker as provided by Telegram.

#### Tags Table

- **tag_name** (Primary Key)(string): The name of the tag, stored in lowercase for case insensitivity.

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
