import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

// Renders the full "Accident Report" template (same wording as the
// "efleet docusign accident" Google Doc) with each submitted answer printed
// directly under its label. The output PDF always contains both the
// original template text AND the submitted values — never just one or the
// other.

export interface AccidentReportData {
  dateOfIncident?: string;
  location?: string;
  driverName?: string;
  driverAddress?: string;
  driverPhone?: string;
  wasAnyoneInjured?: string;
  injuryExplanation?: string;
  seatbeltWorn?: string;
  vehicleDrivable?: string;
  roadsideCallNote?: string;
  vehicleDamageLocation?: string;
  airbagDeployed?: string;
  weatherType?: string;
  accidentDescriptionLong?: string;
  claimantName?: string;
  claimantAddress?: string;
  claimantPhone?: string;
  claimantLicenseNumber?: string;
  claimantDob?: string;
  claimantVehicle?: string;
  licensePlateNumber?: string;
  claimantInsurance?: string;
  claimantInsurancePhone?: string;
  claimantDamageLocation?: string;
  claimantDistinguishableMarks?: string;
  witness?: string;
  witnessName?: string;
  witnessAddress?: string;
  witnessPhone?: string;
  policeInvolved?: string;
  policeDepartment?: string;
  policeReportInfo?: string;
}

// label, then the data key whose value should print under it (undefined = section header / static note only)
const TEMPLATE_LINES: Array<{ label: string; key?: keyof AccidentReportData; heading?: boolean; note?: boolean }> = [
  { label: "Accident Report", heading: true },
  { label: "*Please take pictures at the scene of the accident*", note: true },
  { label: "*If the other party accepts fault, ask for it in writing, please date and sign*", note: true },
  { label: "Date and Time of Incident:", key: "dateOfIncident" },
  { label: "What street/intersection did the accident happen on?", key: "location" },
  { label: "Injuries:", heading: true },
  { label: "Was anyone injured (please include injured passengers)?", key: "wasAnyoneInjured" },
  { label: "If so, please explain (please include any injured passengers):", key: "injuryExplanation" },
  { label: "Driver's Info:", heading: true },
  { label: "Driver's Name:", key: "driverName" },
  { label: "Driver's Full Home Address (Street/City/State/Zip):", key: "driverAddress" },
  { label: "Driver's Phone Number(s):", key: "driverPhone" },
  { label: "Were you wearing your seatbelt at the time of the accident?:", key: "seatbeltWorn" },
  { label: "Is the vehicle safely drivable?:", key: "vehicleDrivable" },
  { label: "If a tow is needed, call us immediately. 800-325-8838 option 2", note: true },
  { label: "If the vehicle has already been towed, please provide the location of the vehicle:", key: "roadsideCallNote" },
  { label: "Description of the Damage:", key: "vehicleDamageLocation" },
  { label: "Did your airbag deploy?", key: "airbagDeployed" },
  { label: "What were the weather conditions at the time of the accident?", key: "weatherType" },
  { label: "Describe how the accident happened:", key: "accidentDescriptionLong" },
  { label: "Claimant's information (The other vehicle/pedestrian involved):", heading: true },
  { label: "Name:", key: "claimantName" },
  { label: "Full Address (Street/City/State/Zip):", key: "claimantAddress" },
  { label: "Phone Number(s):", key: "claimantPhone" },
  { label: "Driver's License Number:", key: "claimantLicenseNumber" },
  { label: "Date of Birth:", key: "claimantDob" },
  { label: "Year, Make, & Model:", key: "claimantVehicle" },
  { label: "License Plate Number & State:", key: "licensePlateNumber" },
  { label: "Insurance Company / Policy Number:", key: "claimantInsurance" },
  { label: "Insurance Company's Phone Number:", key: "claimantInsurancePhone" },
  { label: "Where is the damage to the vehicle?:", key: "claimantDamageLocation" },
  { label: "Any distinguishable marks on vehicle?:", key: "claimantDistinguishableMarks" },
  { label: "Witness information:", heading: true },
  { label: "Was there a witness?", key: "witness" },
  { label: "Name:", key: "witnessName" },
  { label: "Address:", key: "witnessAddress" },
  { label: "Phone Number(s):", key: "witnessPhone" },
  { label: "Police Report Information:", heading: true },
  { label: "Were police involved?", key: "policeInvolved" },
  { label: "Police Department:", key: "policeDepartment" },
  { label: "Report Number / Info:", key: "policeReportInfo" },
  { label: "This information is true and correct to the best of my knowledge.", note: true },
];

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const LINE_HEIGHT = 16;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
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

  let page: PDFPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  const drawLine = (text: string, opts: { font: PDFFont; size: number; color?: ReturnType<typeof rgb> }) => {
    ensureSpace(LINE_HEIGHT);
    page.drawText(text, { x: MARGIN, y, size: opts.size, font: opts.font, color: opts.color ?? rgb(0, 0, 0) });
    y -= LINE_HEIGHT;
  };

  drawLine("Accident Report", { font: boldFont, size: 18 });
  y -= 6;
  drawLine(`Submitted by: ${meta.submittedBy ?? "Unknown"}    Submitted at: ${meta.submittedAt ?? new Date().toISOString()}`, {
    font,
    size: 9,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 10;

  for (const line of TEMPLATE_LINES) {
    if (line.heading) {
      y -= 4;
      drawLine(line.label, { font: boldFont, size: 13 });
      continue;
    }
    if (line.note) {
      const wrapped = wrapText(line.label, font, 9, PAGE_WIDTH - MARGIN * 2);
      for (const w of wrapped) drawLine(w, { font, size: 9, color: rgb(0.45, 0.45, 0.45) });
      continue;
    }

    // Label (template text) always printed
    drawLine(line.label, { font: boldFont, size: 11 });

    // Submitted value printed directly underneath, even if blank
    const value = line.key ? (data[line.key] ?? "") : "";
    const text = value && value.trim().length > 0 ? value : "(not provided)";
    const wrapped = wrapText(text, font, 11, PAGE_WIDTH - MARGIN * 2 - 10);
    for (const w of wrapped) {
      ensureSpace(LINE_HEIGHT);
      page.drawText(w, { x: MARGIN + 10, y, size: 11, font, color: rgb(0.1, 0.1, 0.5) });
      y -= LINE_HEIGHT;
    }
    y -= 4;
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
