const { MongoClient } = require("mongodb");

// Connection URI for MongoDB Atlas
const uri =
  "mongodb+srv://mern-book-store:nxEll5UTLcuIG891@cluster0.f5twzoh.mongodb.net/?retryWrites=true&w=majority";

// Create a new MongoClient
const client = new MongoClient(uri);

async function insertDummyData() {
  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Access the "orders" collection in the "your_database" database
    const collection = client.db("BookInventory").collection("orders");

    // Dummy data
    const dummyOrders = [
      {
        productName: "Weyward 2",
        quantityAvailable: 100,
        numberOfPurchasing: 10,
      },
      {
        productName: "Holly",
        quantityAvailable: 200,
        numberOfPurchasing: 20,
      },
      {
        productName: "The Housemaid's Secret",
        quantityAvailable: 50,
        numberOfPurchasing: 5,
      },
      {
        productName: "Fourth Wing",
        quantityAvailable: 75,
        numberOfPurchasing: 8,
      },
    ];

    // Insert dummy data into the "orders" collection
    const result = await collection.insertMany(dummyOrders);

    console.log(
      `${result.insertedCount} documents inserted into the collection.`
    );
  } catch (error) {
    console.error("Error inserting dummy data:", error);
  } finally {
    // Close the client connection
    await client.close();
  }
}

// Call the function to insert dummy data
insertDummyData();
