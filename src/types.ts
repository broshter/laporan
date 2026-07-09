/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IncomeRow {
  kategori: string;
  uraian: string;
  totalCawa: number;
  hargaSatuan: number;
  cawaDispensasi: number;
}

export interface ExpenseRow {
  kategori: string;
  uraian: string;
  tanggal: string;
  qty: number;
  hargaSatuan: number;
}

export interface ReportMetadata {
  reportTitle: string;
  branchName: string;
  eventName: string;
  year: string;
}

export interface ReportPayload extends ReportMetadata {
  incomes: IncomeRow[];
  expenses: ExpenseRow[];
}

export interface AiAnalysisResult {
  executiveSummary: string;
  efficiencyAnalysis: {
    category: string;
    percentage: number;
    amount: number;
    notes: string;
  }[];
  recommendations: string[];
  lpjDraft: string;
}
