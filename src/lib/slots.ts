import { randomBytes, randomUUID } from "crypto";
import { collections, type BookingDoc } from "./db";
import { EXPERIENCES, getExperience } from "./experiences";
import { nowInIST } from "./time";

export const HOLD_MINUTES = 10;

const slotId = (experienceId: string, date: string, time: string) =>
  `${experienceId}|${date}|${time}`;

/**
 * Release holds whose timer ran out. Each hold is flipped to "expired" with an
 * atomic status check, so even if two requests sweep at once a seat is only
 * returned to the slot once.
 */
export async function releaseExpiredHolds() {
  const { bookings, slots } = await collections();
  for (let i = 0; i < 100; i++) {
    const expired = await bookings.findOneAndUpdate(
      { status: "held", expiresAt: { $lt: new Date() } },
      { $set: { status: "expired" } },
    );
    if (!expired) break;
    await slots.updateOne({ _id: expired.slotId }, { $inc: { taken: -1 } });
  }
}

export type SlotAvailability = {
  time: string;
  capacity: number;
  remaining: number;
  past: boolean;
};

export async function getAvailability(
  experienceId: string,
  date: string,
): Promise<SlotAvailability[]> {
  const exp = getExperience(experienceId);
  if (!exp) throw new Error("Unknown experience");
  await releaseExpiredHolds();
  const { slots } = await collections();
  const docs = await slots
    .find({ _id: { $in: exp.times.map((t) => slotId(exp.id, date, t)) } })
    .toArray();
  const byId = new Map(docs.map((d) => [d._id, d]));
  const now = nowInIST();
  return exp.times.map((time) => {
    const doc = byId.get(slotId(exp.id, date, time));
    const capacity = doc?.capacity ?? exp.capacity;
    const taken = doc?.taken ?? 0;
    const past = date < now.date || (date === now.date && time <= now.time);
    return { time, capacity, remaining: Math.max(0, capacity - taken), past };
  });
}

/** Availability for every experience on one date, used by the live board. */
export async function getDayBoard(date: string) {
  return Promise.all(
    EXPERIENCES.map(async (exp) => ({
      experience: exp,
      slots: await getAvailability(exp.id, date),
    })),
  );
}

export class BookingError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/**
 * Reserve one car's place in a slot for HOLD_MINUTES.
 *
 * The seat is claimed with a single conditional update (`taken < capacity`),
 * which MongoDB applies atomically to the document. When two people race for
 * the last place, exactly one update matches and the other gets "slot full".
 */
export async function createHold(experienceId: string, date: string, time: string) {
  const exp = getExperience(experienceId);
  if (!exp || !exp.times.includes(time)) throw new BookingError("That session doesn't exist.");
  const now = nowInIST();
  if (date < now.date || (date === now.date && time <= now.time))
    throw new BookingError("That session has already started.");

  await releaseExpiredHolds();
  const { slots, bookings } = await collections();
  const id = slotId(exp.id, date, time);

  try {
    await slots.updateOne(
      { _id: id },
      {
        $setOnInsert: {
          experienceId: exp.id,
          date,
          time,
          capacity: exp.capacity,
          taken: 0,
        },
      },
      { upsert: true },
    );
  } catch (e) {
    // Two first-ever requests can race on the upsert; the loser sees a
    // duplicate key error, which just means the slot now exists.
    if ((e as { code?: number }).code !== 11000) throw e;
  }

  const claimed = await slots.findOneAndUpdate(
    { _id: id, $expr: { $lt: ["$taken", "$capacity"] } },
    { $inc: { taken: 1 } },
  );
  if (!claimed) throw new BookingError("That session just sold out. Pick another time.", 409);

  const hold: BookingDoc = {
    _id: randomUUID(),
    slotId: id,
    experienceId: exp.id,
    date,
    time,
    price: exp.price,
    status: "held",
    expiresAt: new Date(Date.now() + HOLD_MINUTES * 60_000),
    createdAt: new Date(),
  };
  await bookings.insertOne(hold);
  return hold;
}

function passCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let s = "RL-";
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return s;
}

export async function confirmHold(
  holdId: string,
  details: Pick<BookingDoc, "driver" | "car" | "waiver">,
) {
  const { bookings } = await collections();
  // Only a hold that is still "held" and inside its timer can be confirmed.
  const confirmed = await bookings.findOneAndUpdate(
    { _id: holdId, status: "held", expiresAt: { $gt: new Date() } },
    {
      $set: {
        ...details,
        status: "confirmed",
        code: passCode(),
        confirmedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );
  if (!confirmed)
    throw new BookingError(
      "Your 10-minute hold ran out and the place was released. Choose the session again.",
      410,
    );
  return confirmed;
}

export async function releaseHold(holdId: string) {
  const { bookings, slots } = await collections();
  const released = await bookings.findOneAndUpdate(
    { _id: holdId, status: "held" },
    { $set: { status: "cancelled" } },
  );
  if (released) await slots.updateOne({ _id: released.slotId }, { $inc: { taken: -1 } });
}
