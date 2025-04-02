const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
const commentsCollection = client.db("blog-website").collection('comments');
const wishlistCollection = client.db("blog-website").collection('wishlist');


// get details related api 
app.get('/details/:id', async(req, res) => {
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)};
  const result = await blogCollection.findOne(filter);
  res.send(result);
})
// get update related api 
app.get('/update/:id', async(req, res) => {
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)};
  const result = await blogCollection.findOne(filter);
  res.send(result);

})

// get blogs related api 
app.get("/blogs", async (req, res) => {
  try {
    const search = req.query.searchText;
    let query = {}

    const options = {
      projection: {  author: 0, email: 0 },
    };

    if(search){
      query = { title: { $regex: search, $options: "i" } }
    }

    const result = await blogCollection.find(query, options).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error all blogs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// get resent post related api 
app.get("/resent-post", async (req, res) => {
  try {
    const filter = {
      sort: { time: -1 },
    };
    const options = {
      projection: {  author: 0, email: 0 },
    };

    const result = await blogCollection.find({},options, filter).limit(6).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error all resent post:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/comment/:id", async(req, res) => {
  try {
    const id = req.params.id;
    const query = {id: id}
    const result = await commentsCollection.find(query).toArray();
    res.send(result)
  } catch (error) {
    console.error("Error comment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
})

// post add blog related api 
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


// post comment related api 
app.post('/comment' , async(req, res) => {
  try {
    const commentData = req.body;
    const result = await commentsCollection.insertOne(commentData)
  } catch (error) {
    console.error("Error comment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
})

// wishlist related api
app.post('/wishlist/:id', async(req, res ) => {
  console.log(req.params.id)
  try {
    const id = req.params.id;
    const wishlistData = req.body;
    const filter = {id}
    const findResult = await wishlistCollection.findOne(filter)
    if(findResult){
      console.log('sjlfjsl')
     return res.send({message: "Already Added"})
      
    }else{
      const result = await wishlistCollection.insertOne(wishlistData)
      res.send(result)
      console.log(result)
    }


  } catch (error) {
    console.error("Error wishlist:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
})

// update related api
app.patch('/update/:id', async(req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;
    const filter = {_id: new ObjectId(id)}
    const result = await blogCollection.replaceOne(filter, updateData)
    res.send(result)
  } catch (error) {
    console.error("Error update blog:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
})

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
