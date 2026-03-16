function titleCase(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeFieldName(value: string): string {
  const lowered = value.trim().toLowerCase();

  if (["class_of_business", "class of business", "class"].includes(lowered)) {
    return "Class";
  }
  if (["loss_history", "loss history"].includes(lowered)) {
    return "Loss history";
  }

  return titleCase(value);
}

function workbookRowsToSubmissionText(rows: unknown[][]): string {
  if (rows.length === 0) {
    throw new Error("The workbook is empty.");
  }

  const stringRows = rows.map((row) =>
    row.map((cell) => (cell == null ? "" : String(cell).trim()))
  );

  const [headerRow, ...dataRows] = stringRows;
  const normalizedHeader = headerRow.map((cell) => cell.toLowerCase());

  if (
    normalizedHeader.length >= 2 &&
    normalizedHeader[0] === "field" &&
    normalizedHeader[1] === "value"
  ) {
    return dataRows
      .filter((row) => row[0] && row[1])
      .map((row) => `${normalizeFieldName(row[0])}: ${row[1]}`)
      .join("\n");
  }

  if (dataRows.length === 0) {
    throw new Error("The workbook must include a data row.");
  }

  const firstRecord = dataRows[0];

  return headerRow
    .map((header, index) => {
      const value = firstRecord[index];
      return header && value ? `${normalizeFieldName(header)}: ${value}` : null;
    })
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export async function submissionTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new Error("The workbook does not contain a readable sheet.");
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      blankrows: false
    }) as unknown[][];

    return workbookRowsToSubmissionText(rows);
  }

  return file.text();
}
