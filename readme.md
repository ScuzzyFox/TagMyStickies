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
