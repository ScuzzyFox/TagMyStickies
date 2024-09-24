/**
 * CRUD operations for all the database objects
 */
import {
  NotFoundError,
  ServerError,
  UnknownError,
  ValidationError,
} from "libs/errors/DatabaseAPIErrors.js";
import {
  StickerTagEntry,
  UserEntry,
  FilterStickersInput,
  FullUserData,
} from "./databaseModels.js";
import {
  listUserEntriesURL,
  deleteMultiTagSetURL,
  deleteTagSetURL,
  filterStickersURL,
  listStickerTagEntriesURL,
  manipulateMultiStickerURL,
  massTagReplaceURL,
  multiStickerURL,
  stickerTagEntryDetailURL,
  userEntryDetailURL,
  userStickerTagListURL,
} from "./urls.js";

interface DatabaseActionResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    type: string;
  };
}

/**
 * Retrieves a specific User Entry
 * Data comes back in the form of {"user":1234,"chat":456,"status":"active"}
 *
 * @param userID The integer user ID of the user entry you're trying to retrieve
 * @returns Promise<DatabaseActionResponse<UserEntry>> Returns the fetched user entry or throws an error if unsuccessful
 */
export async function retrieveUserEntry(userID: number): Promise<UserEntry> {
  try {
    const response = await fetch(userEntryDetailURL(userID), {
      method: "GET",
      headers: {
        "Content-Type": "application/json", // Specify that we expect JSON
        Accept: "application/json",
      },
    });

    if (response.status === 404) {
      throw new NotFoundError(`User entry with ID ${userID} not found (404).`);
    } else if (response.status === 500) {
      throw new ServerError(`Server error while fetching user entry (500).`);
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to retrieve user entry: ${response.statusText} (${response.status}).`
      );
    }

    const data: UserEntry = await response.json(); // Parse JSON response
    return data; // Return the parsed data
  } catch (error) {
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Creates a new UserEntry.
 *
 * Sends a POST request to create a new user entry with the given user ID, chat ID, and optional status.
 *
 * @param userID The integer user ID of the user entry you're trying to create.
 * @param chatID The integer chat ID of the user entry.
 * @param status The optional status of the user.
 * @returns Promise<UserEntry> Returns the created UserEntry object or throws an error if unsuccessful.
 */
export async function CreateUserEntry(
  userID: number,
  chatID: number,
  status?: string
): Promise<UserEntry> {
  const userEntry: UserEntry = {
    user: userID,
    chat: chatID,
    status: status ? status : undefined,
  };

  try {
    const response = await fetch(listUserEntriesURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Specify that we're sending JSON
      },
      body: JSON.stringify(userEntry), // Convert the object to a JSON string
    });

    if (response.status === 400) {
      throw new ValidationError(
        `Invalid data submitted (400). Please check your input.`
      );
    } else if (response.status === 500) {
      throw new ServerError(`Server error while creating user entry (500).`);
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to create user entry: ${response.statusText} (${response.status}).`
      );
    }

    const data: UserEntry = await response.json(); // Parse and return the newly created UserEntry object
    return data;
  } catch (error) {
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Lists user entries, with optional query parameters for filtering.
 *
 * Sends a GET request to retrieve a list of user entries. Optional query parameters for filtering
 * by user ID, chat ID, or status can be passed as an object.
 *
 * @param params Optional query parameters for filtering, such as { user: 123, chat: 456, status: "active" }.
 * @returns Promise<UserEntry[]> Returns a list of UserEntry objects.
 */
export async function listUserEntries(params?: {
  user?: number;
  chat?: number;
  status?: string;
}): Promise<UserEntry[]> {
  const queryParams = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([key, value]) => value !== undefined) // Remove undefined parameters
          .map(([key, value]) => [key, String(value)]) // Ensure values are strings
      ).toString()
    : "";

  try {
    const response = await fetch(`${listUserEntriesURL}${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json", // Specify that we expect JSON
      },
    });

    if (response.status === 404) {
      throw new NotFoundError(`No user entries found (404).`);
    } else if (response.status === 500) {
      throw new ServerError(`Server error while fetching user entries (500).`);
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to retrieve user entries: ${response.statusText} (${response.status}).`
      );
    }

    const data: UserEntry[] = await response.json(); // Parse and return the list of UserEntry objects
    return data;
  } catch (error) {
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Deletes a specific User Entry
 *
 * Sends a DELETE request to remove a user entry by the given user ID.
 *
 * @param userID The integer user ID of the user entry you're trying to delete.
 * @returns Promise<void> Returns nothing if successful or throws an error if unsuccessful.
 */
export async function deleteUserEntry(userID: number): Promise<void> {
  try {
    const response = await fetch(userEntryDetailURL(userID), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      throw new NotFoundError(`User entry with ID ${userID} not found (404).`);
    } else if (response.status === 500) {
      throw new ServerError(`Server error while deleting user entry (500).`);
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to delete user entry: ${response.statusText} (${response.status}).`
      );
    }
  } catch (error) {
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Updates a specific User Entry (PATCH)
 *
 * Sends a PATCH request to update a user entry with the given data (partial update).
 *
 * @param userID The integer user ID of the user entry you're trying to update.
 * @param updates An object containing the fields to update (e.g., { chat: 123, status: "active" }).
 * @returns Promise<UserEntry> Returns the updated UserEntry object or throws an error if unsuccessful.
 */
export async function patchUserEntry(
  userID: number,
  updates: Partial<UserEntry>
): Promise<UserEntry> {
  try {
    const response = await fetch(userEntryDetailURL(userID), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates), // Convert the updates to JSON
    });

    if (response.status === 400) {
      throw new ValidationError(
        `Invalid data submitted (400). Please check your input.`
      );
    } else if (response.status === 404) {
      throw new NotFoundError(`User entry with ID ${userID} not found (404).`);
    } else if (response.status === 500) {
      throw new ServerError(`Server error while updating user entry (500).`);
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to update user entry: ${response.statusText} (${response.status}).`
      );
    }

    const data: UserEntry = await response.json(); // Parse and return the updated UserEntry object
    return data;
  } catch (error) {
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Retrieves a specific StickerTagEntry by its primary key. This is just a utility function you probably will never use.
 * Data comes back in the form of {"sticker": "stickerName", "tag": "tagName", "user": 1234, "id": 5678}
 *
 * @param stickerTagID The integer ID of the sticker tag entry you're trying to retrieve (you likely will never know what this is).
 * @returns Promise<StickerTagEntry> Returns the fetched sticker tag entry or throws an error if unsuccessful.
 */
export async function retrieveStickerTagEntry(
  stickerTagID: number
): Promise<StickerTagEntry> {
  try {
    const response = await fetch(stickerTagEntryDetailURL(stickerTagID), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      throw new NotFoundError(
        `Sticker tag entry with ID ${stickerTagID} not found (404).`
      );
    } else if (response.status === 500) {
      throw new ServerError(
        `Server error while fetching sticker tag entry (500).`
      );
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to retrieve sticker tag entry: ${response.statusText} (${response.status}).`
      );
    }

    const data: StickerTagEntry = await response.json(); // Parse JSON response
    return data;
  } catch (error) {
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Creates a new StickerTagEntry.
 *
 * Sends a POST request to create a new sticker tag entry with the given sticker, tag, and user.
 *
 * @param sticker The sticker string.
 * @param tag The tag string.
 * @param user The integer user ID to associate with the sticker tag entry.
 * @returns Promise<StickerTagEntry> Returns the created StickerTagEntry object or throws an error if unsuccessful.
 */
export async function createStickerTagEntry(
  sticker: string,
  tag: string,
  user: number
): Promise<StickerTagEntry> {
  const stickerTagEntry: StickerTagEntry = {
    sticker,
    tag,
    user,
    id: undefined, // ID will be generated by the server
  };

  try {
    const response = await fetch(listStickerTagEntriesURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stickerTagEntry), // Convert the object to a JSON string
    });

    if (response.status === 400) {
      throw new ValidationError(
        `Invalid data submitted (400). Please check your input.`
      );
    } else if (response.status === 500) {
      throw new ServerError(
        `Server error while creating sticker tag entry (500).`
      );
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to create sticker tag entry: ${response.statusText} (${response.status}).`
      );
    }

    const data: StickerTagEntry = await response.json();
    return data; // Return the created StickerTagEntry
  } catch (error) {
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Deletes a specific StickerTagEntry by entry ID/primary key.
 *
 * Just a utility function, you probably will never use this unless testing.
 *
 * @param stickerTagID The integer ID of the sticker tag entry you're trying to delete.
 * @returns Promise<void> Returns nothing if successful or throws an error if unsuccessful.
 */
export async function deleteStickerTagEntry(
  stickerTagID: number
): Promise<void> {
  try {
    const response = await fetch(stickerTagEntryDetailURL(stickerTagID), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      throw new NotFoundError(
        `Sticker tag entry with ID ${stickerTagID} not found (404).`
      );
    } else if (response.status === 500) {
      throw new ServerError(
        `Server error while deleting sticker tag entry (500).`
      );
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to delete sticker tag entry: ${response.statusText} (${response.status}).`
      );
    }
  } catch (error) {
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Updates a specific StickerTagEntry (PATCH)
 *
 * Sends a PATCH request to update a sticker tag entry with the given data (partial update).
 *
 * @param stickerTagID The integer ID of the sticker tag entry you're trying to update.
 * @param updates An object containing the fields to update (e.g., { tag: "newTag" }).
 * @returns Promise<StickerTagEntry> Returns the updated StickerTagEntry object or throws an error if unsuccessful.
 */
export async function patchStickerTagEntry(
  stickerTagID: number,
  updates: Partial<StickerTagEntry>
): Promise<StickerTagEntry> {
  try {
    const response = await fetch(stickerTagEntryDetailURL(stickerTagID), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates), // Convert the updates to JSON
    });

    if (response.status === 400) {
      throw new ValidationError(
        `Invalid data submitted (400). Please check your input.`
      );
    } else if (response.status === 404) {
      throw new NotFoundError(
        `Sticker tag entry with ID ${stickerTagID} not found (404).`
      );
    } else if (response.status === 500) {
      throw new ServerError(
        `Server error while updating sticker tag entry (500).`
      );
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to update sticker tag entry: ${response.statusText} (${response.status}).`
      );
    }

    const data: StickerTagEntry = await response.json(); // Parse and return the updated StickerTagEntry object
    return data;
  } catch (error) {
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Lists sticker tag entries, with optional query parameters for filtering.
 *
 * Sends a GET request to retrieve sticker tags for the given user ID. Optional query parameters for filtering
 * by tag, user, or sticker can be passed as an object.
 *
 * @param userID The integer user ID whose stickers and tags you're trying to retrieve.
 * @param params Optional query parameters for filtering, such as { tag: "funny", sticker: "sticker1" }.
 * @returns Promise<StickerTagEntry[]> Returns a list of StickerTagEntry objects.
 */
export async function listStickerTagEntries(params?: {
  tag?: string;
  sticker?: string;
  user?: number;
}): Promise<StickerTagEntry[]> {
  // Construct query parameters if they exist
  const queryParams = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([key, value]) => value !== undefined) // Remove undefined parameters
          .map(([key, value]) => [key, String(value)]) // Ensure values are strings
      ).toString()
    : "";

  try {
    // Send GET request with optional query parameters
    const response = await fetch(`${listStickerTagEntriesURL}${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      throw new NotFoundError(`Not found (404).`);
    } else if (response.status === 500) {
      throw new ServerError(
        `Server error while fetching sticker tags for user (500).`
      );
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to retrieve sticker tags: ${response.statusText} (${response.status}).`
      );
    }

    const data: StickerTagEntry[] = await response.json(); // Parse and return the list of StickerTagEntry objects
    return data;
  } catch (error) {
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Returns a list of tags for a given user and sticker.
 *
 * @param user integer user ID of the user's stickers you want.
 * @param sticker string sticker file ID of the sticker you want tags for.
 * @returns Promise<string[]> Returns an array of tag strings.
 */
export async function getAStickersTags(
  user: number,
  sticker: string
): Promise<string[]> {
  try {
    const data = await listStickerTagEntries({ user: user, sticker: sticker });
    const tags = data.map((entry) => entry.tag);
    return tags;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return [];
    }
  }
}

/**
 * Returns a list of stickers for a given user filtered on what they're tagged with.
 *
 * @param user integer user ID of the user's stickers you want.
 * @param inputData {tags: ["tag1", "tag2"]} object containing a list of tags you want to filter by.
 * @returns Promise<string[]> Returns an array of sticker file ID's
 */
export async function filterStickers(
  user: number,
  inputData: FilterStickersInput
): Promise<string[]> {
  try {
    const response = await fetch(filterStickersURL(user), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inputData),
    });
    if (response.status === 404) {
      throw new NotFoundError("Not found (404)");
    } else if (response.status === 500) {
      throw new ServerError("Server error while fetching stickers list.");
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to fetch sticker list: ${response.statusText} (${response.status})`
      );
    }

    const data: string[] = (await response.json()).stickers;
    return data;
  } catch (error) {
    throw error; //Re-throw error for the caller to handle
  }
}

/**
 * Function to retrieve all of a user's stickers and tags
 *
 * @param user the integer user ID of the user you want to retrieve data for.
 * @returns
 */
export async function userStickerTagList(user: number): Promise<FullUserData> {
  try {
    const response = await fetch(userStickerTagListURL(user), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      throw new NotFoundError(`user ${user} not found. (404)`);
    } else if (response.status === 500) {
      throw new ServerError(
        "Server Error while trying to retrieve user data. (500)"
      );
    } else if (!response.ok) {
      throw new UnknownError(
        `Error while trying to retrieve data: ${response.statusText} (${response.status})`
      );
    }

    const data: FullUserData = await response.json();
    return data;
  } catch (error) {
    throw error; // Re-throw error for the caller to handle.
  }
}

/**
 * Deletes a specific list of tags from a single user's sticker. Skips any invalid tags without error.
 *
 * @param user integer user ID of the user's sticker you want to delete tags from
 * @param sticker sticker file ID of the sticker you want to delete tags from
 * @param tagList an array of the tags you want to remove from the sticker.
 * @returns void
 */
export async function deleteTagSet(
  user: number,
  sticker: string,
  tagList: string[]
): Promise<void> {
  try {
    const response = await fetch(deleteTagSetURL(user, sticker), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tags_to_remove: tagList }),
    });

    if (response.status === 404) {
      throw new NotFoundError(`user ${user} not found. (404)`);
    } else if (response.status === 500) {
      throw new ServerError(
        "Server Error while trying to delete tag list. (500)"
      );
    } else if (!response.ok) {
      throw new UnknownError(
        `Error while trying to delete tag list: ${response.statusText} (${response.status})`
      );
    }
    return;
  } catch (error) {
    throw error; // re-throw error for the caller to handle.
  }
}

/**
 * Deletes a provided set of tags from multiple stickers at once. Skips any invalid tags without error.
 *
 * @param user integer user ID of the user's sticker you want to delete tags from
 * @param stickerList an array of sticker file ID's
 * @param tagList an array of the tags you want to remove from the sticker.
 * @returns void
 */
export async function deleteMultiTagSet(
  user: number,
  stickerList: string[],
  tagList: string[]
): Promise<void> {
  const data = { stickers: stickerList, tags_to_remove: tagList };

  try {
    const response = await fetch(deleteMultiTagSetURL(user), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.status === 404) {
      throw new NotFoundError(`user ${user} not found. (404)`);
    } else if (response.status === 500) {
      throw new ServerError(
        "Server Error while trying to delete multi tag list. (500)"
      );
    } else if (!response.ok) {
      throw new UnknownError(
        `Error while trying to delete multi tag list: ${response.statusText} (${response.status})`
      );
    }
    return;
  } catch (error) {
    throw error; // re-throw error for the caller to handle.
  }
}

/**
 * Removes a set of tags and replaces it with another set of tags on multiple stickers at once.
 *
 * @param user the integer ID of the user's data you want to manipulate
 * @param stickerList an array of sticker file ID's to be affected
 * @param removeTagList an array of the tags you want to remove from the stickers
 * @param addTagList an array of the tags you want to add to the stickers.
 * @returns void
 */
export async function massTagReplace(
  user: number,
  stickerList: string[],
  removeTagList: string[],
  addTagList: string[]
): Promise<void> {
  const data = {
    stickers: stickerList,
    tags_to_remove: removeTagList,
    tags_to_add: addTagList,
  };
  try {
    const response = await fetch(massTagReplaceURL(user), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.status === 404) {
      throw new NotFoundError(`user ${user} not found. (404)`);
    } else if (response.status === 500) {
      throw new ServerError(
        "Server Error while trying to replace multi tag list. (500)"
      );
    } else if (!response.ok) {
      throw new UnknownError(
        `Error while trying to replace multi tag list: ${response.statusText} (${response.status})`
      );
    }
    return;
  } catch (error) {
    throw error; // re-throw error for the caller to handle.
  }
}

/**
 * Adds a set of tags to a specific sticker for a user (POST).
 *
 * @param user The user's ID.
 * @param sticker The sticker ID.
 * @param tagsToAdd An array of tags to add to the sticker.
 * @returns Promise<void>
 */
export async function addTagsToSticker(
  user: number,
  sticker: string,
  tagsToAdd: string[]
): Promise<void> {
  try {
    const response = await fetch(manipulateMultiStickerURL(user, sticker), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tags_to_add: tagsToAdd }),
    });

    if (response.status === 400) {
      throw new ValidationError(`Invalid data submitted (400).`);
    } else if (response.status === 404) {
      throw new NotFoundError(`User or sticker not found (404).`);
    } else if (response.status === 500) {
      throw new ServerError(`Server error while adding tags to sticker (500).`);
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to add tags to sticker: ${response.statusText} (${response.status})`
      );
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Deletes a specific sticker for a user (DELETE).
 *
 * @param user The user's ID.
 * @param sticker The sticker ID.
 * @returns Promise<void>
 */
export async function deleteSticker(
  user: number,
  sticker: string
): Promise<void> {
  try {
    const response = await fetch(manipulateMultiStickerURL(user, sticker), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      throw new NotFoundError(`Sticker or user not found (404).`);
    } else if (response.status === 500) {
      throw new ServerError(`Server error while deleting sticker (500).`);
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to delete sticker: ${response.statusText} (${response.status})`
      );
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Replaces tags on a specific sticker for a user (PATCH).
 *
 * @param user The user's ID.
 * @param sticker The sticker ID.
 * @param tagsToRemove An array of tags to remove.
 * @param tagsToAdd An array of tags to add.
 * @returns Promise<void>
 */
export async function replaceTagsOnSticker(
  user: number,
  sticker: string,
  tagsToRemove: string[],
  tagsToAdd: string[]
): Promise<void> {
  const data = { tags_to_remove: tagsToRemove, tags_to_add: tagsToAdd };

  try {
    const response = await fetch(manipulateMultiStickerURL(user, sticker), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.status === 404) {
      throw new NotFoundError(`Sticker or user not found (404).`);
    } else if (response.status === 500) {
      throw new ServerError(`Server error while replacing tags (500).`);
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to replace tags: ${response.statusText} (${response.status})`
      );
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Tags multiple stickers for a user with multiple tags at once (POST).
 *
 * @param user The user's ID.
 * @param stickers An array of sticker IDs.
 * @param tags An array of tags to apply to the stickers.
 * @returns Promise<void>
 */
export async function tagMultipleStickers(
  user: number,
  stickers: string[],
  tags: string[]
): Promise<void> {
  try {
    const response = await fetch(multiStickerURL(user), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stickers, tags }),
    });

    if (response.status === 400) {
      throw new ValidationError(`Invalid data submitted (400).`);
    } else if (response.status === 404) {
      throw new NotFoundError(`User or stickers not found (404).`);
    } else if (response.status === 500) {
      throw new ServerError(`Server error while tagging stickers (500).`);
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to tag stickers: ${response.statusText} (${response.status})`
      );
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Deletes multiple stickers for a user (DELETE).
 *
 * @param user The user's ID.
 * @param stickers An array of sticker IDs to delete.
 * @returns Promise<void>
 */
export async function deleteMultipleStickers(
  user: number,
  stickers: string[]
): Promise<void> {
  try {
    const response = await fetch(multiStickerURL(user), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stickers }),
    });

    if (response.status === 404) {
      throw new NotFoundError(`User or stickers not found (404).`);
    } else if (response.status === 500) {
      throw new ServerError(`Server error while deleting stickers (500).`);
    } else if (!response.ok) {
      throw new UnknownError(
        `Failed to delete stickers: ${response.statusText} (${response.status})`
      );
    }
  } catch (error) {
    throw error;
  }
}
