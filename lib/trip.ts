// Everything about the trip itself lives here so it is easy to tweak.

export const TRIP = {
  name: "Chunderdome II",
  tagline: "Two nights. Twenty-odd souls. One very large tent.",
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
  foodBudget: 30,
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

// Rough areas, finer than zip codes but no addresses.
export const AREAS = [
  "SF · Mission / Bernal",
  "SF · Castro / Noe / Glen Park",
  "SF · Haight / Cole Valley / Inner Sunset",
  "SF · Outer Sunset / Parkside",
  "SF · Richmond",
  "SF · Marina / Cow Hollow / Pac Heights",
  "SF · NoPa / Western Addition / Hayes",
  "SF · SoMa / Mission Bay / Dogpatch / Potrero",
  "SF · Downtown / Nob Hill / North Beach",
  "SF · Excelsior / Bayview / South",
  "East Bay · Oakland / Berkeley",
  "Marin / North Bay",
  "Peninsula / South Bay",
  "Somewhere else",
];

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

// Things people might have spare and could lend.
export const EXTRA_GEAR: { key: string; label: string; hint?: string }[] = [
  { key: "sleepingBag", label: "Sleeping bags" },
  { key: "sleepingPad", label: "Sleeping pads" },
  { key: "blanket", label: "Big warm blankets" },
  { key: "pillow", label: "Camp pillows" },
  { key: "headlamp", label: "Headlamps / torches" },
  { key: "campChair", label: "Camp chairs" },
  { key: "lantern", label: "Lanterns" },
  { key: "tent", label: "Tents", hint: "Tell us how many people they sleep below." },
  { key: "rocket", label: "Model rockets", hint: "Plus spare engines and igniters if you have them." },
  { key: "speaker", label: "Bluetooth speakers" },
  { key: "firewood", label: "Bundles of firewood" },
];
