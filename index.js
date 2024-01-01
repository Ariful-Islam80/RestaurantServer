const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser=require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;



// middleware
app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true
})
);
app.use(cookieParser())
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
    // await client.connect();

    // foods services and pagination

    const foodCollection = client.db('BanglaRestaurant').collection('foods');
    app.get('/foods', async (req, res) => {
      const page = parseInt(req.query.page);
      const skip = parseInt(req.query.skip);
      // console.log(page, skip);
      const result = await foodCollection.find()
        .skip(page * skip)
        .limit(skip)
        .toArray();
      // console.log(result);
      res.send(result);
    })
    // for pagination products total count.
    app.get('/foodsCount', async (req, res) => {
      const count = await foodCollection.estimatedDocumentCount();
      res.send({ count })
    })

    // specific data loaded and show

    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { name: 1, img: 1, category: 1, price: 1, country: 1, description: 1 }
      }
      const result = await foodCollection.findOne(query, options);
      res.send(result)
    })

    // foodCart api
    const cartCollection = client.db('BanglaRestaurant').collection('cart');
    app.get('/addCart', async (req, res) => {
      const cursor = cartCollection.find()
      const result = await cursor.toArray()
      res.send(result)

    })

    app.post('/addCart', async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await cartCollection.insertOne(data)
      res.send(result)
    })

    // my added cart delete
    app.delete('/addCart/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await cartCollection.deleteOne(query);
      res.send(result)
    })

    const AddFoodsCollection = client.db('BanglaRestaurant').collection('addFoods');
    app.post('/newFoods', async (req, res) => {
      const newCard = req.body;
      console.log(newCard);
      const result = await AddFoodsCollection.insertOne(newCard);
      res.send(result)
      // console.log(result);
    })


    // auth related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'none'
        // httpOnly: true,
        // secure: process.env.NODE_ENV === 'production',
        // sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
        .send({ success: true });

    })
    // cookie deleted api
    app.post('/logOut', (req, res) => {
      const user = req.body;
      console.log('login out', user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
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
