import { MongoClient, ServerApiVersion } from "mongodb";

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6cld7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // Preserve the connection across Hot Module Reloads in dev
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// Convenience accessor for all collections used across the API routes
export async function getCollections() {
  const client = await clientPromise;
  const db = client.db("MosqueDB2");
  return {
    userCollection: db.collection("users"),
    shopKeeperCollection: db.collection("shopKeeper"),
    adminCollection: db.collection("admin"),
    paymentCollection: db.collection("payment"),
    smsCollection: db.collection("sms"),
    lastClosingCollection: db.collection("yearClose"),
  };
}
