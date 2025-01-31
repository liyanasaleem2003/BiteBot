const { MongoClient } = require('mongodb');
const fs = require('fs');

// MongoDB connection URI
const uri = MONGO_URI
const databaseName = 'bitebot'; // Replace with your database name
const collectionName = 'recipes'; // Replace with your collection name

(async function () {
  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const db = client.db(databaseName);
    const collection = db.collection(collectionName);

    // Read recipes.json
    const recipes = JSON.parse(fs.readFileSync('./recipes.json', 'utf-8'));

    // Insert recipes into the collection
    const result = await collection.insertMany(recipes);
    console.log(`${result.insertedCount} recipes inserted successfully!`);

    // Close the connection
    client.close();
  } catch (err) {
    console.error('Error inserting recipes:', err.message);
  }
})();
