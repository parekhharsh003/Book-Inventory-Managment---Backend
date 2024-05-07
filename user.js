const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
const port = 5000;

// MongoDB Atlas connection string
const uri =
  "mongodb+srv://mern-book-store:nxEll5UTLcuIG891@cluster0.f5twzoh.mongodb.net/?retryWrites=true&w=majority";

// Create a new MongoClient
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
const connectToMongoDB = async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("Error connecting to MongoDB Atlas:", error);
  }
};

connectToMongoDB();

app.post("/signup", async (req, res) => {
  try {
    const usersCollection = client.db("BookInventory").collection("users");
    const result = await usersCollection.insertOne(req.body);
    console.log(`User inserted with ID: ${result.insertedId}`);
    res.status(201).json({ message: "User signed up successfully!" });
  } catch (err) {
    console.error("Error inserting user:", err);
    res
      .status(500)
      .json({
        message: "An error occurred while signing up.",
        error: err.toString(),
      });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
