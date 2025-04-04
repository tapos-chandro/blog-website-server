const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");

app.use(cors(
  {
    origin: "http://localhost:5173", // Allow frontend origin
    credentials: true,  // Allow cookies & auth headers
  }
));
app.use(express.json());
app.use(cookieParser());

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


// jwt relate api 
app.post('/jwt', async(req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
  res.cookie('token', token,{
    httpOnly: true,
    secure: false,
  }).send({success: true})
})


// jwt verify token relate api 
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if(!token){
    return res.status(401).send({message: "unAuthorized access"})
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({message: "unAuthorized access"})
    }
    req.user = decoded;
    next();
  })
}

app.post("/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: false });
  res.send({ message: "Logout successful" });
});


// get details related api 
app.get('/details/:id', verifyToken, async(req, res) => {

  const email = req.query.email

  if(!email){
    return res.status(403).send({message: "forbidden access"})
  }
  console.log(req.user?.email)
  if(email !== req.user?.email){
    return res.status(403).send({message: 'forbidden access'})
  }
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)};
  const result = await blogCollection.findOne(filter);
  res.send(result);
})
// get update related api 
app.get('/update/:id', verifyToken, async(req, res) => {
  const id = req.params.id;
  const email = req.query?.email;
  if(email !== req.user?.email){
    return res.status(403).send({message: 'forbidden access'})
  }
  if(!email){
    return res.status(403).send({message: "forbidden access"})
  }

  const filter = {_id: new ObjectId(id)};
  const result = await blogCollection.findOne(filter);
  res.send(result);

})

// get blogs related api 
app.get("/blogs", async (req, res) => {
  try {
    const search = req.query.searchText;
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


// get resent post related api 
app.get("/resent-post", async (req, res) => {
  try {
    const filter = {
      sort: { time: -1 },
    };

    const result = await blogCollection.find({}, filter).limit(6).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error all resent post:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/comment/:id", verifyToken,  async(req, res) => {
  try {
    const id = req.params.id;
    const email = req.query.email;
    if(email !== req.user?.email){
      return res.status(403).send({message: 'forbidden access'})
    }
    if(!email){ 
      return res.status(403).send({message: "forbidden access"})
    }

    const query = {id: id}
    const result = await commentsCollection.find(query).sort({time: -1}).toArray();
    res.send(result)
  } catch (error) {
    console.error("Error comment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
})
// wishlist related api 
app.get("/wishlist", verifyToken,  async(req, res) => {
  try {
    const email = req.query.email;

    if(email !== req.user?.email){
      return res.status(403).send({message: 'forbidden access'})  
    }
    if(!email){ 
      return res.status(403).send({message: "forbidden access"})
    }

    const filter = {userEmail: email}

    const options = {
      projection: { _id: 0},
    };

    const result = await wishlistCollection.find(filter, options).toArray();
    res.send(result)
    
  } catch (error) {
    console.error("Error get wishlist related:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }

})

// trending blogs related api 

app.get('/trending', async(req, res ) => {
  try {
    const result = await blogCollection.find().sort({commentCount: 1}).limit(6).toArray()
    res.send(result)

  } catch (error) {
    console.error("Error get trending related:", error);
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
    const id = req.body.id;
    const result = await commentsCollection.insertOne(commentData)
    res.send(result)
  } catch (error) {
    console.error("Error comment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
})

// wishlist related api
app.post('/wishlist/:id', async(req, res ) => {
  try {
    const id = req.params.id;
    const wishlistData = req.body;
    const filter = {id}
    const findResult = await wishlistCollection.findOne(filter)
    if(findResult){
     return res.send({message: "Already Added"})
      
    }else{
      const result = await wishlistCollection.insertOne(wishlistData)
      res.send(result)
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

app.patch('/comment/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    const filter = { _id: new ObjectId(id) };
    const findResult = await blogCollection.findOne(filter);
    
    if (!findResult) {
      return res.status(404).json({ message: "Blog not found" });
    }
    const updateDoc = {
      $set: {
        commentCount: Number(findResult?.commentCount || 0) + 1
      }
    };
    const options = { upsert: true };
    const result = await blogCollection.updateOne(filter, updateDoc, options);
    res.send(result)

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

// delate related api 

app.delete('/wishlist/:id', async(req, res) => {
  const id = req.params.id;
  const query = {id}
  const result = await wishlistCollection.deleteOne(query)
  res.send(result)
})

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
