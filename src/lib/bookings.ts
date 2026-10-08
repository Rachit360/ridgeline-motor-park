import { collections } from "./db";

export async function findByCode(code: string) {
  const { bookings } = await collections();
  return bookings.findOne({ code: code.toUpperCase(), status: { $in: ["confirmed", "checked_in"] } });
}
