// const { MongoClient } = require('mongodb');
import { MongoClient } from 'mongodb';

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'socketio-dice-game';

let db: any;

async function initDb() {
    await client.connect();
    console.log('Successfully connected to server.');

    db = client.db(dbName);

    return db;
}

function getDb() {
    if (!db) {
        throw new Error('Database not initialized. Call initDB first');
    }
    return db;
}

export { client, getDb, initDb };
/* module.exports = {
    initDb,
    getDb,
    client
}; */

/* main()
    .then(console.log)
    .catch(console.error)
    .finally(() => client.close());
 */
