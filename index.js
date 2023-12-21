const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;



// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rqj5bqq.mongodb.net/?retryWrites=true&w=majority`;

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

    const foodCollection = client.db('BanglaRestaurant').collection('foods');
    app.get('/foods', async (req, res) => {
      const page = parseInt(req.query.page);
      const skip = parseInt(req.query.skip);
      console.log(page, skip);
      const result = await foodCollection.find()
        .skip(page * skip)
        .limit(skip)
        .toArray();
      res.send(result);
    })

    app.get('/foodsCount', async (req, res) => {
      const count = await foodCollection.estimatedDocumentCount();
      res.send({ count })
    })

    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { name: 1, img: 1, category: 1, price: 1, country: 1, description: 1 }
      }

      const result = await foodCollection.findOne(query, options);
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Bangla RestaurantServer is Running')
});

app.listen(port, () => {
  console.log(`Bangla Restaurant Server is Running${port}`);
});
