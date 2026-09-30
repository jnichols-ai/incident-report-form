// Read-only access to the monday "Employee Directory" board (HR workspace).
// Used for (1) the employee picker on the form (names only) and (2) server-side
// enrichment on submit (hire date, DOB, email, phone, job position). The
// enrichment data never goes back to the browser.

import { mondayGraphQL } from "@/lib/monday";
import {
  EMPLOYEE_DIRECTORY_BOARD_ID,
  EMPLOYEE_DIRECTORY_ACTIVE_GROUP_ID,
  EMPLOYEE_DIRECTORY_COLUMNS,
} from "@/lib/schema";

export interface EmployeeOption {
  id: string;
  name: string;
}

export interface EmployeeDetails {
  id: string;
  name: string;
  hireDate?: string; // YYYY-MM-DD
  dateOfBirth?: string; // YYYY-MM-DD
  email?: string;
  phone?: { phone: string; countryShortName: string };
  jobPosition?: string;
}

// ---- Name list (cached in memory per serverless instance) ----

const LIST_TTL_MS = 5 * 60 * 1000;
let listCache: { at: number; employees: EmployeeOption[] } | null = null;

export async function listActiveEmployees(): Promise<EmployeeOption[]> {
  if (listCache && Date.now() - listCache.at < LIST_TTL_MS) return listCache.employees;

  const employees: EmployeeOption[] = [];

  const first = await mondayGraphQL<{
    boards: { groups: { items_page: { cursor: string | null; items: EmployeeOption[] } }[] }[];
  }>(
    `query ($boardId: [ID!], $groupId: [String!]) {
      boards(ids: $boardId) {
        groups(ids: $groupId) {
          items_page(limit: 500) {
            cursor
            items { id name }
          }
        }
      }
    }`,
    { boardId: [EMPLOYEE_DIRECTORY_BOARD_ID], groupId: [EMPLOYEE_DIRECTORY_ACTIVE_GROUP_ID] }
  );

  const page = first.boards?.[0]?.groups?.[0]?.items_page;
  if (page) {
    employees.push(...page.items);
    let cursor = page.cursor;
    // Safety cap on pagination.
    for (let i = 0; cursor && i < 10; i++) {
      const next: { next_items_page: { cursor: string | null; items: EmployeeOption[] } } = await mondayGraphQL(
        `query ($cursor: String!) {
          next_items_page(limit: 500, cursor: $cursor) {
            cursor
            items { id name }
          }
        }`,
        { cursor }
      );
      employees.push(...next.next_items_page.items);
      cursor = next.next_items_page.cursor;
    }
  }

  employees.sort((a, b) => a.name.localeCompare(b.name));
  listCache = { at: Date.now(), employees };
  return employees;
}

// ---- Details for one employee ----

function parseJson(value: string | null | undefined): any {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Looks up one employee by directory item id. Returns null if the id is not an
 * item on the Employee Directory board (the token can read other boards, so we
 * must not trust an id that came from the browser).
 */
export async function getEmployeeDetails(itemId: string): Promise<EmployeeDetails | null> {
  if (!/^\d+$/.test(itemId)) return null;

  const c = EMPLOYEE_DIRECTORY_COLUMNS;
  const ids = [c.hireDate, c.birthday, c.email, c.workEmail, c.phone, c.workPhone, c.jobPosition];

  const data = await mondayGraphQL<{
    items: {
      id: string;
      name: string;
      board: { id: string };
      column_values: { id: string; text: string | null; value: string | null }[];
    }[];
  }>(
    `query ($ids: [ID!], $colIds: [String!]) {
      items(ids: $ids) {
        id
        name
        board { id }
        column_values(ids: $colIds) { id text value }
      }
    }`,
    { ids: [itemId], colIds: ids }
  );

  const item = data.items?.[0];
  if (!item || item.board?.id !== EMPLOYEE_DIRECTORY_BOARD_ID) return null;

  const col = (id: string) => item.column_values.find((v) => v.id === id);

  const dateOf = (id: string): string | undefined => {
    const d = parseJson(col(id)?.value)?.date;
    return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : undefined;
  };

  const emailOf = (id: string): string | undefined => {
    const e = parseJson(col(id)?.value)?.email || col(id)?.text;
    return e ? String(e).trim() || undefined : undefined;
  };

  const phoneOf = (id: string): EmployeeDetails["phone"] => {
    const v = parseJson(col(id)?.value);
    if (v?.phone) return { phone: String(v.phone), countryShortName: v.countryShortName || "US" };
    const t = col(id)?.text?.trim();
    return t ? { phone: t, countryShortName: "US" } : undefined;
  };

  return {
    id: item.id,
    name: item.name,
    hireDate: dateOf(c.hireDate),
    dateOfBirth: dateOf(c.birthday),
    // Personal contact info first; fall back to the work one if it's blank.
    email: emailOf(c.email) ?? emailOf(c.workEmail),
    phone: phoneOf(c.phone) ?? phoneOf(c.workPhone),
    jobPosition: col(c.jobPosition)?.text?.trim() || undefined,
  };
}
