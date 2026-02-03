export const feedbackTypes = [
  { label: "Improvement", value: "improvement" },
  { label: "Bug", value: "bug" },
  // { label: "Error", value: "error" },
  // { label: "Failure", value: "failure" },
] as const;


export const statusOptions = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

export const COMPANY_EMPLOYEE_RANGES = [
  { value: "all", label: "All company sizes" },
  { value: "small", label: "1-50 employees", min: 1, max: 50 },
  { value: "medium", label: "50-250 employees", min: 50, max: 250 },
  { value: "large", label: "250-1000 employees", min: 250, max: 1000 },
  { value: "enterprise", label: "1000+ employees", min: 1000 },
];

export const LEAD_STAGE_DEFINITIONS = [
  { label: "New", min: 0, max: 15 },
  { label: "Interested", min: 15, max: 30 },
  { label: "Follow-up", min: 30, max: 45 },
  { label: "Appointment Booked", min: 45, max: 60 },
  { label: "Proposal Sent", min: 60, max: 75 },
  { label: "Follow-up to Close", min: 75, max: 90 },
  { label: "Deal Closed", min: 90, max: 100 },
];