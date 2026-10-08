import { MongoClient, type Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongo: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _indexes: Promise<void> | undefined;
}

async function connect() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    if (process.env.NODE_ENV === "production")
      throw new Error("MONGODB_URI is not set. Add it to your environment variables.");
    // Zero-setup local mode: start a throwaway MongoDB in memory.
    // Data lasts until you stop `npm run dev`.
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const server = await MongoMemoryServer.create();
    uri = server.getUri();
    console.info("\n  No MONGODB_URI set: using a temporary in-memory database.\n");
  }
  return new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect();
}

function client() {
  if (!global._mongo)
    global._mongo = connect().catch((e) => {
      global._mongo = undefined;
      throw e;
    });
  return global._mongo;
}

export type SlotDoc = {
  _id: string; // `${experienceId}|${date}|${time}`
  experienceId: string;
  date: string;
  time: string;
  capacity: number;
  taken: number; // confirmed + active holds
};

export type BookingStatus = "held" | "confirmed" | "checked_in" | "expired" | "cancelled";

export type BookingDoc = {
  _id: string;
  slotId: string;
  experienceId: string;
  date: string;
  time: string;
  price: number;
  status: BookingStatus;
  expiresAt: Date;
  createdAt: Date;
  code?: string;
  confirmedAt?: Date;
  checkedInAt?: Date;
  reminderSentAt?: Date;
  driver?: {
    name: string;
    email: string;
    phone: string;
    licenceNumber: string;
  };
  car?: { make: string; model: string; year: number; registration: string };
  waiver?: { signedName: string; signedAt: Date };
};

export type LeadDoc = {
  _id?: unknown;
  company: string;
  name: string;
  email: string;
  phone: string;
  groupSize: number;
  preferredDate?: string;
  notes?: string;
  status: "new" | "contacted";
  createdAt: Date;
};

export async function getDb(): Promise<Db> {
  const db = (await client()).db(process.env.MONGODB_DB || "ridgeline");
  if (!global._indexes) {
    global._indexes = (async () => {
      await db.collection<BookingDoc>("bookings").createIndexes([
        { key: { status: 1, expiresAt: 1 } },
        { key: { date: 1, status: 1 } },
        { key: { code: 1 }, unique: true, sparse: true },
      ]);
      await db.collection<SlotDoc>("slots").createIndex({ date: 1 });
    })().catch((e) => {
      global._indexes = undefined;
      throw e;
    });
  }
  await global._indexes;
  return db;
}

export async function collections() {
  const db = await getDb();
  return {
    slots: db.collection<SlotDoc>("slots"),
    bookings: db.collection<BookingDoc>("bookings"),
    leads: db.collection<LeadDoc>("leads"),
  };
}
