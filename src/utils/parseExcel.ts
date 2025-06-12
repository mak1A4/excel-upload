import * as XLSX from 'xlsx';

/**
 * Parses an Excel file and returns the workbook object for direct use with xlsx API.
 * @param file - The Excel file to parse
 * @returns The parsed workbook object
 */
export async function parseExcel(file: File): Promise<XLSX.WorkBook> {
  // Read the file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Parse the workbook
  return XLSX.read(arrayBuffer, { type: 'array' });
}