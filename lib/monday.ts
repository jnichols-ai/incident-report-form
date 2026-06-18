// Thin client for the monday.com GraphQL + file-upload APIs.
// Requires MONDAY_API_TOKEN to be set in the environment (Vercel project settings).

const MONDAY_API_URL = "https://api.monday.com/v2";
const MONDAY_FILE_URL = "https://api.monday.com/v2/file";

function getToken(): string {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) throw new Error("MONDAY_API_TOKEN is not set");
  return token;
}

export async function mondayGraphQL<T = any>(query: string, variables: Record<string, any>): Promise<T> {
  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken(),
      "API-Version": "2024-10",
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(`monday API error: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}

export async function createItem(
  boardId: string,
  groupId: string,
  itemName: string,
  columnValues: Record<string, any>
): Promise<string> {
  const query = `
    mutation createItem($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId
        group_id: $groupId
        item_name: $itemName
        column_values: $columnValues
      ) {
        id
      }
    }
  `;
  const data = await mondayGraphQL<{ create_item: { id: string } }>(query, {
    boardId,
    groupId,
    itemName,
    columnValues: JSON.stringify(columnValues),
  });
  return data.create_item.id;
}

export async function uploadFileToColumn(
  itemId: string,
  columnId: string,
  file: Buffer,
  filename: string
): Promise<void> {
  const query = `
    mutation addFile($itemId: ID!, $columnId: String!, $file: File!) {
      add_file_to_column(item_id: $itemId, column_id: $columnId, file: $file) {
        id
      }
    }
  `;

  const form = new FormData();
  form.append("query", query);
  form.append("variables[itemId]", itemId);
  form.append("variables[columnId]", columnId);
  form.append(
    "map",
    JSON.stringify({ file: "variables.file" })
  );
  form.append("file", new Blob([new Uint8Array(file)]), filename);

  const res = await fetch(MONDAY_FILE_URL, {
    method: "POST",
    headers: { Authorization: getToken() },
    body: form,
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(`monday file upload error: ${JSON.stringify(json.errors)}`);
  }
}
