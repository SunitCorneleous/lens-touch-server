const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb config
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jjvalws.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// verify jwt function
function verifyJWT(req, res, next) {
  // get auth token from req header
  const authHeader = req.headers.authorization;

  // check if the auth token exists
  if (!authHeader) {
    res.status(401).send({ message: "unauthorized access" });
  }

  // split the token
  const token = authHeader.split(" ")[1];

  // verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    // set the decoded token to req
    req.decoded = decoded;
    // forward
    next();
  });
}

async function run() {
  try {
    const servicesCollection = client.db("lensTouch").collection("services");
    const reviewsCollection = client.db("lensTouch").collection("reviews");

    // get token
    app.post("/jwt", (req, res) => {
      const user = req.body;

      // create token
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.send({ token });
    });

    // get services
    app.get("/services", async (req, res) => {
      const limit = parseInt(req.query.limit);
      const query = {};
      const cursor = servicesCollection.find(query).limit(limit);

      const services = await cursor.toArray();
      res.send(services);
    });

    // get service by id
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) };

      const service = await servicesCollection.findOne(query);

      res.send(service);
    });

    // add a new service
    app.post("/services", async (req, res) => {
      const newService = req.body;

      const result = await servicesCollection.insertOne(newService);

      res.send(result);
      console.log(result);
    });

    // post review
    app.post("/reviews", async (req, res) => {
      const review = req.body;

      const doc = {
        ...review,
        date: new Date(),
      };

      const result = await reviewsCollection.insertOne(doc);

      res.send(result);
    });

    // update a review
    app.put("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const review = req.body;
      const updatedDoc = {
        $set: review,
      };

      const options = { upsert: true };

      const result = await reviewsCollection.updateOne(
        query,
        updatedDoc,
        options
      );

      res.send(result);
    });

    // get all reviews by serviceId
    app.get("/reviews/:serviceId", async (req, res) => {
      const query = { service_id: req.params.serviceId };

      const cursor = reviewsCollection.find(query).sort({ date: -1 });
      const result = await cursor.toArray();

      res.send(result);
    });

    // get reviews by email
    app.get("/myreviews/:email", verifyJWT, async (req, res) => {
      const query = { user_email: req.params.email };
      const decoded = req.decoded;

      if (decoded.email !== req.params.email) {
        res.status(401).send({
          message: "unauthorized access",
        });
      }

      const cursor = reviewsCollection.find(query);
      const reviews = await cursor.toArray();

      res.send(reviews);
    });

    // get reviews by id
    app.get("/myreview/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const review = await reviewsCollection.findOne(query);

      res.send(review);
    });

    // delete a review by id
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) };

      const result = await reviewsCollection.deleteOne(query);

      console.log(result);
      res.send(result);
    });
  } finally {
    //
  }
}

run().catch(err => console.log(err));

// home route
app.get("/", (req, res) => {
  res.send("<h1>Lens Touch server is running</h1>");
});

// app running
app.listen(port, () => {
  console.log(`server is running at port ${port}`);
});
