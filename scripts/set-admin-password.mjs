import { MongoClient, ServerApiVersion } from "mongodb";
import { hashPassword } from "../lib/password.mjs";

const [number, password, ...flags] = process.argv.slice(2);
const create = flags.includes("--create");

if (!number || !password) {
  console.error(
    'Usage: node --env-file=.env.local scripts/set-admin-password.mjs <number> "<password>" [--create]',
  );
  process.exit(1);
}
if (!/^\d{6,15}$/.test(number)) {
  console.error("Number must be 6-15 digits.");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6cld7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

try {
  await client.connect();
  const admins = client.db("MosqueDB").collection("admin");
  const passwordHash = await hashPassword(password);
  const exists = await admins.findOne({ number });

  if (!exists && !create) {
    console.error(`No admin for ${number}. Use --create to add one.`);
    process.exitCode = 1;
  } else if (!exists) {
    await admins.insertOne({ number, admin: true, passwordHash });
    console.log(`Created admin ${number}.`);
  } else {
    await admins.updateOne(
      { number },
      { $set: { passwordHash }, $unset: { password: "" } },
    );
    console.log(`Password updated for ${number}.`);
  }
} finally {
  await client.close();
}
