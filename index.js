const express = require('express');
const app = express();
const port =  process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');



app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.elvxgab.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);


const blogCollection = client.db('blog-website').collection('all-blogs');














app.get('/blogs', async (req, res) => {

  try {
    const result = await blogCollection.find().toArray()
    res.send(result)
    
  }catch (error) {
    console.error("Error all blogs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
    
})
app.post('/add-blog', async (req, res) => {

  try {
    const blogData = req.body;

    const result = await blogCollection.insertOne(blogData)
    res.send(result)
    
  }catch (error) {
    console.error("Error adding blog:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
    
})







app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})