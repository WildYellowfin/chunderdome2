// Everything about the trip itself lives here so it is easy to tweak.

export const TRIP = {
  name: "Chunderdome II",
  destination: "Dillon Beach",
  destinationDetail: "Dillon Beach, Marin County, CA",
  // Pacific time. Nov 13, 2026 is a Friday.
  departISO: "2026-11-13T18:00:00-08:00",
  returnISO: "2026-11-15T13:00:00-08:00",
  departLabel: "Friday, Nov 13 · 6:00 pm",
  arriveLabel: "~7:30 pm Friday",
  returnLabel: "Home by 1:00 pm Sunday, Nov 15",
  driveTime: "about 1.5 hours",
  sunsetFriday: "4:58 pm",
  tentCapacity: 16,
  // "A couple of smaller tents" owned by the group. Guessing 2 tents x 2 people; edit if wrong.
  groupSmallTentBeds: 4,
  rsvps: 22,
  foodBudget: 35,
  boozeBudget: 20,
};

export const ITINERARY: { day: string; items: { time: string; what: string; note?: string }[] }[] = [
  {
    day: "Friday, Nov 13",
    items: [
      { time: "Before 6 pm", what: "Eat dinner, or grab food for the car", note: "No group dinner Friday. Eat before, or pick something up with your car crew." },
      { time: "6:00 pm", what: "Cars roll out of SF", note: "Sun sets at 4:58, so we drive in the dark. Headlamps within reach." },
      { time: "~7:30 pm", what: "Arrive at Dillon Beach", note: "Raise the Chunderdome. Many hands, fast tent." },
      { time: "Late", what: "Fire, stars, and the first chunder of the weekend" },
    ],
  },
  {
    day: "Saturday, Nov 14",
    items: [
      { time: "Morning", what: "Group breakfast", note: "Provided." },
      { time: "Midday", what: "Group lunch", note: "Provided." },
      { time: "Afternoon", what: "Model rocket launch", note: "Bring a rocket if you have one. Beach, tide pools and naps for the rest." },
      { time: "Evening", what: "Group dinner", note: "Provided. The big one." },
    ],
  },
  {
    day: "Sunday, Nov 15",
    items: [
      { time: "Morning", what: "Group breakfast", note: "Provided." },
      { time: "Late morning", what: "Strike camp, leave no trace" },
      { time: "By 1:00 pm", what: "Everyone home", note: "Some cars may stay later. That's fine, just say so." },
    ],
  },
];

export const MEALS = [
  { meal: "Friday dinner", provided: false, note: "On your own: eat before or on the way" },
  { meal: "Saturday breakfast", provided: true },
  { meal: "Saturday lunch", provided: true },
  { meal: "Saturday dinner", provided: true },
  { meal: "Sunday breakfast", provided: true },
];

export const GROUP_GEAR = [
  "The Chunderdome (16-person tent)",
  "A couple of smaller tents",
  "Giant cooler",
  "Big water cooler",
  "Camping stove",
  "All the cooking gear",
];

// Pickup map. Everyone drops a pin near where they'd like to be picked up;
// the map opens on Clay House, where cars gather.
export const CLAY_HOUSE = { name: "Clay House", address: "1473 Clay St", lat: 37.79325, lng: -122.41695 };

// Neighbourhood centres used to label a dropped pin. Nearest one wins.
export const PLACES: { name: string; lat: number; lng: number; r?: number }[] = [
  { name: "Nob Hill", lat: 37.793, lng: -122.4161 },
  { name: "Russian Hill", lat: 37.8011, lng: -122.4194 },
  { name: "North Beach", lat: 37.8061, lng: -122.4103 },
  { name: "Chinatown", lat: 37.7941, lng: -122.4078 },
  { name: "Financial District", lat: 37.7946, lng: -122.3999 },
  { name: "Marina", lat: 37.8037, lng: -122.4368 },
  { name: "Cow Hollow", lat: 37.7972, lng: -122.4363 },
  { name: "Pacific Heights", lat: 37.7925, lng: -122.4382 },
  { name: "Presidio Heights", lat: 37.7886, lng: -122.453 },
  { name: "Japantown", lat: 37.7854, lng: -122.4294 },
  { name: "Fillmore", lat: 37.7815, lng: -122.4325 },
  { name: "Tenderloin", lat: 37.7847, lng: -122.4141 },
  { name: "SoMa", lat: 37.7785, lng: -122.4056 },
  { name: "Hayes Valley", lat: 37.7759, lng: -122.4245 },
  { name: "NoPa", lat: 37.777, lng: -122.441 },
  { name: "Lower Haight", lat: 37.7717, lng: -122.431 },
  { name: "Haight-Ashbury", lat: 37.7692, lng: -122.4481 },
  { name: "Cole Valley", lat: 37.7656, lng: -122.45 },
  { name: "Inner Richmond", lat: 37.78, lng: -122.4645 },
  { name: "Outer Richmond", lat: 37.7775, lng: -122.495 },
  { name: "Inner Sunset", lat: 37.76, lng: -122.468 },
  { name: "Outer Sunset", lat: 37.755, lng: -122.495 },
  { name: "Parkside", lat: 37.742, lng: -122.488 },
  { name: "West Portal", lat: 37.7405, lng: -122.466 },
  { name: "Twin Peaks", lat: 37.752, lng: -122.447 },
  { name: "Castro", lat: 37.7609, lng: -122.435 },
  { name: "Noe Valley", lat: 37.7502, lng: -122.4337 },
  { name: "Glen Park", lat: 37.734, lng: -122.433 },
  { name: "Mission", lat: 37.7599, lng: -122.4148 },
  { name: "Bernal Heights", lat: 37.739, lng: -122.4156 },
  { name: "Potrero Hill", lat: 37.7587, lng: -122.4011 },
  { name: "Dogpatch", lat: 37.76, lng: -122.388 },
  { name: "Mission Bay", lat: 37.7706, lng: -122.391 },
  { name: "Excelsior", lat: 37.724, lng: -122.426 },
  { name: "Bayview", lat: 37.73, lng: -122.39 },
  { name: "Daly City", lat: 37.6879, lng: -122.4702, r: 4 },
  { name: "South San Francisco", lat: 37.6547, lng: -122.4077, r: 4 },
  { name: "Oakland", lat: 37.8044, lng: -122.2712, r: 6 },
  { name: "Berkeley", lat: 37.8716, lng: -122.2727, r: 4 },
  { name: "Emeryville", lat: 37.8313, lng: -122.2852, r: 2 },
  { name: "Alameda", lat: 37.7652, lng: -122.2416, r: 4 },
  { name: "Sausalito", lat: 37.8591, lng: -122.4853, r: 3 },
  { name: "Mill Valley", lat: 37.906, lng: -122.545, r: 4 },
  { name: "San Rafael", lat: 37.9735, lng: -122.5311, r: 6 },
  { name: "San Mateo", lat: 37.563, lng: -122.3255, r: 8 },
  { name: "Palo Alto", lat: 37.4419, lng: -122.143, r: 10 },
];

/** Straight-line distance in km. */
export function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function placeName(p: { lat: number; lng: number }): string {
  let best = PLACES[0];
  let bestD = Infinity;
  for (const pl of PLACES) {
    const d = kmBetween(p, pl);
    if (d < bestD) { best = pl; bestD = d; }
  }
  return bestD <= (best.r ?? 2.5) ? best.name : "Further afield";
}

export const RETURN_OPTIONS = [
  { value: "1pm", title: "1 PM is perfect" },
  { value: "later", title: "No rush, later is fine too" },
  { value: "earlier", title: "I need to be back earlier" },
] as const;

export const SEAT_OPTIONS = [5, 7, 8] as const;

export const TRUNK_OPTIONS = ["A couple of small bags", "A few duffels and backpacks", "Several large suitcases"] as const;

export const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Gluten-free",
  "Dairy-free",
  "Nut allergy",
  "Shellfish allergy",
  "Kosher",
  "Halal",
  "No pork",
];

// Sleeping gear people can lend. Tents are handled separately (each one has a size).
export const LEND_GEAR: { key: string; label: string; hint?: string }[] = [
  { key: "sleepingBag", label: "Sleeping bags" },
  { key: "sleepingPad", label: "Sleeping pads" },
];

// Gear the hosts want a head count of. Counts include your own.
export const BRING_GEAR: { key: string; label: string; hint?: string }[] = [
  { key: "headlamp", label: "Headlamps", hint: "We arrive after dark" },
  { key: "campChair", label: "Camp chairs", hint: "Fireside seating" },
  { key: "hammock", label: "Hammocks" },
  { key: "lantern", label: "Lanterns", hint: "For the camp table and the dome" },
  { key: "table", label: "Folding tables" },
  { key: "cooler", label: "Medium size coolers", hint: "Enough for 30 beers" },
  { key: "rocket", label: "Model rockets", hint: "Plus spare engines and igniters" },
];

export const EXTRA_GEAR = [...LEND_GEAR, ...BRING_GEAR];
