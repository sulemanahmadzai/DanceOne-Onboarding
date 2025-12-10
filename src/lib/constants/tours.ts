// Tour names list - shared across the application
export const TOUR_NAMES = [
  { value: "Starpower", label: "Starpower" },
  { value: "Revolution", label: "Revolution" },
  { value: "Imagine", label: "Imagine" },
  { value: "Nexstar", label: "Nexstar" },
  { value: "DreamMaker", label: "DreamMaker" },
  { value: "Believe", label: "Believe" },
  { value: "Wild", label: "Wild" },
  { value: "Radix", label: "Radix" },
  { value: "Jump", label: "Jump" },
  { value: "24Seven", label: "24Seven" },
  { value: "Nuvo", label: "Nuvo" },
  { value: "Kaos", label: "Kaos" },
  { value: "Ovation", label: "Ovation" },
  { value: "Power Pak", label: "Power Pak" },
  { value: "WCW WDP", label: "WCW WDP" },
  { value: "Other", label: "Other" },
];

// Get all tour values for filtering (excluding "Other")
export const TOUR_FILTER_OPTIONS = TOUR_NAMES.filter(
  (t) => t.value !== "Other"
);
