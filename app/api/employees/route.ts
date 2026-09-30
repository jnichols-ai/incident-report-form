import { NextResponse } from "next/server";
import { listActiveEmployees } from "@/lib/employees";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Names + ids only. Hire date, DOB, email, phone and job position are looked
// up server-side on submit and are never sent to the browser.
export async function GET() {
  try {
    const employees = await listActiveEmployees();
    return NextResponse.json({ employees });
  } catch (err: any) {
    console.error("Employee list error:", err);
    return NextResponse.json({ error: "Could not load employee list" }, { status: 500 });
  }
}
