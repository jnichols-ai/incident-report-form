import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

// Renders the "Accident Report" PDF laid out to match the original Enterprise
// Fleet Management accident-report form (bordered field boxes, yellow
// highlight callouts, same section order and wording) but with Enterprise's
// green banner/logo swapped for a plain Frontline-neutral title, per Justin's
// instruction: "Same layout, Frontline header." The tow-number callout
// (800-325-8838 option 2) is kept exactly as in the original, per his
// instruction to "keep as-is."

export interface AccidentReportData {
  dateOfIncident?: string;
  location?: string;
  cityState?: string;
  enterpriseUnitNumber?: string;
  vinLast8?: string;
  driverName?: string;
  driverAddress?: string;
  driverPhone?: string;
  repairShopZip?: string;
  wasAnyoneInjured?: string;
  injuryExplanation?: string;
  seatbeltWorn?: string;
  vehicleDrivable?: string;
  roadsideCallNote?: string;
  towedItemsInVehicle?: string;
  vehicleDamageLocation?: string;
  hasDecals?: string;
  airbagDeployed?: string;
  weatherType?: string;
  businessOrPersonalUse?: string;
  carSeatsInVehicle?: string;
  dashcamFootage?: string;
  accidentDescriptionLong?: string;
  stopType?: string;
  claimantName?: string;
  claimantAddress?: string;
  claimantPhone?: string;
  claimantLicenseNumber?: string;
  claimantDob?: string;
  claimantVehicle?: string;
  licensePlateNumber?: string;
  claimantInsuranceCompany?: string;
  claimantInsurancePolicyNumber?: string;
  claimantInsurancePhone?: string;
  claimantDamageLocation?: string;
  claimantDistinguishableMarks?: string;
  witness?: string;
  witnessName?: string;
  witnessAddress?: string;
  witnessPhone?: string;
  policeInvolved?: string;
  policeDepartment?: string;
  policePhone?: string;
  policeReportInfo?: string;
  ticketed?: string;
}

interface Row {
  label: string;
  key?: keyof AccidentReportData;
  note?: string; // static note text, no value box
  highlight?: boolean; // yellow callout
}

interface Section {
  title: string;
  rows: Row[];
}

const SECTIONS: Section[] = [
  {
    title: "",
    rows: [
      { label: "", note: "*Please take pictures at the scene of the accident*" },
      { label: "", note: "*If the other party accepts fault, ask for it in writing, please date and sign*" },
      { label: "Date and Time of Incident:", key: "dateOfIncident" },
      { label: "What street/intersection did the accident happen on?", key: "location" },
      { label: "City/State:", key: "cityState" },
    ],
  },
  {
    title: "Injuries:",
    rows: [
      { label: "Was anyone injured (please include injured passengers)?", key: "wasAnyoneInjured" },
      { label: "If so, please explain (please include any injured passengers):", key: "injuryExplanation" },
    ],
  },
  {
    title: "Driver's Info:",
    rows: [
      { label: "Driver's Name:", key: "driverName" },
      { label: "Driver's Full Home Address (Street/City/State/Zip):", key: "driverAddress" },
      { label: "Driver's Phone Number(s):", key: "driverPhone" },
      { label: "Enterprise Unit#:", key: "enterpriseUnitNumber", highlight: true },
      { label: "Last 8 of VIN#:", key: "vinLast8", highlight: true },
      { label: "Best zip code to locate a nearby repair shop:", key: "repairShopZip" },
      { label: "Were you wearing your seatbelt at the time of the accident?:", key: "seatbeltWorn" },
      { label: "Is the vehicle safely drivable?:", key: "vehicleDrivable" },
      { label: "", note: "If a tow is needed, call us immediately. 800-325-8838 option 2", highlight: true },
      { label: "If the vehicle has already been towed, please provide the location of the vehicle:", key: "roadsideCallNote" },
      { label: "(If towed) Does the vehicle still have work/personal items in it?", key: "towedItemsInVehicle" },
      { label: "Description of the Damage:", key: "vehicleDamageLocation" },
      { label: "Does the vehicle have decals?", key: "hasDecals" },
      { label: "Did your airbag deploy?", key: "airbagDeployed" },
      { label: "What were the weather conditions at the time of the accident?", key: "weatherType" },
      { label: "Business or personal use?", key: "businessOrPersonalUse" },
      { label: "Were there car seats in the vehicle?", key: "carSeatsInVehicle" },
      { label: "Is there dashcam footage available?", key: "dashcamFootage" },
      { label: "Describe how the accident happened:", key: "accidentDescriptionLong" },
      { label: "If applicable: (4-way, 3-way, 2-way stop?) (In motion, completely stopped?)", key: "stopType" },
    ],
  },
  {
    title: "Claimant's information (The other vehicle/pedestrian involved):",
    rows: [
      { label: "Name:", key: "claimantName" },
      { label: "Full Address (Street/City/State/Zip):", key: "claimantAddress" },
      { label: "Phone Number(s):", key: "claimantPhone" },
      { label: "Driver's License Number:", key: "claimantLicenseNumber" },
      { label: "Date of Birth:", key: "claimantDob" },
      { label: "Year, Make, & Model:", key: "claimantVehicle" },
      { label: "License Plate Number & State:", key: "licensePlateNumber" },
      { label: "Insurance Company:", key: "claimantInsuranceCompany" },
      { label: "Insurance Policy Number:", key: "claimantInsurancePolicyNumber" },
      { label: "Insurance Company's Phone Number:", key: "claimantInsurancePhone" },
      { label: "Where is the damage to the vehicle?:", key: "claimantDamageLocation" },
      { label: "Any distinguishable marks on vehicle?:", key: "claimantDistinguishableMarks" },
    ],
  },
  {
    title: "Witness information:",
    rows: [
      {
        label: "",
        note: "**If more than two vehicles were involved, or more than one witness was present, please include their information on an additional page.",
      },
      { label: "Was there a witness?", key: "witness" },
      { label: "Name:", key: "witnessName" },
      { label: "Address:", key: "witnessAddress" },
      { label: "Phone Number(s):", key: "witnessPhone" },
    ],
  },
  {
    title: "Police Report Information:",
    rows: [
      { label: "Were police involved?", key: "policeInvolved" },
      { label: "Police Department:", key: "policeDepartment" },
      { label: "Police Department Phone Number:", key: "policePhone" },
      { label: "Report Number:", key: "policeReportInfo" },
      { label: "Was anyone ticketed?", key: "ticketed" },
    ],
  },
];

const FOOTER_NOTE = "This information is true and correct to the best of my knowledge.";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOX_PAD_X = 8;
const BOX_PAD_Y = 5;
const LABEL_SIZE = 9;
const VALUE_SIZE = 11;
const ROW_GAP = 4;

const BLACK = rgb(0.07, 0.07, 0.07);
const GRAY = rgb(0.4, 0.4, 0.4);
const BORDER = rgb(0.6, 0.6, 0.6);
const YELLOW = rgb(1, 0.93, 0.55);
const RED = rgb(0.76, 0.15, 0.18); // Frontline brand red, for the header bar only

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateAccidentReportPdf(
  data: AccidentReportData,
  meta: { submittedBy?: string; submittedAt?: string } = {}
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let page: PDFPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const newPage = () => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) newPage();
  };

  // --- Header (Frontline-neutral, replaces Enterprise's green banner/logo) ---
  page.drawRectangle({ x: 0, y: y - 38, width: PAGE_WIDTH, height: 44, color: RED });
  page.drawText("Accident Report", {
    x: MARGIN,
    y: y - 26,
    size: 20,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  y -= 54;

  page.drawText(
    `Submitted by: ${meta.submittedBy ?? "Unknown"}    Submitted at: ${meta.submittedAt ?? new Date().toISOString()}`,
    { x: MARGIN, y, size: 8, font, color: GRAY }
  );
  y -= 16;

  const drawSectionTitle = (title: string) => {
    if (!title) return;
    ensureSpace(20);
    page.drawText(title, { x: MARGIN, y, size: 13, font: boldFont, color: BLACK });
    y -= 6;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 1,
      color: BORDER,
    });
    y -= 12;
  };

  // Draws a single bordered field box: label on top, submitted value below.
  // Highlighted rows (the tow number, Enterprise Unit#, VIN#) get a yellow fill,
  // matching the original PDF's callout styling.
  const drawFieldBox = (row: Row) => {
    const isNote = !!row.note;
    const text = isNote ? row.note! : (row.key ? data[row.key] ?? "" : "");
    const displayValue = isNote ? "" : text && text.trim().length > 0 ? text : "(not provided)";

    const labelLines = row.label ? wrapText(row.label, boldFont, LABEL_SIZE, CONTENT_WIDTH - BOX_PAD_X * 2) : [];
    const bodyFont = isNote ? italicFont : font;
    const bodySize = isNote ? 9 : VALUE_SIZE;
    const bodyText = isNote ? row.note! : displayValue;
    const bodyLines = wrapText(bodyText, bodyFont, bodySize, CONTENT_WIDTH - BOX_PAD_X * 2);

    const boxHeight =
      BOX_PAD_Y * 2 +
      labelLines.length * (LABEL_SIZE + 2) +
      (labelLines.length > 0 ? 2 : 0) +
      bodyLines.length * (bodySize + 3);

    ensureSpace(boxHeight + ROW_GAP);

    const boxTop = y;
    const boxBottom = y - boxHeight;

    if (row.highlight) {
      page.drawRectangle({
        x: MARGIN,
        y: boxBottom,
        width: CONTENT_WIDTH,
        height: boxHeight,
        color: YELLOW,
        borderColor: BORDER,
        borderWidth: 1,
      });
    } else {
      page.drawRectangle({
        x: MARGIN,
        y: boxBottom,
        width: CONTENT_WIDTH,
        height: boxHeight,
        borderColor: BORDER,
        borderWidth: 1,
      });
    }

    let cursorY = boxTop - BOX_PAD_Y - LABEL_SIZE;
    for (const line of labelLines) {
      page.drawText(line, { x: MARGIN + BOX_PAD_X, y: cursorY, size: LABEL_SIZE, font: boldFont, color: BLACK });
      cursorY -= LABEL_SIZE + 2;
    }
    if (labelLines.length > 0) cursorY -= 2;
    for (const line of bodyLines) {
      page.drawText(line, {
        x: MARGIN + BOX_PAD_X,
        y: cursorY,
        size: bodySize,
        font: bodyFont,
        color: isNote ? GRAY : rgb(0.05, 0.05, 0.45),
      });
      cursorY -= bodySize + 3;
    }

    y = boxBottom - ROW_GAP;
  };

  for (const section of SECTIONS) {
    drawSectionTitle(section.title);
    for (const row of section.rows) {
      drawFieldBox(row);
    }
    y -= 6;
  }

  ensureSpace(30);
  page.drawText(FOOTER_NOTE, { x: MARGIN, y, size: 10, font: italicFont, color: BLACK });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
