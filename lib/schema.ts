// Central definition of the new "Incident Report Form (PWA)" board structure
// and the field schema used by the form + API route. Keep this in sync with
// the monday board (id 18418451861) if columns are ever added/renamed there.

export const BOARD_ID = "18418451861";

export const GROUP_IDS = {
  AUTO_ACCIDENT: "group_mm4ergee", // "Accident"
  WORK_INJURY: "group_mm4ex29p", // "Work Injury"
  PROPERTY_DAMAGE: "group_mm4erjjg", // "Property Damage"
};

export const TOP_LEVEL_COLUMN_ID = "dropdown_mm4ejzcn"; // "Dropdown" (Type of Incident)

// Maps every field key used in the form to its monday.com column id.
export const COLUMN_IDS: Record<string, string> = {
  // Shared
  dateOfIncident: "date_mm4evkj", // Date and Time of Incident
  location: "location_mm4e7w83",

  // --- Auto Accident ---
  driverName: "text_mm4enbmg",
  driverAddress: "text_mm4etkjp",
  driverPhone: "phone_mm4epawf",
  driverLicenseNumber: "text_mm4ett1e",
  driverDob: "date_mm4e5asg",
  wasAnyoneInjured: "dropdown_mm4ebcht",
  injuryExplanation: "text_mm4e8dzg",
  seatbeltWorn: "dropdown_mm4e46w7",
  vehicleDrivable: "dropdown_mm4en4bd",
  roadsideCallNote: "text_mm4ew2d0",
  vehicleDamageLocation: "text_mm4efnby",
  airbagDeployed: "dropdown_mm4e968m",
  weatherType: "dropdown_mm4e2298",
  accidentDescriptionLong: "long_text_mm4ej9gd",
  accidentDescriptionShort: "text_mm4exvx8",

  claimantName: "text_mm4ern7n",
  claimantAddress: "text_mm4e3m8a",
  claimantPhone: "phone_mm4et2qp",
  claimantLicenseNumber: "text_mm4efa89",
  claimantDob: "date_mm4ecb3w",
  claimantVehicle: "text_mm4e7ea1",
  licensePlateNumber: "text_mm4ecmnw",
  claimantInsurance: "text_mm4egapd",
  claimantInsurancePhone: "phone_mm4e5h5m",
  claimantDamageLocation: "text_mm4et86j",
  claimantDistinguishableMarks: "long_text_mm4earbp",
  claimantAppearance: "long_text_mm4ebgca",

  witness: "dropdown_mm4eaj4w",
  witnessName: "text_mm4e6x8w",
  witnessAddress: "text_mm4ejpj0",
  witnessPhone: "phone_mm4em9vs",

  policeInvolved: "dropdown_mm4e2r8n",
  policeReportInfo: "text_mm4e9h4z",
  policeDepartment: "text_mm4ep9df",

  // --- Work Injury ---
  reportedToManager: "text_mm4es4m6",
  immediateActionTaken: "dropdown_mm4e383y",
  severityLevel: "dropdown_mm4e7902",
  bodyPartAffected: "dropdown_mm4eqjf1",
  typeOfInjury: "dropdown_mm4ewfhs",

  // --- Property Damage ---
  customerAccountNumber: "text_mm4efa23",
  serviceType: "dropdown_mm4ebawz",
  customerName: "text_mm4e9ge4",
  describeDamage: "text_mm4em1m0",
  howDamageOccurred: "text_mm4eng1r",
  customerPresent: "dropdown_mm4evxsp",
  customerNotificationStatus: "color_mm4eg98x",
  estimatedSeverity: "dropdown_mm4eq28e",
};

// File columns are uploaded separately via add_file_to_column, not via column_values.
export const FILE_COLUMN_IDS = {
  accidentPhotos: "file_mm4ec5vb", // Pictures of the Accident
  policeReportPhoto: "file_mm4e9jcc", // Picture of Police report or paperwork
  workInjuryPhotos: "file_mm4edejw", // Photos (MANDATORY)
  propertyDamagePhotos: "file_mm4e21fr", // Photos
  filledReportPdf: "file_mm4eqdz9", // Filled Accident Report PDF (auto-generated)
};

export type IncidentType = "Auto Accident" | "Work Injury" | "Damager To Customers Property";

export interface FormField {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "phone";
  options?: string[];
  required?: boolean;
}

// Top-level branch question
export const TYPE_OF_INCIDENT_OPTIONS: IncidentType[] = [
  "Auto Accident",
  "Work Injury",
  "Damager To Customers Property",
];

// Auto Accident: flat fields shown regardless of secondary answers
export const AUTO_ACCIDENT_FIELDS: FormField[] = [
  { key: "dateOfIncident", label: "Date and Time of Incident", type: "date", required: true },
  { key: "location", label: "Location / Street or Intersection", type: "text", required: true },
  { key: "driverName", label: "Driver's Name", type: "text", required: true },
  { key: "driverAddress", label: "Driver's Full Home Address", type: "text" },
  { key: "driverPhone", label: "Driver's Phone Number", type: "phone" },
  { key: "driverLicenseNumber", label: "Driver's License Number", type: "text" },
  { key: "driverDob", label: "Driver's Date of Birth", type: "date" },
  { key: "seatbeltWorn", label: "Were you wearing your seatbelt?", type: "select", options: ["Yes", "No"] },
  { key: "vehicleDrivable", label: "Is the vehicle safely drivable?", type: "select", options: ["Yes", "No"] },
  { key: "roadsideCallNote", label: "If a tow is needed, note details here (call 800-325-8838 option 2 immediately)", type: "text" },
  { key: "vehicleDamageLocation", label: "Where is the damage to the vehicle?", type: "text" },
  { key: "airbagDeployed", label: "Did your airbag deploy?", type: "select", options: ["Yes", "No", "Unknown"] },
  { key: "weatherType", label: "Weather conditions at time of accident", type: "select", options: ["Clear", "Rain", "Snow", "Fog", "Windy", "Other"] },
  { key: "accidentDescriptionLong", label: "Describe how the accident happened", type: "textarea", required: true },

  { key: "claimantName", label: "Claimant Name (other vehicle/pedestrian)", type: "text" },
  { key: "claimantAddress", label: "Claimant Full Address", type: "text" },
  { key: "claimantPhone", label: "Claimant Phone Number", type: "phone" },
  { key: "claimantLicenseNumber", label: "Claimant Driver's License Number", type: "text" },
  { key: "claimantDob", label: "Claimant Date of Birth", type: "date" },
  { key: "claimantVehicle", label: "Claimant Year, Make, & Model", type: "text" },
  { key: "licensePlateNumber", label: "Claimant License Plate Number & State", type: "text" },
  { key: "claimantInsurance", label: "Claimant Insurance Company & Policy Number", type: "text" },
  { key: "claimantInsurancePhone", label: "Claimant Insurance Company's Phone Number", type: "phone" },
  { key: "claimantDamageLocation", label: "Where is the damage to the claimant's vehicle?", type: "text" },
  { key: "claimantDistinguishableMarks", label: "Any distinguishable marks on claimant's vehicle?", type: "textarea" },
];

// Three nested conditional sub-questions within Auto Accident
export const INJURY_FOLLOWUP_FIELDS: FormField[] = [
  { key: "injuryExplanation", label: "Please explain who was injured and how", type: "textarea", required: true },
];

export const WITNESS_FOLLOWUP_FIELDS: FormField[] = [
  { key: "witnessName", label: "Witness Name", type: "text", required: true },
  { key: "witnessAddress", label: "Witness Address", type: "text" },
  { key: "witnessPhone", label: "Witness Phone Number", type: "phone" },
];

export const POLICE_FOLLOWUP_FIELDS: FormField[] = [
  { key: "policeDepartment", label: "Police Department", type: "text", required: true },
  { key: "policeReportInfo", label: "Police Report Number / Info", type: "text" },
];

// Work Injury: flat, no nested conditions
export const WORK_INJURY_FIELDS: FormField[] = [
  { key: "dateOfIncident", label: "Date and Time of Incident", type: "date", required: true },
  { key: "location", label: "Location", type: "text", required: true },
  { key: "reportedToManager", label: "Reported To (Manager Name)", type: "text", required: true },
  { key: "immediateActionTaken", label: "Immediate Action Taken", type: "select", options: ["Continued working", "Stopped work for the day", "First aid applied", "Reported to manager", "Sought medical care", "Called Nurse Triage"], required: true },
  { key: "severityLevel", label: "Severity Level", type: "select", options: ["Minor – No medical treatment needed", "Moderate – First aid or urgent care recommended", "Serious – Emergency care required"], required: true },
  { key: "bodyPartAffected", label: "Body Part Affected", type: "select", options: ["Hand / Finger", "Arm", "Leg / Foot", "Back", "Head / Face", "Eyes", "Other"] },
  { key: "typeOfInjury", label: "Type of Injury", type: "select", options: ["Cut / Laceration", "Burn", "Bite / Sting", "Slip / Fall", "Strain / Sprain", "Chemical Exposure", "Other"] },
];

// Property Damage: flat, no nested conditions
export const PROPERTY_DAMAGE_FIELDS: FormField[] = [
  { key: "dateOfIncident", label: "Date and Time of Incident", type: "date", required: true },
  { key: "location", label: "Location", type: "text", required: true },
  { key: "customerAccountNumber", label: "Customer Account Number", type: "text" },
  { key: "serviceType", label: "Service Type", type: "select", options: ["GPC", "Termite", "Mosquito", "CB"] },
  { key: "customerName", label: "Customer Name", type: "text", required: true },
  { key: "describeDamage", label: "Describe the Damage", type: "textarea", required: true },
  { key: "howDamageOccurred", label: "How Did the Damage Occur", type: "textarea", required: true },
  { key: "customerPresent", label: "Was the Customer Present?", type: "select", options: ["Yes", "No"] },
  { key: "customerNotificationStatus", label: "Has the customer been notified?", type: "select", options: ["Yes", "No"] },
  { key: "estimatedSeverity", label: "Estimated Severity", type: "select", options: ["Minor (cosmetic / low cost)", "Moderate (repair needed)", "Major (significant damage)"] },
];
