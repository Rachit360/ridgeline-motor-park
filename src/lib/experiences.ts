export type Experience = {
  id: string;
  name: string;
  summary: string;
  duration: string;
  price: number; // INR per car
  capacity: number; // cars per session
  times: string[]; // HH:mm, IST
  carRule: string;
  needsOffroadVehicle?: boolean;
};

export const EXPERIENCES: Experience[] = [
  {
    id: "lapping",
    name: "Lapping session",
    summary:
      "Open lapping on the 2.9 km circuit with marshals on every corner and a briefing before you go out.",
    duration: "25 min on track",
    price: 6500,
    capacity: 12,
    times: ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"],
    carRule: "Any road-legal car that passes the pre-session check.",
  },
  {
    id: "quarter-mile",
    name: "Quarter-mile runs",
    summary:
      "Four timed runs on the drag strip with a printed timeslip for each: reaction time, 60 ft and trap speed.",
    duration: "4 timed runs",
    price: 3500,
    capacity: 16,
    times: ["10:00", "12:00", "15:00", "17:00"],
    carRule: "Any road-legal car. Convertibles need a closed roof.",
  },
  {
    id: "dirt-trail",
    name: "Dirt trail drive",
    summary:
      "A guided loop through water crossings, ruts and steep climbs, with a spotter at every obstacle.",
    duration: "40 min guided",
    price: 4500,
    capacity: 8,
    times: ["09:30", "11:30", "14:30", "16:30"],
    carRule: "SUVs and 4x4s with low-range or terrain modes only.",
    needsOffroadVehicle: true,
  },
  {
    id: "car-control",
    name: "Car control clinic",
    summary:
      "An instructor rides with you on the wet skid pan: catching slides, threshold braking and recovering understeer.",
    duration: "90 min with instructor",
    price: 7500,
    capacity: 6,
    times: ["09:00", "13:00", "15:30"],
    carRule: "Your own car, or ask for one of ours at the desk.",
  },
];

export function getExperience(id: string) {
  return EXPERIENCES.find((e) => e.id === id);
}

export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
