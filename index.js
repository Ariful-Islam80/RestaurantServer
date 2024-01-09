const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// middlewares
const logger = (req, res, next) => {
  console.log("log info", req.method);
  next()
}

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log('token in the middleware', token);
  // no token available
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" })
    }
    req.user = decoded;
    next();

  })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rqj5bqq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // foods services and pagination

    const foodCollection = client.db("BanglaRestaurant").collection("foods");
    app.get("/foods", async (req, res) => {
      const page = parseInt(req.query.page);
      const skip = parseInt(req.query.skip);

      const result = await foodCollection
        .find()
        .skip(page * skip)
        .limit(skip)
        .toArray();

      res.send(result);
    });
    // for pagination products total count:
    app.get("/foodsCount", async (req, res) => {
      const count = await foodCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // specific data loaded and show

    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: {
          name: 1,
          img: 1,
          category: 1,
          price: 1,
          country: 1,
          description: 1,
        },
      };
      const result = await foodCollection.findOne(query, options);
      res.send(result);
    });

    // user Add foods
    app.get("/userAddFoods", async (req, res) => {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ error: "Email parameter is required" });
      }

      const result = await foodCollection.find({ userEmail: email }).toArray();
      // console.log(result);
      res.send(result);
    });

    // foodCart api
    const cartCollection = client.db("BanglaRestaurant").collection("cart");
    app.get("/addCart", logger, verifyToken, async (req, res) => {
      const { email } = req.query;
      console.log("token owner info", req?.user);
      if (req.user.email !== req.query.email) {
        return res.status(403).send({message:"forbidden access"})
      }

      if (!email) {
        return res.status(400).json({ error: "Email Parameter is required" });
      }
      const result = await cartCollection.find({ userEmail: email }).toArray();
      res.send(result);
    });

    app.post("/addCart", async (req, res) => {
      const data = req.body;

      const result = await cartCollection.insertOne(data);
      res.send(result);
    });

    // my added cart delete
    app.delete("/addCart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // update api
    app.put("/updateFoods/:id", async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const foods = req.body;

      const updatedFoods = {
        $set: {
          ...foods,
        },
      };

      try {
        const result = await foodCollection.updateOne(filter, updatedFoods, option);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });


    // add foods api
    const AddFoodsCollection = client
      .db("BanglaRestaurant")
      .collection("foods");
    app.post("/foods", async (req, res) => {
      const newCard = req.body;

      const result = await AddFoodsCollection.insertOne(newCard);
      res.send(result);
    });

    app.get("/addCart", async (req, res) => {
      const cursor = AddFoodsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //

    // auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1s",
      });

      res
        .cookie("token", token, {
          // httpOnly: true,
          // secure: false,
          // sameSite: "none",
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true });
    });
    // cookie deleted api
    app.post("/logOut", (req, res) => {
      const user = req.body;
      console.log("login out", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Bangla RestaurantServer is Running");
});

app.listen(port, () => {
  console.log(`Bangla Restaurant Server is Running${port}`);
});
