"use client";

import { useEffect, useMemo, useState } from "react";
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

// Vercel serverless functions hard-cap request bodies at 4.5MB and reject
// anything larger with a plain-text 413 before it ever reaches our API route.
// Phone camera photos routinely come in at 3-10MB each, so without
// compression a single accident photo (let alone several) can blow past
// that limit. We downscale + re-encode every photo client-side before it's
// ever added to the form so submissions stay well under the cap.
const MAX_PHOTO_DIMENSION = 1600;
const PHOTO_JPEG_QUALITY = 0.8;

async function compressImage(file: File): Promise<File> {
  // Only attempt to compress actual images; pass through anything else
  // (e.g. if a non-image somehow gets selected) so we never block a valid
  // submission because compression doesn't apply.
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", PHOTO_JPEG_QUALITY)
    );
    if (!blob) return file;

    // If compression somehow produced a larger file (rare, e.g. tiny source
    // images), just keep the original rather than making things worse.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // If the browser can't decode/compress it for any reason, fall back to
    // the original file rather than blocking the user from submitting.
    return file;
  }
}

type EmployeeOption = { id: string; name: string };

// Employee picker: type to search the directory, then pick a name. Only the id
// is kept (as answers.employeeId); everything else about the employee is looked
// up server-side on submit and is never shown here.
function EmployeeField({
  field,
  value,
  employees,
  loadFailed,
  onPick,
}: {
  field: FormField;
  value: string;
  employees: EmployeeOption[];
  loadFailed: boolean;
  onPick: (name: string, id: string) => void;
}) {
  // Label shown in the list. Duplicate names get a number so each one is selectable.
  const options = useMemo(() => {
    const seen = new Map<string, number>();
    return employees.map((e) => {
      const n = (seen.get(e.name) || 0) + 1;
      seen.set(e.name, n);
      return { id: e.id, name: e.name, label: n > 1 ? `${e.name} (${n})` : e.name };
    });
  }, [employees]);

  const listId = `employees-${field.key}`;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const typed = e.target.value;
    const match = options.find((o) => o.label === typed);
    onPick(match ? match.label : typed, match ? match.id : "");
    // Must pick a name from the directory — unless the list couldn't load, in which
    // case plain typing is allowed so nobody is blocked from reporting.
    e.target.setCustomValidity(loadFailed || match || !typed ? "" : "Please choose a name from the list.");
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 14, fontWeight: 600, color: BRAND_BLACK }}>
        {field.label}
        {field.required ? <span style={{ color: BRAND_RED }}> *</span> : null}
      </label>
      <input
        list={listId}
        value={value || ""}
        onChange={handleChange}
        required={field.required}
        placeholder={loadFailed ? "Employee list unavailable — type your full name" : "Start typing your name…"}
        autoComplete="off"
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d0d3d8", fontSize: 15, marginTop: 4 }}
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o.id} value={o.label} />
        ))}
      </datalist>
    </div>
  );
}

function Field({
  field,
  value,
  onChange,
  employees,
  employeesFailed,
  onPickEmployee,
}: {
  field: FormField;
  value: string;
  onChange: (key: string, value: string) => void;
  employees?: EmployeeOption[];
  employeesFailed?: boolean;
  onPickEmployee?: (name: string, id: string) => void;
}) {
  if (field.type === "employee" && onPickEmployee) {
    return (
      <EmployeeField
        field={field}
        value={value}
        employees={employees || []}
        loadFailed={!!employeesFailed}
        onPick={onPickEmployee}
      />
    );
  }

  const commonStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d0d3d8",
    fontSize: 15,
    marginTop: 4,
  };

  if (field.type === "checkbox") {
    return (
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            fontWeight: 600,
            color: BRAND_BLACK,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => onChange(field.key, e.target.checked ? "true" : "")}
            style={{ width: 22, height: 22 }}
          />
          {field.label}
        </label>
      </div>
    );
  }

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
  onCompressingChange,
}: {
  label: string;
  required?: boolean;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  onCompressingChange?: (compressing: boolean) => void;
}) {
  const [compressing, setCompressing] = useState(false);

  async function handleFiles(selected: File[]) {
    if (selected.length === 0) {
      onChange([]);
      return;
    }
    setCompressing(true);
    onCompressingChange?.(true);
    try {
      const compressed = await Promise.all(selected.map(compressImage));
      onChange(compressed);
    } finally {
      setCompressing(false);
      onCompressingChange?.(false);
    }
  }

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
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
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
      {compressing && <p style={{ marginTop: 6, fontSize: 13, color: "#555" }}>Preparing photo(s)…</p>}
      {!compressing && files.length > 0 && (
        <ul style={{ marginTop: 6, paddingLeft: 18, fontSize: 13, color: "#555" }}>
          {files.map((f, i) => (
            <li key={i}>
              {f.name} ({(f.size / 1024).toFixed(0)} KB)
            </li>
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
  // Tracks how many photo fields are actively compressing, so the submit
  // button can be disabled until it's safe to read final file sizes.
  const [compressingCount, setCompressingCount] = useState(0);
  const setFieldCompressing = (delta: 1 | -1) => setCompressingCount((prev) => Math.max(0, prev + delta));

  const setAnswer = (key: string, value: string) => setAnswers((prev) => ({ ...prev, [key]: value }));
  const setPhotoField = (key: keyof PhotoFields, files: File[]) => setPhotos((prev) => ({ ...prev, [key]: files }));

  // Employee directory (names only) for the Employee Name picker.
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeesFailed, setEmployeesFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/employees")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then((j) => {
        if (cancelled) return;
        if (Array.isArray(j?.employees) && j.employees.length > 0) setEmployees(j.employees);
        else setEmployeesFailed(true);
      })
      .catch(() => {
        if (!cancelled) setEmployeesFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const pickEmployee = (name: string, id: string) =>
    setAnswers((prev) => ({ ...prev, employeeName: name, employeeId: id }));
  const employeeProps = { employees, employeesFailed, onPickEmployee: pickEmployee };

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

      // Don't assume the response is JSON: infra-level failures (e.g. Vercel's
      // 413 when a request body is too large) return a plain-text/HTML body,
      // and calling res.json() on that throws a confusing "Unexpected token"
      // parse error instead of a useful message.
      const raw = await res.text();
      let json: any = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error("These photos are still too large to upload. Try attaching fewer photos, or lower-resolution ones.");
        }
        throw new Error(json?.error || `Submission failed (status ${res.status}). Please try again.`);
      }
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
        <Field key={field.key} field={field} value={answers[field.key]} onChange={setAnswer} {...employeeProps} />
      ))}

      {incidentType === "Auto Accident" && (
        <>
          {AUTO_ACCIDENT_FIELDS_PART1.map((field) => (
            <Field key={field.key} field={field} value={answers[field.key]} onChange={setAnswer} {...employeeProps} />
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
            onCompressingChange={(c) => setFieldCompressing(c ? 1 : -1)}
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
                onCompressingChange={(c) => setFieldCompressing(c ? 1 : -1)}
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
          onCompressingChange={(c) => setFieldCompressing(c ? 1 : -1)}
        />
      )}

      {incidentType === "Damager To Customers Property" && (
        <FileField
          label="Photos"
          required
          multiple
          files={photos.propertyDamagePhotos}
          onChange={(files) => setPhotoField("propertyDamagePhotos", files)}
          onCompressingChange={(c) => setFieldCompressing(c ? 1 : -1)}
        />
      )}

      {incidentType && (
        <button
          type="submit"
          disabled={status === "submitting" || compressingCount > 0}
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
            cursor: status === "submitting" || compressingCount > 0 ? "not-allowed" : "pointer",
          }}
        >
          {status === "submitting" ? "Submitting…" : compressingCount > 0 ? "Preparing photos…" : "Submit Report"}
        </button>
      )}

      {status === "error" && <p style={{ color: BRAND_RED, marginTop: 12 }}>Error: {errorMessage}</p>}
    </form>
  );
}
