import * as XLSX from "xlsx";
import type { Transaction } from "@/types/finance";

const categoryKeywords: Record<string, string[]> = {
  "Sales - Shopify": ["shopify", "invoice", "payment received", "transfer in"],
  "Sales - PayPal": ["paypal"],
  "Sales - Stripe": ["stripe"],
  "Service - Operations": ["fast transfer from"],
  Payroll: ["payroll", "salary", "wages", "wage", "superannuation", "super"],
  Marketing: ["facebook", "google", "ads", "marketing", "advertising"],
  Operations: ["rent", "internet", "office", "supplies"],
  "Utility Bills": [
    "origin energy",
    "agl",
    "energy australia",
    "simply energy",
    "ergon",
    "energex",
    "ausgrid",
    "endeavour energy",
    "electricity",
    "utilities",
    "water",
    "sewerage",
  ],
  "Tax/Govt Charges": ["ato", "tax", "gst", "bpay"],
  Postage: [
    "australia post",
    "auspost",
    "post ",
    "courier",
    "fastway",
    "aramex",
    "sendle",
    "dhl",
    "fedex",
    "startrack",
  ],
};

export function categorizeTransaction(description: string): string {
  const lowerDesc = description.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword: string) => lowerDesc.includes(keyword))) {
      return category;
    }
  }

  return "Other";
}

export function parseCommBankCSV(csvText: string): Transaction[] {
  const lines = csvText.trim().split("\n");

  if (lines.length < 2) {
    throw new Error("CSV is empty or invalid");
  }

  // Skip header row
  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handle quoted fields)
    const fields = parseCSVLine(line);

    if (fields.length < 4) {
      console.warn(`Skipping invalid row ${i}: insufficient columns`);
      continue;
    }

    const [dateStr, amountStr, description, balanceStr] = fields;

    try {
      const date = parseDate(dateStr);
      const amount = parseFloat(amountStr);
      const balance = parseFloat(balanceStr);

      if (isNaN(amount) || isNaN(balance)) {
        console.warn(`Skipping row ${i}: invalid numeric values`);
        continue;
      }

      const type = amount >= 0 ? "income" : "expense";
      const category = categorizeTransaction(description);

      transactions.push({
        id: `txn-${i}-${Date.now()}`,
        date,
        description: description.trim(),
        amount: Math.abs(amount),
        balance,
        category,
        type,
      });
    } catch (error) {
      console.warn(`Skipping row ${i}: ${error}`);
    }
  }

  return transactions;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields.map((f) => f.replace(/^"|"$/g, "").trim());
}

function parseDate(dateInput: string | number): string {
  // Handle Excel serial date numbers
  if (typeof dateInput === "number" || !isNaN(Number(dateInput))) {
    const excelDate = Number(dateInput);
    if (excelDate > 0 && excelDate < 100000) {
      // Excel serial date (days since 1900-01-01)
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  const trimmed = String(dateInput).trim().replace(/^"|"$/g, "");

  // Try DD/MM/YYYY format
  const match1 = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match1) {
    const [, day, month, year] = match1;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Try DD Mon YYYY format
  const match2 = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (match2) {
    const [, day, monthStr, year] = match2;
    const months: Record<string, string> = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };
    const month = months[monthStr] || "01";
    return `${year}-${month}-${day.padStart(2, "0")}`;
  }

  throw new Error(`Could not parse date: ${dateInput}`);
}

export function parseExcelFile(arrayBuffer: ArrayBuffer): Transaction[] {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("No sheets found in Excel file");
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
  }) as unknown[][];

  if (rows.length < 1) {
    throw new Error("Excel file is empty or invalid");
  }

  const transactions: Transaction[] = [];

  // Check if first row is a header by seeing if first column is a date/number
  let startRow = 0;
  if (rows.length > 0 && rows[0]) {
    const firstVal = rows[0][0];
    // If first value looks like a string header (not a number/date), skip it
    if (typeof firstVal === "string" && isNaN(Number(firstVal))) {
      startRow = 1;
    }
  }

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];

    if (!row || row.length < 4) {
      console.warn(`Skipping invalid row ${i}: insufficient columns`);
      continue;
    }

    const [dateStr, amountStr, description, balanceStr] = row;

    try {
      const date = parseDate(dateStr as string | number);
      const amount = parseFloat(String(amountStr));
      const balance = parseFloat(String(balanceStr));

      if (isNaN(amount) || isNaN(balance)) {
        console.warn(`Skipping row ${i}: invalid numeric values`);
        continue;
      }

      const type = amount >= 0 ? "income" : "expense";
      const category = categorizeTransaction(String(description));

      transactions.push({
        id: `txn-${i}-${Date.now()}`,
        date,
        description: String(description).trim(),
        amount: Math.abs(amount),
        balance,
        category,
        type,
      });
    } catch (error) {
      console.warn(`Skipping row ${i}: ${error}`);
    }
  }

  return transactions;
}
