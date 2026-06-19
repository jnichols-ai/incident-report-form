"use client";

import { useMemo, useState } from "react";
import {
  TYPE_OF_INCIDENT_OPTIONS,
  AUTO_ACCIDENT_FIELDS_PART1,
  AUTO_ACCIDENT_FIELDS_PART2,
  TOW_FOLLOWUP_FIELDS,
  INJURY_FOLLOWUP_FIELDS,
  WITNESS_FOLLOWUP_FIELDS,
  POLICE_FOLLOWUP_FIELDS,
  WORK_INJURY_FIELDS,
  PROPERTY_DAMAGE_FIELDS,
  FormField,
  IncidentType,
} from "@/lib/schema";

type Answers = Record<string, string>;

const BRAND_RED = "#c1272d";
const BRAND_BLACK = "#1a1a1a";

function Field({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const commonStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d0d3d8",
    fontSize: 15,
    marginTop: 4,
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 14, fontWeight: 600, color: BRAND_BLACK }}>
        {field.label}
        {field.required ? <span style={{ color: BRAND_RED }}> *</span> : null}
      </label>
      {field.type === "select" ? (
        <select
          style={commonStyle}
          value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          required={field.required}
        >
          <option value="">Select…</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          style={{ ...commonStyle, minHeight: 80, resize: "vertical" }}
          value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          required={field.required}
        />
      ) : (
        <input
          style={commonStyle}
          type={field.type === "date" ? "date" : field.type === "phone" ? "tel" : "text"}
          value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          required={field.required}
        />
      )}
    </div>
  );
}

function Header() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/frontline-logo.jpg" alt="Frontline" style={{ height: 72, objectFit: "contain" }} />
    </div>
  );
}

function FileField({
  label,
  required,
  multiple,
  files,
  onChange,
}: {
  label: string;
  required?: boolean;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 14, fontWeight: 600, color: BRAND_BLACK }}>
        {label}
        {required ? <span style={{ color: BRAND_RED }}> *</span> : null}
      </label>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={(e) => onChange(Array.from(e.target.files || []))}
        required={!!required}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #d0d3d8",
          fontSize: 14,
          marginTop: 4,
          background: "white",
        }}
      />
      {files.length > 0 && (
        <ul style={{ marginTop: 6, paddingLeft: 18, fontSize: 13, color: "#555" }}>
          {files.map((f, i) => (
            <li key={i}>{f.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

type PhotoFields = {
  accidentPhotos: File[];
  policeReportPhoto: File[];
  workInjuryPhotos: File[];
  propertyDamagePhotos: File[];
};

const EMPTY_PHOTOS: PhotoFields = {
  accidentPhotos: [],
  policeReportPhoto: [],
  workInjuryPhotos: [],
  propertyDamagePhotos: [],
};

export default function IncidentForm() {
  const [incidentType, setIncidentType] = useState<IncidentType | "">("");
  const [answers, setAnswers] = useState<Answers>({});
  const [photos, setPhotos] = useState<PhotoFields>(EMPTY_PHOTOS);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const setAnswer = (key: string, value: string) => setAnswers((prev) => ({ ...prev, [key]: value }));
  const setPhotoField = (key: keyof PhotoFields, files: File[]) => setPhotos((prev) => ({ ...prev, [key]: files }));

  const fields = useMemo<FormField[]>(() => {
    if (incidentType === "Work Injury") return WORK_INJURY_FIELDS;
    if (incidentType === "Damager To Customers Property") return PROPERTY_DAMAGE_FIELDS;
    return [];
  }, [incidentType]);

  const showInjuryFollowup = incidentType === "Auto Accident" && answers.wasAnyoneInjured && answers.wasAnyoneInjured !== "No Injuries";
  const showWitnessFollowup = incidentType === "Auto Accident" && answers.witness === "Yes";
  const showPoliceFollowup = incidentType === "Auto Accident" && answers.policeInvolved === "Yes";
  const showTowFollowup = incidentType === "Auto Accident" && answers.vehicleDrivable === "No";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (incidentType === "Auto Accident" && photos.accidentPhotos.length === 0) {
      setStatus("error");
      setErrorMessage("Please attach at least one photo of the accident.");
      return;
    }
    if (incidentType === "Damager To Customers Property" && photos.propertyDamagePhotos.length === 0) {
      setStatus("error");
      setErrorMessage("Please attach at least one photo.");
      return;
    }

    setStatus("submitting");
    try {
      const formData = new FormData();
      formData.append("incidentType", incidentType);
      formData.append("answers", JSON.stringify(answers));
      photos.accidentPhotos.forEach((f) => formData.append("accidentPhotos", f));
      photos.policeReportPhoto.forEach((f) => formData.append("policeReportPhoto", f));
      photos.workInjuryPhotos.forEach((f) => formData.append("workInjuryPhotos", f));
      photos.propertyDamagePhotos.forEach((f) => formData.append("propertyDamagePhotos", f));

      const res = await fetch("/api/submit", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submission failed");
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message);
    }
  }

  if (status === "success") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 80px" }}>
        <Header />
        <div style={{ textAlign: "center", padding: 24 }}>
          <h2 style={{ color: BRAND_BLACK }}>Report submitted</h2>
          <p>Thanks — your incident report has been recorded.</p>
          <button
            onClick={() => { setStatus("idle"); setIncidentType(""); setAnswers({}); setPhotos(EMPTY_PHOTOS); }}
            style={{ marginTop: 16, padding: "10px 20px", borderRadius: 8, border: `1px solid ${BRAND_RED}`, background: "white", color: BRAND_RED, fontWeight: 600, cursor: "pointer" }}
          >
            Submit another report
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 80px" }}>
      <Header />
      <h1 style={{ fontSize: 22, marginBottom: 4, color: BRAND_BLACK }}>Incident Report</h1>
      <p style={{ color: "#666", marginTop: 0, marginBottom: 24 }}>Select what happened, then fill out the details below.</p>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: BRAND_BLACK }}>Type of Incident *</label>
        <select
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d0d3d8", fontSize: 15, marginTop: 4 }}
          value={incidentType}
          onChange={(e) => {
            setIncidentType(e.target.value as IncidentType);
            setAnswers({});
            setPhotos(EMPTY_PHOTOS);
          }}
          required
        >
          <option value="">Select…</option>
          {TYPE_OF_INCIDENT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {fields.map((field) => (
        <Field key={field.key} field={field} value={answers[field.key]} onChange={setAnswer} />
      ))}

      {incidentType === "Auto Accident" && (
        <>
          {AUTO_ACCIDENT_FIELDS_PART1.map((field) => (
            <Field key={field.key} field={field} value={answers[field.key]} onChange={setAnswer} />
          ))}

          {showTowFollowup && (
            <div
              style={{
                background: "#fff3cd",
                border: "1px solid #f0c36d",
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 16,
                fontSize: 14,
                fontWeight: 600,
                color: BRAND_BLACK,
              }}
            >
              If a tow is needed, call us immediately: 800-325-8838 option 2
            </div>
          )}
          {showTowFollowup &&
            TOW_FOLLOWUP_FIELDS.map((field) => (
              <Field key={field.key} field={field} value={answers[field.key]} onChange={setAnswer} />
            ))}

          <FileField
            label="Photos of the Accident"
            required
            multiple
            files={photos.accidentPhotos}
            onChange={(files) => setPhotoField("accidentPhotos", files)}
          />

          <Field
            field={{ key: "wasAnyoneInjured", label: "Was anyone injured?", type: "select", options: ["No Injuries", "Minor Injuries", "Serious Injuries", "Unknown"], required: true }}
            value={answers.wasAnyoneInjured}
            onChange={setAnswer}
          />
          {showInjuryFollowup &&
            INJURY_FOLLOWUP_FIELDS.map((f) => <Field key={f.key} field={f} value={answers[f.key]} onChange={setAnswer} />)}

          {AUTO_ACCIDENT_FIELDS_PART2.map((field) => (
            <Field key={field.key} field={field} value={answers[field.key]} onChange={setAnswer} />
          ))}

          <Field
            field={{ key: "witness", label: "Was there a witness?", type: "select", options: ["Yes", "No"], required: true }}
            value={answers.witness}
            onChange={setAnswer}
          />
          {showWitnessFollowup &&
            WITNESS_FOLLOWUP_FIELDS.map((f) => <Field key={f.key} field={f} value={answers[f.key]} onChange={setAnswer} />)}

          <Field
            field={{ key: "policeInvolved", label: "Were police involved?", type: "select", options: ["Yes", "No"], required: true }}
            value={answers.policeInvolved}
            onChange={setAnswer}
          />
          {showPoliceFollowup && (
            <>
              {POLICE_FOLLOWUP_FIELDS.map((f) => <Field key={f.key} field={f} value={answers[f.key]} onChange={setAnswer} />)}
              <FileField
                label="Picture of Police Report or Paperwork"
                files={photos.policeReportPhoto}
                onChange={(files) => setPhotoField("policeReportPhoto", files)}
              />
            </>
          )}
        </>
      )}

      {incidentType === "Work Injury" && (
        <FileField
          label="Photos"
          multiple
          files={photos.workInjuryPhotos}
          onChange={(files) => setPhotoField("workInjuryPhotos", files)}
        />
      )}

      {incidentType === "Damager To Customers Property" && (
        <FileField
          label="Photos"
          required
          multiple
          files={photos.propertyDamagePhotos}
          onChange={(files) => setPhotoField("propertyDamagePhotos", files)}
        />
      )}

      {incidentType && (
        <button
          type="submit"
          disabled={status === "submitting"}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 8,
            background: BRAND_RED,
            color: "white",
            fontSize: 16,
            fontWeight: 600,
            border: "none",
            marginTop: 12,
            cursor: status === "submitting" ? "not-allowed" : "pointer",
          }}
        >
          {status === "submitting" ? "Submitting…" : "Submit Report"}
        </button>
      )}

      {status === "error" && <p style={{ color: BRAND_RED, marginTop: 12 }}>Error: {errorMessage}</p>}
    </form>
  );
}
