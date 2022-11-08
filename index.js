const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
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

async function run() {
  try {
    const servicesCollection = client.db("lensTouch").collection("services");

    // get services
    app.get("/services", async (req, res) => {
      const limit = parseInt(req.query.limit);
      const query = {};
      const cursor = servicesCollection.find(query).limit(limit);

      const services = await cursor.toArray();
      res.send(services);
    });

    // get single service
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) };

      const service = await servicesCollection.findOne(query);

      res.send(service);
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
