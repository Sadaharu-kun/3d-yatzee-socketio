const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'socketio-dice-game';

let db;

async function initDb(): Promise<typeof db> {
    await client.connect();
    console.log('Successfully connected to server.');

    const db = client.db(dbName);
    const collection = db.collection('documents');

    return db;
}

function getDb() {
    return db;
}

module.exports = {
    initDb,
    getDb,
    client
};

/* main()
    .then(console.log)
    .catch(console.error)
    .finally(() => client.close());
 */
