import { NextRequest, NextResponse } from "next/server";
import { createItem, uploadFileToColumn } from "@/lib/monday";
import { generateAccidentReportPdf } from "@/lib/pdf";
import { BOARD_ID, GROUP_IDS, COLUMN_IDS, TOP_LEVEL_COLUMN_ID, FILE_COLUMN_IDS } from "@/lib/schema";

export const runtime = "nodejs";

interface SubmitBody {
  incidentType: "Auto Accident" | "Work Injury" | "Damager To Customers Property";
  answers: Record<string, string>;
  submittedBy?: string;
}

function groupForIncidentType(incidentType: SubmitBody["incidentType"]): string {
  if (incidentType === "Auto Accident") return GROUP_IDS.AUTO_ACCIDENT;
  if (incidentType === "Work Injury") return GROUP_IDS.WORK_INJURY;
  return GROUP_IDS.PROPERTY_DAMAGE;
}

function itemNameFor(incidentType: SubmitBody["incidentType"], answers: Record<string, string>): string {
  const date = answers.dateOfIncident ? new Date(answers.dateOfIncident).toLocaleDateString() : new Date().toLocaleDateString();
  if (incidentType === "Auto Accident") return `Auto Accident – ${answers.driverName || "Unknown driver"} – ${date}`;
  if (incidentType === "Work Injury") return `Work Injury – ${answers.reportedToManager || "Unreported"} – ${date}`;
  return `Property Damage – ${answers.customerName || "Unknown customer"} – ${date}`;
}

// Dropdown columns need {labels: [value]}; status columns need {label: value} — different formats.
const DROPDOWN_KEYS = new Set([
  "wasAnyoneInjured",
  "seatbeltWorn",
  "vehicleDrivable",
  "airbagDeployed",
  "weatherType",
  "witness",
  "policeInvolved",
  "immediateActionTaken",
  "severityLevel",
  "bodyPartAffected",
  "typeOfInjury",
  "serviceType",
  "customerPresent",
  "estimatedSeverity",
]);
const STATUS_KEYS = new Set(["customerNotificationStatus"]);
const DATE_KEYS = new Set(["dateOfIncident", "driverDob", "claimantDob"]);
const PHONE_KEYS = new Set(["driverPhone", "claimantPhone", "claimantInsurancePhone", "witnessPhone"]);
// "location" is a monday Location-type column. Passing a plain string makes monday
// try to auto-parse it into lat/lng/address and produces garbage. Send the object
// shape directly with address-only (no lat/lng) so it's stored as free text instead.
const LOCATION_KEYS = new Set(["location"]);

function buildColumnValues(incidentType: SubmitBody["incidentType"], answers: Record<string, string>) {
  const columnValues: Record<string, any> = {
    [TOP_LEVEL_COLUMN_ID]: { labels: [incidentType] },
  };

  for (const [key, value] of Object.entries(answers)) {
    const columnId = COLUMN_IDS[key];
    if (!columnId || value === undefined || value === null || value === "") continue;

    if (DROPDOWN_KEYS.has(key)) {
      columnValues[columnId] = { labels: [value] };
    } else if (STATUS_KEYS.has(key)) {
      columnValues[columnId] = { label: value };
    } else if (DATE_KEYS.has(key)) {
      // expects YYYY-MM-DD
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        columnValues[columnId] = { date: date.toISOString().slice(0, 10) };
      }
    } else if (PHONE_KEYS.has(key)) {
      columnValues[columnId] = { phone: value, countryShortName: "US" };
    } else if (LOCATION_KEYS.has(key)) {
      // monday's Location column requires lat/lng alongside address. We don't
      // geocode, so use placeholder coordinates — only the address text matters here.
      columnValues[columnId] = { lat: "0", lng: "0", address: value };
    } else {
      columnValues[columnId] = value;
    }
  }

  return columnValues;
}

export async function POST(req: NextRequest) {
  try {
    const body: SubmitBody = await req.json();
    const { incidentType, answers, submittedBy } = body;

    if (!incidentType || !answers) {
      return NextResponse.json({ error: "Missing incidentType or answers" }, { status: 400 });
    }

    const groupId = groupForIncidentType(incidentType);
    const itemName = itemNameFor(incidentType, answers);
    const columnValues = buildColumnValues(incidentType, answers);

    const itemId = await createItem(BOARD_ID, groupId, itemName, columnValues);

    // Only Auto Accident submissions get the filled Accident Report PDF,
    // since that's the only template we have on file.
    if (incidentType === "Auto Accident") {
      const pdfBuffer = await generateAccidentReportPdf(answers as any, {
        submittedBy,
        submittedAt: new Date().toISOString(),
      });
      await uploadFileToColumn(itemId, FILE_COLUMN_IDS.filledReportPdf, pdfBuffer, `accident-report-${itemId}.pdf`);
    }

    return NextResponse.json({ ok: true, itemId });
  } catch (err: any) {
    console.error("Submit error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
