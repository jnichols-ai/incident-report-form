"use client";

import { useMemo, useState } from "react";
import {
  TYPE_OF_INCIDENT_OPTIONS,
  AUTO_ACCIDENT_FIELDS,
  INJURY_FOLLOWUP_FIELDS,
  WITNESS_FOLLOWUP_FIELDS,
  POLICE_FOLLOWUP_FIELDS,
  WORK_INJURY_FIELDS,
  PROPERTY_DAMAGE_FIELDS,
  FormField,
  IncidentType,
} from "@/lib/schema";

type Answers = Record<string, string>;

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
      <label style={{ fontSize: 14, fontWeight: 600, color: "#222" }}>
        {field.label}
        {field.required ? <span style={{ color: "#d23" }}> *</span> : null}
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

export default function IncidentForm() {
  const [incidentType, setIncidentType] = useState<IncidentType | "">("");
  const [answers, setAnswers] = useState<Answers>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const setAnswer = (key: string, value: string) => setAnswers((prev) => ({ ...prev, [key]: value }));

  const fields = useMemo<FormField[]>(() => {
    if (incidentType === "Auto Accident") return AUTO_ACCIDENT_FIELDS;
    if (incidentType === "Work Injury") return WORK_INJURY_FIELDS;
    if (incidentType === "Damager To Customers Property") return PROPERTY_DAMAGE_FIELDS;
    return [];
  }, [incidentType]);

  const showInjuryFollowup = incidentType === "Auto Accident" && answers.wasAnyoneInjured && answers.wasAnyoneInjured !== "No Injuries";
  const showWitnessFollowup = incidentType === "Auto Accident" && answers.witness === "Yes";
  const showPoliceFollowup = incidentType === "Auto Accident" && answers.policeInvolved === "Yes";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentType, answers }),
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
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: 24 }}>
        <h2>Report submitted</h2>
        <p>Thanks — your incident report has been recorded.</p>
        <button onClick={() => { setStatus("idle"); setIncidentType(""); setAnswers({}); }} style={{ marginTop: 16, padding: "10px 20px" }}>
          Submit another report
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 80px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Incident Report</h1>
      <p style={{ color: "#666", marginTop: 0, marginBottom: 24 }}>Select what happened, then fill out the details below.</p>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>Type of Incident *</label>
        <select
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d0d3d8", fontSize: 15, marginTop: 4 }}
          value={incidentType}
          onChange={(e) => {
            setIncidentType(e.target.value as IncidentType);
            setAnswers({});
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
          <Field
            field={{ key: "wasAnyoneInjured", label: "Was anyone injured?", type: "select", options: ["No Injuries", "Minor Injuries", "Serious Injuries", "Unknown"], required: true }}
            value={answers.wasAnyoneInjured}
            onChange={setAnswer}
          />
          {showInjuryFollowup &&
            INJURY_FOLLOWUP_FIELDS.map((f) => <Field key={f.key} field={f} value={answers[f.key]} onChange={setAnswer} />)}

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
          {showPoliceFollowup &&
            POLICE_FOLLOWUP_FIELDS.map((f) => <Field key={f.key} field={f} value={answers[f.key]} onChange={setAnswer} />)}
        </>
      )}

      {incidentType && (
        <button
          type="submit"
          disabled={status === "submitting"}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 8,
            background: "#1a73e8",
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

      {status === "error" && <p style={{ color: "#d23", marginTop: 12 }}>Error: {errorMessage}</p>}
    </form>
  );
}
