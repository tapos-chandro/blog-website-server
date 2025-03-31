const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.elvxgab.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

const blogCollection = client.db("blog-website").collection("all-blogs");

app.get("/blogs", async (req, res) => {
  try {
    const search = req.query.searchText;
    // const searchField = blogCollection.createIndex({title:"text"})

    let query = {}

    if(search){
      query = { title: { $regex: search, $options: "i" } }
    }

    const result = await blogCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error all blogs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/resent-post", async (req, res) => {
  try {
    const options = {
      sort: { time: -1 },
    };
    const result = await blogCollection.find({}, options).limit(6).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error all resent post:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
app.post("/add-blog", async (req, res) => {
  try {
    const blogData = req.body;

    const result = await blogCollection.insertOne(blogData);
    res.send(result);
  } catch (error) {
    console.error("Error adding blog:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
