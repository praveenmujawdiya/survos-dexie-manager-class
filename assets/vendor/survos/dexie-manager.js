import Dexie from 'dexie';

/**
 * Manages the interaction with IndexedDB and synchronizes data from remote APIs.
 *
 * @class DexieManager
 */
class DexieManager {
    /**
     * Creates an instance of DexieManager.
     *
     * @param {Object} config - The configuration object for the DexieManager.
     * @param {string} config.name - The name of the database.
     * @param {number} config.version - The version of the database.
     * @param {Array<Object>} config.tables - List of table definitions to be used in the database.
     * @param {string} config.tables.name - The name of the table.
     * @param {string} config.tables.schema - The schema for the table, defined by the column names in a comma-separated string format.
     * @param {Object} config.tables.url - The URL configuration for the remote API.
     * @param {string} config.tables.url.root - The root URL for the API.
     * @param {string} config.tables.url.endpoint - The endpoint to fetch data for the table.
     * @param {string} dbLocale - The current locale associated with the existing database (e.g., stored during the last session).
     * @param {string} userLocale - The locale of the current user or session. Compared against dbLocale to determine if the database needs to be reset.
     */
    constructor(config, dbLocale, userLocale) {
        // Initialize an internal EventTarget instance to manage custom events within this class.
        // This allows other parts of the app to listen to and dispatch events without relying on the DOM.
        this.eventTarget = new EventTarget();

        // Ensure the database configuration object is valid and not empty.
        if (config == null || typeof config !== 'object' || Object.keys(config).length === 0) {
            throw new Error('DexieManager: A valid, non-empty configuration object is required to initialize the database.');
        }
        this.config = config;

        // Ensure the database locale is a non-empty string.
        if (!dbLocale || typeof dbLocale !== 'string' || dbLocale.trim() === '') {
            throw new Error('DexieManager: The database locale must be a non-empty string.');
        }
        this.dbLocale = dbLocale;

        // Ensure the user locale is a non-empty string.
        if (!userLocale || typeof userLocale !== 'string' || userLocale.trim() === '') {
            throw new Error('DexieManager: The user locale must be a valid, non-empty string.');
        }
        this.userLocale = userLocale;
    }

    async initializeDatabase() {
        try {
            this.locale = this.userLocale;

            // Dispatch event signaling the start of the database creation process.
            this.dispatchEvent('database:beforeCreate', {
                dbName: this.config.name
            });
            // Initialize the Dexie database with the specified name from the config.
            this.db = new Dexie(this.config.name);

            // Check if the current database locale is different from the user preferred locale.
            if (this.dbLocale !== this.userLocale) {
                // Ensure that the database is deleted if locales are different.
                await this.deleteDatabase();
                // Dispatch an event indicating that the database locale has changed, passing the old and new locale values for reference.
                this.dispatchEvent('database:localeChanged', {
                    oldLocale: this.dbLocale,
                    newLocale: this.userLocale
                });
                // Re-initialize the Dexie database with the specified name from the config, since it was deleted due to locale mismatch.
                this.db = new Dexie(this.config.name);
            }

            // Dispatch event signaling successful database creation.
            this.dispatchEvent('database:afterCreate', {
                dbName: this.db.name
            });

            let tables = Object.fromEntries(
                this.config.tables.map(function(table) {
                    return [table.name, table.schema];
                })
            );
            this.db.version(this.config.version).stores(tables);

            try {
                this.dispatchEvent('database:beforeConnect', {
                    dbName: this.db.name
                });
                await this.db.open();
                this.dispatchEvent('database:afterConnect', {
                    dbName: this.db.name
                });
            }
            catch(error) {
                throw new Error('DexieManager: Failed to connect to the database: ' + error.message);
            }

            this.countEmptyTables().then((emptyTables) => {
                if (emptyTables.length > 0) {
                    console.log('Empty Tables : ' + emptyTables.map(table => table.name).join(', '));
                    this.populateEmptyTables(emptyTables);
                } else {
                    console.log('All tables are populated');
                    this.dispatchEvent('database:ready', null);
                }
            });
        }
        catch(error) {
            throw new Error('DexieManager: Failed to initialize the database: ' + error.message);
        }
    }

    /**
     * Deletes the database if it exists and dispatches events before and after deletion.
     * If the database does not exist, throws an error.
     *
     * @async
     * @throws {Error} Throws an error if the database does not exist or if deletion fails.
     * @fires database:beforeDelete - Fired before the deletion process starts, passing the database name.
     * @fires database:afterDelete - Fired after the database is successfully deleted, passing the database name.
     */
    async deleteDatabase() {
        try {
            // Check if the database exists before attempting deletion.
            if (!this.db) {
                throw new Error('DexieManager: No database found to delete.');
            }

            // Dispatch event signaling the start of the database deletion process.
            this.dispatchEvent('database:beforeDelete', {
                dbName: this.db.name
            });

            // Try deleting the database
            await this.db.delete();

            // Dispatch event signaling successful database deletion.
            this.dispatchEvent('database:afterDelete', {
                dbName: this.db.name
            });

            // Set the db property to null, as the database has been deleted.
            this.db = null;
        }
        catch(error) {
            // If the deletion fails, throw an error with a message.
            throw new Error('DexieManager: Failed to delete the database: ' + error.message);
        }
    }

    /**
     * Refreshes the database by deleting the existing instance and reinitializing it.
     * If the database does not exist, throws an error.
     *
     * @throws {Error} Throws an error if the database does not exist or if the refresh process fails.
     * @fires database:beforeRefresh - Fired before the refresh process starts, passing the database name.
     * @fires database:afterRefresh - Fired after the database is successfully refreshed, passing the database name.
     */
    async refreshDatabase() {
        // Check if the database exists before attempting refresh.
        if (!this.db) {
            throw new Error('DexieManager: No database found to refresh.');
        }

        // Dispatch event signaling the start of the database refresh process.
        this.dispatchEvent('database:beforeRefresh', {
            dbName: this.db.name
        });

        try {
            // Delete the database
            await this.deleteDatabase();

            // Re-initialize the database
            await this.initializeDatabase();

            // Dispatch event signaling successful database refresh.
            this.dispatchEvent('database:afterRefresh', {
                dbName: this.db.name
            });
        }
        catch(error) {
            throw new Error('DexieManager: Failed to refresh the database: ' + error.message);
        }
    }

    /**
     * Checks all tables and returns a list of those that are currently empty.
     *
     * @async
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of table definitions that are empty.
     */
    async countEmptyTables() {
        const emptyTables = [];
        // Loop through each table in the config to check its record count
        for (const table of this.config.tables) {
            const count = await this.db[table.name].count();

            // If no records found, add the table definition to the empty list
            if (count === 0) {
                emptyTables.push(table);
            }
        }
        return emptyTables;
    }

    /**
     * Populates a list of empty tables by syncing them one by one.
     * For each table, it triggers a sync operation, calculates the progress, and dispatches a progress event.
     * After all tables are processed, it dispatches a 'database:ready' event.
     *
     * @async
     * @param {Array<Object>} tables - An array of table definitions to populate.
     */
    async populateEmptyTables(tables) {
        let index = 1;

        for (let table of tables) {
            // Sync the table's data
            await this.syncTable(table);

            // Calculate progress percentage
            let progress = (index / tables.length).toFixed(2);

            // Dispatch a progress update event with current table and progress info
            this.dispatchEvent('database:progress', {
                currentIndex: index,
                totalTables: tables.length,
                tableName: table.name,
                progress: progress
            });

            console.log(`Populating table '${table.name}'`);
            console.log(`Progress: ${progress * 100 + '%'}`);

            // Optional delay for visual clarity (simulate processing time)
            await new Promise(resolve => setTimeout(resolve, 600));

            index++;
        }
        this.dispatchEvent('database:ready', null);
    }

    /**
     * Synchronizes a specific table by checking if it is empty and, if so, populates it with remote data.
     *
     * @param {Object} table - The table configuration object.
     * @param {string} table.name - The name of the IndexedDB table.
     * @param {string} table.url - The URL to fetch data from if the table is empty.
     * @returns {Promise<void>} A promise that resolves when the synchronization is complete or skipped.
     *
     */
    async syncTable(table) {
        // Check if the database exists.
        if (!this.db) {
            throw new Error('DexieManager: No database found.');
        }

        // Exit early if no table provided.
        if (!table) return;

        try {
            // Get the number of records in the specified table
            const count = await this.db[table.name].count();
            // If the table is empty, fetch and populate it with data
            if (count === 0) {
                await this.fetchTable(table);
            }
        }
        catch(error) {
            console.error(`Error syncing table '${table.name}':`, error);
        }
    }

    /**
     * Fetches data from a remote URL and populates the corresponding IndexedDB table.
     * If pagination exists (via `data.view.next`), it recursively continues fetching.
     *
     * @param {Object} table - The table configuration object.
     * @param {string} table.name - The name of the IndexedDB table to populate.
     * @param {Object} table.url - The URL parts used to construct the full API request.
     * @param {string} table.url.root - The base/root URL.
     * @param {string} table.url.endpoint - The specific endpoint for the table data.
     * @returns {Promise<void>} A promise that resolves when the entire table (including paginated data) is fetched and stored.
     */
    async fetchTable(table) {
        // Check if the database exists.
        if (!this.db) {
            throw new Error('DexieManager: No database found.');
        }

        // Exit early if no table provided.
        if (!table) return;

        try {
            // Construct the full URL
            let fullUrl = table.url.root + table.url.endpoint;
            fullUrl = fullUrl.replace('{locale}', this.locale);

            // Fetch the data from the remote source
            console.log(`DexieManager: Fetching data for the table '${table.name}' from the url '${fullUrl}'`);
            const response = await fetch(fullUrl);
            console.log(`DexieManager: Data fetched for the table '${table.name}' from the url '${fullUrl}'`);
            const data = await response.json();

            // If there are records in the response, insert them into the database
            if (data.member && data.member.length > 0) {
                data.member.forEach((record) => {
                    this.db[table.name].add({
                        id: record.id,
                        meta: record
                    });
                });

                // If there is a next page, recursively fetch it
                if (data.view && data.view.next) {
                    await this.fetchTable({
                        name: table.name,
                        url: {
                            root: table.url.root,
                            endpoint: data.view.next
                        }
                    });
                }
            }
        }
        catch(error) {
            console.error(`DexieManager: Error fetching data for the table '${table.name}':`, error);
        }
    }

    /**
     * Dispatches a custom event using the internal EventTarget instance.
     *
     * @param {string} type - The name of the event to dispatch.
     * @param {*} detail - Optional data to pass with the event as `event.detail`.
     * @returns {void}
     */
    dispatchEvent(type, detail) {
        const event = new CustomEvent(type, {detail});
        this.eventTarget.dispatchEvent(event);
    }

    /**
     * Adds an event listener to the internal EventTarget.
     *
     * @param {string} type - The name of the event to listen for.
     * @param {Function} listener - The callback function to invoke when the event is triggered.
     * @param {Object|boolean} [options] - Optional configuration for the event listener (e.g., capture, once, passive).
     * @returns {void}
     */
    addEventListener(type, listener, options) {
        this.eventTarget.addEventListener(type, listener, options);
    }

    /**
     * Removes a previously registered event listener from the internal EventTarget.
     *
     * @param {string} type - The name of the event the listener was attached to.
     * @param {Function} listener - The callback function that was originally registered.
     * @param {Object|boolean} [options] - Optional configuration that matches the one used in `addEventListener`.
     * @returns {void}
     */
    removeEventListener(type, listener, options) {
        this.eventTarget.removeEventListener(type, listener, options);
    }
}

export default DexieManager;