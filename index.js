const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var bodyParser = require("body-parser");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// Middleware
app.use(cors());
app.use(express.json());

const instance = new Razorpay({
  key_id: "rzp_test_iKFkKN5XDrjpCi",
  key_secret: "PGtwjp0Ueb2naEdkrKuYKjLb",
});

const uri =
  "mongodb+srv://mern-book-store:nxEll5UTLcuIG891@cluster0.f5twzoh.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Declare usersCollection and paymentsCollection at the top level
let usersCollection;
let paymentsCollection;

async function run() {
  try {
    const bookCollections = client.db("BookInventory").collection("books");
    usersCollection = client.db("BookInventory").collection("users");
    paymentsCollection = client.db("BookInventory").collection("payments");

    app.post("/upload-book", async (req, res) => {
      const data = req.body;
      const result = await bookCollections.insertOne(data);
      res.send(result);
    });

    app.patch("/book/:id", async (req, res) => {
      const id = req.params.id;
      const updateBookData = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...updateBookData,
        },
      };
      const result = await bookCollections.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.delete("/book/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await bookCollections.deleteOne(filter);
      res.send(result);
    });

    app.post("/login", async (req, res) => {
      try {
        const { email, password } = req.body;
        const user = await usersCollection.findOne({ email });
        if (!user) {
          return res.status(400).json({ message: "Invalid email or password" });
        }
        if (password !== user.password) {
          return res.status(400).json({ message: "Invalid email or password" });
        }
        res.status(200).json({ message: "Login successful!" });
      } catch (err) {
        console.error(`Error logging in: ${err}`);
        res
          .status(500)
          .json({ message: "An error occurred while logging in." });
      }
    });

    app.get("/all-books", async (req, res) => {
      let query = {};
      if (req.query?.category) {
        query = { category: req.query.category };
      }
      const result = await bookCollections.find(query).toArray();
      res.send(result);
    });

    app.get("/book/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await bookCollections.findOne(filter);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        const userData = users.map((user) => ({
          id: user._id,
          email: user.email,
          password: user.password,
        }));
        res.json(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.delete("/delete-user/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await usersCollection.deleteOne(filter);
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
      } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.get("/api/getkey", (req, res) => {
      res.status(200).json({ key: "rzp_test_iKFkKN5XDrjpCi" });
    });

    app.post("/api/checkout", async (req, res) => {
      try {
        const options = {
          amount: Number(req.body.amount * 100),
          currency: "INR",
        };
        const order = await instance.orders.create(options);
        res.status(200).json({
          success: true,
          order,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Error fetching data" });
      }
    });

    app.post("/api/paymentverification", async (req, res) => {
      try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
          req.body;
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", "PGtwjp0Ueb2naEdkrKuYKjLb")
          .update(body.toString())
          .digest("hex");
        const isAuthentic = expectedSignature === razorpay_signature;
        if (isAuthentic) {
          await paymentsCollection.insertOne({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
          });
          res.redirect(
            `http://localhost:5173/paymentsuccess?reference=${razorpay_payment_id}`
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Error fetching data" });
      }
    });

    // New endpoint to fetch all payments
    app.get("/payments", async (req, res) => {
      try {
        const payments = await paymentsCollection.find().toArray();
        res.status(200).json(payments);
      } catch (error) {
        console.error("Error fetching payment data:", error);
        res.status(500).json({ message: "Error fetching payment data" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}

run().catch(console.dir);
