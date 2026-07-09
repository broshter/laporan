/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Download,
  RefreshCw,
  Plus,
  Trash2,
  Printer,
  FileSpreadsheet,
  Users,
  Award,
  BookOpen,
  Calendar,
  Layers,
  HelpCircle,
  FileText,
  ExternalLink,
  X
} from "lucide-react";
import { IncomeRow, ExpenseRow } from "./types";
import ExcelPasteModal from "./components/ExcelPasteModal";
import ReportCharts from "./components/ReportCharts";
import AiAnalysisPanel from "./components/AiAnalysisPanel";

// Presets matching the original user code
const INITIAL_INCOMES: IncomeRow[] = [
  { kategori: "Zona", uraian: "Zona 1 (Nguter, Weru, Bulu, Tawangsari)", totalCawa: 58, hargaSatuan: 120000, cawaDispensasi: 0 },
  { kategori: "Zona", uraian: "Zona 2 (Bendosari, Mojolaban, Polokarto, Sukoharjo, Yonif 413)", totalCawa: 71, hargaSatuan: 120000, cawaDispensasi: 0 },
  { kategori: "Zona", uraian: "Zona 3 (Grogol, Gatak, Kartasura, Baki, UIN)", totalCawa: 54, hargaSatuan: 120000, cawaDispensasi: 0 },
];

const INITIAL_EXPENSES: ExpenseRow[] = [
  { kategori: "Subsidi", uraian: "Subsidi Zona 1", tanggal: "2 Juni 2026", qty: 58, hargaSatuan: 55000 },
  { kategori: "Subsidi", uraian: "Subsidi Zona 2", tanggal: "4 Juni 2026", qty: 71, hargaSatuan: 55000 },
  { kategori: "Subsidi", uraian: "Subsidi Zona 3", tanggal: "6 Juni 2026", qty: 54, hargaSatuan: 55000 },
  { kategori: "Administrasi", uraian: "Id Card Calon Warga", tanggal: "2 Juni 2026", qty: 189, hargaSatuan: 5000 },
  { kategori: "Administrasi", uraian: "Id Card Pendamping", tanggal: "2 Juni 2026", qty: 60, hargaSatuan: 5000 },
  { kategori: "Administrasi", uraian: "Map Dokument (KTA, Piagam, Sumpah & Wasiat)", tanggal: "4 Juni 2026", qty: 189, hargaSatuan: 30000 },
  { kategori: "Operasional", uraian: "Ganti Rugi Ranting Weru", tanggal: "30 Mei 2026", qty: 1, hargaSatuan: 2500000 },
  { kategori: "Operasional", uraian: "Akomodasi Pengurus Cabang Ke Zona 1, 2 Dan 3", tanggal: "1 Juni 2026", qty: 1, hargaSatuan: 500000 },
];

export default function App() {
  // Metadata States
  const [reportTitle, setReportTitle] = useState("Laporan_Keuangan_SURAN");
  const [branchName, setBranchName] = useState("CABANG SUKOHARJO");
  const [eventName, setEventName] = useState("PEMBEKALAN & PENDADARAN");
  const [year, setYear] = useState("2026");

  // Table Data States
  const [incomes, setIncomes] = useState<IncomeRow[]>(INITIAL_INCOMES);
  const [expenses, setExpenses] = useState<ExpenseRow[]>(INITIAL_EXPENSES);

  // Modal States
  const [pasteModalType, setPasteModalType] = useState<"income" | "expense" | null>(null);

  // Feedback State
  const [statusMsg, setStatusMsg] = useState("Sistem siap menerima input.");
  const [downloading, setDownloading] = useState(false);

  // Print Preview & Iframe Detection States
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const [showIframeWarning, setShowIframeWarning] = useState(false);
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  // Currency utility
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const getIncomeAmt = (row: IncomeRow) => {
    const total = Number(row.totalCawa) || 0;
    const price = Number(row.hargaSatuan) || 0;
    const disp = Number(row.cawaDispensasi) || 0;
    // Formula: (totalCawa - dispensasi) * hargaSatuan + dispensasi * (hargaSatuan * 0.5)
    return (total - disp) * price + disp * (price * 0.5);
  };

  const getExpenseAmt = (row: ExpenseRow) => {
    return (Number(row.qty) || 0) * (Number(row.hargaSatuan) || 0);
  };

  const totalIncome = incomes.reduce((sum, r) => sum + getIncomeAmt(r), 0);
  const totalExpense = expenses.reduce((sum, r) => sum + getExpenseAmt(r), 0);
  const balance = totalIncome - totalExpense;

  // Handlers for Incomes
  const handleIncomeFieldChange = (idx: number, field: keyof IncomeRow, value: any) => {
    const updated = [...incomes];
    if (field === "totalCawa" || field === "hargaSatuan" || field === "cawaDispensasi") {
      updated[idx][field] = Number(value) || 0;
    } else {
      updated[idx][field] = value as string;
    }
    setIncomes(updated);
  };

  const addIncomeRow = () => {
    setIncomes([...incomes, { kategori: "", uraian: "", totalCawa: 0, hargaSatuan: 0, cawaDispensasi: 0 }]);
    setStatusMsg("Baris pemasukan baru ditambahkan.");
  };

  const deleteIncomeRow = (idx: number) => {
    const updated = incomes.filter((_, i) => i !== idx);
    setIncomes(updated);
    setStatusMsg("Baris pemasukan berhasil dihapus.");
  };

  // Handlers for Expenses
  const handleExpenseFieldChange = (idx: number, field: keyof ExpenseRow, value: any) => {
    const updated = [...expenses];
    if (field === "qty" || field === "hargaSatuan") {
      updated[idx][field] = Number(value) || 0;
    } else {
      updated[idx][field] = value as string;
    }
    setExpenses(updated);
  };

  const addExpenseRow = () => {
    setExpenses([...expenses, { kategori: "", uraian: "", tanggal: "", qty: 0, hargaSatuan: 0 }]);
    setStatusMsg("Baris pengeluaran baru ditambahkan.");
  };

  const deleteExpenseRow = (idx: number) => {
    const updated = expenses.filter((_, i) => i !== idx);
    setExpenses(updated);
    setStatusMsg("Baris pengeluaran berhasil dihapus.");
  };

  // Impor handler from modal
  const handleImportApply = (parsedData: any[], mode: "replace" | "append") => {
    if (pasteModalType === "income") {
      setIncomes(mode === "replace" ? parsedData : [...incomes, ...parsedData]);
      setStatusMsg(`Berhasil mengimpor ${parsedData.length} baris pemasukan.`);
    } else {
      setExpenses(mode === "replace" ? parsedData : [...expenses, ...parsedData]);
      setStatusMsg(`Berhasil mengimpor ${parsedData.length} baris pengeluaran.`);
    }
  };

  // Separate reset functions
  const handleResetIncomes = () => {
    setIncomes([{ kategori: "Zona", uraian: "", totalCawa: 0, hargaSatuan: 120000, cawaDispensasi: 0 }]);
    setStatusMsg("Tabel pemasukan berhasil dikosongkan.");
  };

  const handleResetExpenses = () => {
    setExpenses([{ kategori: "Subsidi", uraian: "", tanggal: "", qty: 0, hargaSatuan: 0 }]);
    setStatusMsg("Tabel pengeluaran berhasil dikosongkan.");
  };

  // Excel/Spreadsheet Clipboard Paste Parser for Incomes
  const handleIncomePaste = (e: React.ClipboardEvent<HTMLInputElement>, startIdx: number) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\t") && !text.includes("\n")) {
      return; // Fallback to normal behavior for single value copies
    }
    e.preventDefault();
    setStatusMsg("Mendeteksi paste data dari spreadsheet/Excel...");

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.split("\t").map((cell) => cell.trim()))
      .filter((cells) => cells.some(Boolean));

    const isHeaderRow = (cells: string[]) => {
      const joined = cells.join(" ").toLowerCase();
      return /uraian|tanggal|harga|total cawa|qty|cawa dispensasi|total|kategori|no/i.test(joined);
    };

    const parseNumber = (val: string) => {
      let normalized = String(val ?? "")
        .replace(/[^\d,.-]/g, "")
        .trim();
      const hasComma = normalized.includes(",");
      const hasDot = normalized.includes(".");
      if (hasComma && hasDot) {
        normalized = normalized.replace(/\./g, "").replace(",", ".");
      } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(normalized)) {
        normalized = normalized.replace(/\./g, "");
      } else if (hasComma && /^\d{1,3}(,\d{3})+$/.test(normalized)) {
        normalized = normalized.replace(/,/g, "");
      } else if (hasComma) {
        normalized = normalized.replace(",", ".");
      }
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const parsedRows: IncomeRow[] = [];
    const activeCategory = incomes[startIdx]?.kategori || "Zona";

    for (const cells of lines) {
      if (isHeaderRow(cells)) continue;
      if (cells.some((c) => /total|jumlah|sisa/i.test(c))) continue;

      const next = [...cells];
      // Skip row number if present
      if (next.length > 4 && /^\d+$/.test(next[0])) {
        next.shift();
      }

      let kategori = "";
      let uraian = "";
      let totalCawa = 0;
      let hargaSatuan = 120000;
      let cawaDispensasi = 0;

      if (next.length >= 4) {
        const thirdIsNumber = /^\d+$/.test(next[2].replace(/[^\d]/g, ""));
        if (thirdIsNumber) {
          kategori = next[0] || activeCategory;
          uraian = next[1];
          totalCawa = parseNumber(next[2]);
          hargaSatuan = parseNumber(next[3]);
          cawaDispensasi = parseNumber(next[4] || "0");
        } else {
          kategori = activeCategory;
          uraian = next[0];
          totalCawa = parseNumber(next[1]);
          hargaSatuan = parseNumber(next[2]);
          cawaDispensasi = parseNumber(next[3] || "0");
        }
      } else if (next.length === 3) {
        kategori = activeCategory;
        uraian = next[0];
        totalCawa = parseNumber(next[1]);
        hargaSatuan = parseNumber(next[2]);
      } else if (next.length === 2) {
        kategori = activeCategory;
        uraian = next[0];
        totalCawa = parseNumber(next[1]);
      } else {
        kategori = activeCategory;
        uraian = next[0] || "";
      }

      parsedRows.push({ kategori, uraian, totalCawa, hargaSatuan, cawaDispensasi });
    }

    if (parsedRows.length > 0) {
      const updated = [...incomes];
      for (let i = 0; i < parsedRows.length; i++) {
        const targetIdx = startIdx + i;
        if (targetIdx < updated.length) {
          updated[targetIdx] = parsedRows[i];
        } else {
          updated.push(parsedRows[i]);
        }
      }
      setIncomes(updated);
      setStatusMsg(`Berhasil menempelkan ${parsedRows.length} baris pemasukan secara otomatis.`);
    }
  };

  // Excel/Spreadsheet Clipboard Paste Parser for Expenses
  const handleExpensePaste = (e: React.ClipboardEvent<HTMLInputElement>, startIdx: number) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\t") && !text.includes("\n")) {
      return; // Fallback
    }
    e.preventDefault();
    setStatusMsg("Mendeteksi paste data dari spreadsheet/Excel...");

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.split("\t").map((cell) => cell.trim()))
      .filter((cells) => cells.some(Boolean));

    const isHeaderRow = (cells: string[]) => {
      const joined = cells.join(" ").toLowerCase();
      return /uraian|tanggal|harga|total cawa|qty|cawa dispensasi|total|kategori|no/i.test(joined);
    };

    const parseNumber = (val: string) => {
      let normalized = String(val ?? "")
        .replace(/[^\d,.-]/g, "")
        .trim();
      const hasComma = normalized.includes(",");
      const hasDot = normalized.includes(".");
      if (hasComma && hasDot) {
        normalized = normalized.replace(/\./g, "").replace(",", ".");
      } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(normalized)) {
        normalized = normalized.replace(/\./g, "");
      } else if (hasComma && /^\d{1,3}(,\d{3})+$/.test(normalized)) {
        normalized = normalized.replace(/,/g, "");
      } else if (hasComma) {
        normalized = normalized.replace(",", ".");
      }
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const parsedRows: ExpenseRow[] = [];
    const activeCategory = expenses[startIdx]?.kategori || "Subsidi";

    for (const cells of lines) {
      if (isHeaderRow(cells)) continue;
      if (cells.some((c) => /total|jumlah|sisa/i.test(c))) continue;

      const next = [...cells];
      if (next.length > 4 && /^\d+$/.test(next[0])) {
        next.shift();
      }

      let kategori = "";
      let uraian = "";
      let tanggal = "";
      let qty = 0;
      let hargaSatuan = 0;

      if (next.length >= 5) {
        const fourthIsNumber = /^\d+$/.test(next[3].replace(/[^\d]/g, ""));
        if (fourthIsNumber) {
          kategori = next[0] || activeCategory;
          uraian = next[1];
          tanggal = next[2];
          qty = parseNumber(next[3]);
          hargaSatuan = parseNumber(next[4]);
        } else {
          kategori = activeCategory;
          uraian = next[0];
          tanggal = next[1];
          qty = parseNumber(next[2]);
          hargaSatuan = parseNumber(next[3]);
        }
      } else if (next.length === 4) {
        kategori = activeCategory;
        uraian = next[0];
        tanggal = next[1];
        qty = parseNumber(next[2]);
        hargaSatuan = parseNumber(next[3]);
      } else if (next.length === 3) {
        kategori = activeCategory;
        uraian = next[0];
        qty = parseNumber(next[1]);
        hargaSatuan = parseNumber(next[2]);
      } else if (next.length === 2) {
        kategori = activeCategory;
        uraian = next[0];
        qty = parseNumber(next[1]);
      } else {
        kategori = activeCategory;
        uraian = next[0] || "";
      }

      parsedRows.push({ kategori, uraian, tanggal, qty, hargaSatuan });
    }

    if (parsedRows.length > 0) {
      const updated = [...expenses];
      for (let i = 0; i < parsedRows.length; i++) {
        const targetIdx = startIdx + i;
        if (targetIdx < updated.length) {
          updated[targetIdx] = parsedRows[i];
        } else {
          updated.push(parsedRows[i]);
        }
      }
      setExpenses(updated);
      setStatusMsg(`Berhasil menempelkan ${parsedRows.length} baris pengeluaran secara otomatis.`);
    }
  };

  // Reset function
  const handleReset = () => {
    handleResetIncomes();
    handleResetExpenses();
    setStatusMsg("Seluruh isi kedua tabel dibersihkan.");
  };

  // Template prefill
  const loadDefaultTemplate = () => {
    setIncomes(INITIAL_INCOMES);
    setExpenses(INITIAL_EXPENSES);
    setStatusMsg("Template standar SURAN Sukoharjo berhasil dimuat.");
  };

  // Download Workbook
  const downloadWorkbook = async () => {
    setDownloading(true);
    setStatusMsg("Sedang meramu file Excel...");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportTitle,
          branchName,
          eventName,
          year,
          incomes,
          expenses,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengunduh spreadsheet dari server.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? decodeURIComponent(match[1]) : `${reportTitle || "LaporanSURAN"}.xlsx`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatusMsg("Laporan Excel XLSX berhasil diunduh.");
    } catch (error: any) {
      console.error(error);
      setStatusMsg(error.message || "Gagal mengunduh file.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintClick = () => {
    if (isInIframe) {
      setShowIframeWarning(true);
    } else {
      setIsPrintPreview(true);
      setStatusMsg("Mempersiapkan pratinjau cetak resmi...");
    }
  };

  const renderLetterhead = () => {
    return (
      <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-5">
        {/* Left Logo (PSHT) */}
        <div className="w-[80px] h-[80px] flex items-center justify-center shrink-0">
          <img
            src="/logo_psht.png"
            alt="Logo PSHT"
            className="max-h-[80px] max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Central Official Address & Name */}
        <div className="flex-1 text-center px-4 space-y-0.5">
          <h2 className="text-[10px] font-bold tracking-wider text-slate-800 leading-tight">PANITIA PELAKSANA KEGIATAN SURAN</h2>
          <h1 className="text-sm font-black tracking-wide text-slate-900 leading-tight">PERSAUDARAAN SETIA HATI TERATE</h1>
          <h2 className="text-[10px] font-extrabold tracking-widest text-slate-800 leading-none">CABANG SUKOHARJO – PUSAT MADIUN</h2>
          <p className="text-[8px] text-slate-700 font-medium leading-normal uppercase">
            Badan Hukum Kemenkumham RI : IDM 000142231 dan IDM 000142233
          </p>
          <p className="text-[8px] text-slate-700 font-medium leading-none uppercase">
            Nomor AHU – 0001626.AH.01.07.Tahun 2022
          </p>
          <p className="text-[8px] text-slate-600 font-semibold leading-tight">
            Sekretariat: Temulus RT.004/RW.007 Ds. Pondok, Kec. Grogol, Kab. Sukoharjo, Jawa Tengah 57552
          </p>
          <p className="text-[7px] text-slate-500 font-mono tracking-wide leading-none">
            Telp: 0856 4767 8910 | Email: pshtcabangsukoharjo@gmail.com
          </p>
        </div>

        {/* Right Logo (IPSI) */}
        <div className="w-[80px] h-[80px] flex items-center justify-center shrink-0">
          <img
            src="/logo_ipsi.png"
            alt="Logo IPSI"
            className="max-h-[80px] max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    );
  };

  if (isPrintPreview) {
    const groupedIncomes = incomes.reduce((acc, row) => {
      const cat = (row.kategori || "Tanpa Kategori").trim();
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(row);
      return acc;
    }, {} as Record<string, typeof incomes>);

    const groupedExpenses = expenses.reduce((acc, row) => {
      const cat = (row.kategori || "Tanpa Kategori").trim();
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(row);
      return acc;
    }, {} as Record<string, typeof expenses>);

    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 p-4 md:p-8 font-sans flex flex-col items-center">
        {/* Floating Controls for Print Preview - Hidden during actual print */}
        <div className="no-print w-full max-w-4xl bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center mb-6 shadow-xl gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-300">Mode Pratinjau Laporan Cetak Resmi / PDF</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPrintPreview(false)}
              className="px-3.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-all border border-slate-700"
            >
              ← Kembali Edit Data
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg transition-all flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Sekarang / Simpan PDF
            </button>
          </div>
        </div>

        {/* Official Printed Paper */}
        <div className="w-full max-w-4xl bg-white text-black p-10 border border-slate-300 shadow-md flex flex-col" id="print-paper">
          {/* Header (Letterhead) */}
          {renderLetterhead()}

          {/* Subtitle / Metadata details under letterhead */}
          <div className="text-center mb-6 px-4">
            <h1 className="text-xs sm:text-sm font-black uppercase tracking-wide leading-relaxed border-b-2 border-black pb-1.5 inline-block">
              Laporan Pertanggungjawaban Realisasi {eventName} Pemasukan & Pengeluaran Dana {branchName} - {year}
            </h1>
          </div>

          {/* Section A: Pemasukan */}
          <div className="section-print-block space-y-4 mb-6">
            <h3 className="text-xs font-black uppercase border-b border-slate-900 pb-1">
              A. LAPORAN DAFTAR PEMASUKAN DANA CABANG {branchName.toUpperCase()}
            </h3>
            
            {(Object.entries(groupedIncomes) as [string, IncomeRow[]][]).map(([catName, items], catIdx) => {
              const catTotal = items.reduce((sum, r) => sum + getIncomeAmt(r), 0);
              return (
                <div key={catIdx} className="space-y-1 page-break-inside-avoid">
                  <div className="text-[9px] font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 border border-slate-800 border-b-0 inline-block uppercase">
                    Kategori: {catName}
                  </div>
                  <table className="w-full text-[10px] text-left border-collapse border border-slate-800">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-800 font-bold">
                        <th className="p-1.5 border-r border-slate-800 text-center w-10">NO</th>
                        <th className="p-1.5 border-r border-slate-800">URAIAN SUMBER PEMASUKAN</th>
                        <th className="p-1.5 border-r border-slate-800 text-right w-20">TOTAL CAWA</th>
                        <th className="p-1.5 border-r border-slate-800 text-right w-24">HARGA SATUAN</th>
                        <th className="p-1.5 border-r border-slate-800 text-right w-20">CAWA DISPENSASI</th>
                        <th className="p-1.5 text-right w-28">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-300">
                          <td className="p-1.5 border-r border-slate-800 text-center">{idx + 1}</td>
                          <td className="p-1.5 border-r border-slate-800 font-medium">{row.uraian || "-"}</td>
                          <td className="p-1.5 border-r border-slate-800 text-right font-mono">{row.totalCawa || 0}</td>
                          <td className="p-1.5 border-r border-slate-800 text-right font-mono">{formatRupiah(row.hargaSatuan || 0)}</td>
                          <td className="p-1.5 border-r border-slate-800 text-right font-mono">{row.cawaDispensasi || 0}</td>
                          <td className="p-1.5 text-right font-mono font-semibold">{formatRupiah(getIncomeAmt(row))}</td>
                        </tr>
                      ))}
                      {/* Subtotal for this category */}
                      <tr className="bg-slate-50 font-bold border-t border-slate-800">
                        <td colSpan={2} className="p-1.5 border-r border-slate-800 text-right uppercase text-[9px]">TOTAL {catName.toUpperCase()} :</td>
                        <td className="p-1.5 border-r border-slate-800 text-right font-mono">{items.reduce((sum, r) => sum + (Number(r.totalCawa) || 0), 0)}</td>
                        <td className="p-1.5 border-r border-slate-800"></td>
                        <td className="p-1.5 border-r border-slate-800 text-right font-mono">{items.reduce((sum, r) => sum + (Number(r.cawaDispensasi) || 0), 0)}</td>
                        <td className="p-1.5 text-right font-mono text-slate-900">{formatRupiah(catTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* Grand Total Pemasukan row */}
            <table className="w-full text-[10px] text-left border-collapse border border-slate-800 mt-2">
              <tbody>
                <tr className="bg-slate-100 font-black text-slate-900 border border-slate-800">
                  <td className="p-2 uppercase text-right">TOTAL PEMASUKAN :</td>
                  <td className="p-2 text-right font-mono text-emerald-800 w-32">{formatRupiah(totalIncome)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section B: Pengeluaran */}
          <div className="section-print-block space-y-4 mb-6">
            <h3 className="text-xs font-black uppercase border-b border-slate-900 pb-1">
              B. LAPORAN DAFTAR PENGELUARAN DANA CABANG {branchName.toUpperCase()}
            </h3>

            {(Object.entries(groupedExpenses) as [string, ExpenseRow[]][]).map(([catName, items], catIdx) => {
              const catTotal = items.reduce((sum, r) => sum + getExpenseAmt(r), 0);
              return (
                <div key={catIdx} className="space-y-1 page-break-inside-avoid">
                  <div className="text-[9px] font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 border border-slate-800 border-b-0 inline-block uppercase">
                    Kategori: {catName}
                  </div>
                  <table className="w-full text-[10px] text-left border-collapse border border-slate-800">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-800 font-bold">
                        <th className="p-1.5 border-r border-slate-800 text-center w-10">NO</th>
                        <th className="p-1.5 border-r border-slate-800">URAIAN BARANG / LAYANAN</th>
                        <th className="p-1.5 border-r border-slate-800 w-24">TANGGAL</th>
                        <th className="p-1.5 border-r border-slate-800 text-right w-16">QTY</th>
                        <th className="p-1.5 border-r border-slate-800 text-right w-24">HARGA SATUAN</th>
                        <th className="p-1.5 text-right w-28">TOTAL BIAYA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-300">
                          <td className="p-1.5 border-r border-slate-800 text-center">{idx + 1}</td>
                          <td className="p-1.5 border-r border-slate-800 font-medium">{row.uraian || "-"}</td>
                          <td className="p-1.5 border-r border-slate-800">{row.tanggal || "-"}</td>
                          <td className="p-1.5 border-r border-slate-800 text-right font-mono">{row.qty || 0}</td>
                          <td className="p-1.5 border-r border-slate-800 text-right font-mono">{formatRupiah(row.hargaSatuan || 0)}</td>
                          <td className="p-1.5 text-right font-mono font-semibold">{formatRupiah(getExpenseAmt(row))}</td>
                        </tr>
                      ))}
                      {/* Subtotal for this category */}
                      <tr className="bg-slate-50 font-bold border-t border-slate-800">
                        <td colSpan={5} className="p-1.5 border-r border-slate-800 text-right uppercase text-[9px]">TOTAL {catName.toUpperCase()} :</td>
                        <td className="p-1.5 text-right font-mono text-slate-900">{formatRupiah(catTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* Grand Total Pengeluaran row */}
            <table className="w-full text-[10px] text-left border-collapse border border-slate-800 mt-2">
              <tbody>
                <tr className="bg-slate-100 font-black text-slate-900 border border-slate-800">
                  <td className="p-2 uppercase text-right">TOTAL PENGELUARAN :</td>
                  <td className="p-2 text-right font-mono text-red-800 w-32">{formatRupiah(totalExpense)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section C: Rekapitulasi */}
          <div className="section-print-block space-y-2 mb-6">
            <h3 className="text-xs font-black uppercase border-b border-slate-900 pb-1">
              RINGKASAN NERACA SALDO AKHIR
            </h3>
            <table className="w-full text-[10px] border border-slate-800 border-collapse">
              <tbody>
                <tr className="border-b border-slate-800">
                  <td className="p-2 font-semibold">Total Dana Pemasukan</td>
                  <td className="p-2 text-right font-mono font-bold w-48">{formatRupiah(totalIncome)}</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="p-2 font-semibold">Total Dana Pengeluaran (Berdasarkan Rincian)</td>
                  <td className="p-2 text-right font-mono font-bold w-48 text-red-700">{formatRupiah(totalExpense)}</td>
                </tr>
                <tr className="bg-slate-50 font-black text-slate-900">
                  <td className="p-2 uppercase">SISA SALDO KAS CABANG</td>
                  <td className={`p-2 text-right font-mono text-xs w-48 ${balance >= 0 ? "text-emerald-800" : "text-red-800"}`}>
                    {formatRupiah(balance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="section-print-block grid grid-cols-2 text-center text-[10px] gap-12 font-bold pt-6 page-break-inside-avoid">
            <div className="space-y-12">
              <p>Mengetahui,</p>
              <p>Ketua Cabang / Panitia Pelaksana</p>
              <div className="w-40 mx-auto border-b border-slate-900 pt-8"></div>
            </div>
            <div className="space-y-12">
              <p>Disusun Oleh,</p>
              <p>Bendahara Cabang</p>
              <div className="w-40 mx-auto border-b border-slate-900 pt-8"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="no-print bg-slate-900 border-b border-slate-800 py-5 px-6 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              Bendahara Portal
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-slate-100 font-display flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
              Aplikasi Pembukuan Keuangan
            </h1>
            <p className="text-xs text-slate-400">
              Buat, edit, analisis secara instan, dan ekspor laporan dana kegiatan pertanggungjawaban ke format Excel standar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadDefaultTemplate}
              className="px-3.5 py-2 text-xs bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-medium rounded-lg transition-all border border-slate-700/80 flex items-center gap-1.5"
              title="Kembalikan data percontohan standar Sukoharjo"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Muat Contoh Data
            </button>
            <button
              onClick={handlePrintClick}
              className="px-3.5 py-2 text-xs bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-medium rounded-lg transition-all border border-slate-700/80 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak / Simpan PDF
            </button>
            <button
              disabled={downloading}
              onClick={downloadWorkbook}
              className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/20"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading ? "Mengunduh..." : "Unduh File Excel"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Print Only Header Letterhead (Kop Surat) */}
        <div className="hidden print:block text-black mb-6">
          {renderLetterhead()}
          <div className="text-center mb-4 px-4">
            <h1 className="text-xs sm:text-sm font-black uppercase tracking-wide leading-relaxed border-b-2 border-black pb-1.5 inline-block">
              Laporan Pertanggungjawaban Realisasi {eventName} Pemasukan & Pengeluaran Dana {branchName} - {year}
            </h1>
          </div>
        </div>

        {/* SECTION 1: Report Metadata Settings */}
        <section className="no-print bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
            <Layers className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Identitas Laporan</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-500" /> Nama Judul File
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="LaporanSURAN"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Award className="w-3 h-3 text-slate-500" /> ORGANISASI
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="PERSAUDARAAN SETIA HATI TERATE"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-slate-500" /> Nama Kegiatan / Event
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="PEMBEKALAN & PENDADARAN"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" /> Tahun Kegiatan
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: Visual Charts and Summary */}
        <section className="print:hidden">
          <ReportCharts incomes={incomes} expenses={expenses} />
        </section>

        {/* SECTION 3: Main Tables Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Tables Side (3/4 of screen) */}
          <div className="xl:col-span-3 space-y-6">
            {/* TABLE A: PEMASUKAN */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center">
                    A
                  </span>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-slate-200">Rincian Pemasukan Dana</h3>
                    <p className="text-[10px] text-slate-400 italic">Bisa langsung ditempel (Ctrl+V) dari tabel Excel di baris mana saja</p>
                  </div>
                </div>
                <div className="no-print flex items-center gap-2">
                  <button
                    onClick={handleResetIncomes}
                    className="px-3 py-1.5 text-xs bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-medium rounded-lg transition-all border border-rose-900/40 flex items-center gap-1"
                    title="Kosongkan data tabel pemasukan"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Kosongkan
                  </button>
                  <button
                    onClick={() => setPasteModalType("income")}
                    className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-all border border-slate-700/80 flex items-center gap-1"
                  >
                    Tempel dari Excel
                  </button>
                  <button
                    onClick={addIncomeRow}
                    className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris
                  </button>
                </div>
              </div>

              <div className="table-wrap">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-medium select-none">
                      <th className="p-3 text-center w-12">No</th>
                      <th className="p-3 w-1/5">Kategori</th>
                      <th className="p-3 w-1/3">Uraian Sumber Pemasukan</th>
                      <th className="p-3 text-right w-24">Total Cawa</th>
                      <th className="p-3 text-right w-32">Harga Satuan</th>
                      <th className="p-3 text-right w-24 text-emerald-400">Dispensasi</th>
                      <th className="p-3 text-right w-36">Total</th>
                      <th className="no-print p-3 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomes.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-800/20 text-slate-300 transition-colors">
                        <td className="p-3 text-center text-slate-500 font-mono font-bold">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.kategori}
                            onChange={(e) => handleIncomeFieldChange(idx, "kategori", e.target.value)}
                            onPaste={(e) => handleIncomePaste(e, idx)}
                            placeholder="Kategori (cth: Zona)"
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-amber-500/50 p-1.5 rounded text-slate-200 outline-none text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.uraian}
                            onChange={(e) => handleIncomeFieldChange(idx, "uraian", e.target.value)}
                            onPaste={(e) => handleIncomePaste(e, idx)}
                            placeholder="Uraian"
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-amber-500/50 p-1.5 rounded text-slate-200 outline-none text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={row.totalCawa || ""}
                            onChange={(e) => handleIncomeFieldChange(idx, "totalCawa", e.target.value)}
                            onPaste={(e) => handleIncomePaste(e, idx)}
                            placeholder="0"
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-amber-500/50 p-1.5 rounded text-slate-200 text-right outline-none text-xs font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={row.hargaSatuan || ""}
                            onChange={(e) => handleIncomeFieldChange(idx, "hargaSatuan", e.target.value)}
                            onPaste={(e) => handleIncomePaste(e, idx)}
                            placeholder="0"
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-amber-500/50 p-1.5 rounded text-slate-200 text-right outline-none text-xs font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={row.cawaDispensasi || ""}
                            onChange={(e) => handleIncomeFieldChange(idx, "cawaDispensasi", e.target.value)}
                            onPaste={(e) => handleIncomePaste(e, idx)}
                            placeholder="0"
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-amber-500/50 p-1.5 rounded text-emerald-400 text-right outline-none text-xs font-mono"
                          />
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-100">
                          {formatRupiah(getIncomeAmt(row))}
                        </td>
                        <td className="no-print p-2 text-center">
                          <button
                            onClick={() => deleteIncomeRow(idx)}
                            disabled={incomes.length <= 1}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors disabled:opacity-30 disabled:hover:text-slate-500"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Income Total Row */}
                    <tr className="bg-slate-950/50 border-t border-slate-700/80">
                      <td colSpan={3} className="p-4 text-xs font-bold text-slate-400 text-right">
                        SUBTOTAL PEMASUKAN :
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-400">
                        {incomes.reduce((sum, r) => sum + (Number(r.totalCawa) || 0), 0)} Cawa
                      </td>
                      <td className="p-4"></td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-500">
                        {incomes.reduce((sum, r) => sum + (Number(r.cawaDispensasi) || 0), 0)} Disp
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-400 text-sm">
                        {formatRupiah(totalIncome)}
                      </td>
                      <td className="no-print"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABLE B: PENGELUARAN */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold font-mono text-xs flex items-center justify-center">
                    B
                  </span>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-slate-200">Rincian Pengeluaran Dana</h3>
                    <p className="text-[10px] text-slate-400 italic">Bisa langsung ditempel (Ctrl+V) dari tabel Excel di baris mana saja</p>
                  </div>
                </div>
                <div className="no-print flex items-center gap-2">
                  <button
                    onClick={handleResetExpenses}
                    className="px-3 py-1.5 text-xs bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-medium rounded-lg transition-all border border-rose-900/40 flex items-center gap-1"
                    title="Kosongkan data tabel pengeluaran"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Kosongkan
                  </button>
                  <button
                    onClick={() => setPasteModalType("expense")}
                    className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-all border border-slate-700/80 flex items-center gap-1"
                  >
                    Tempel dari Excel
                  </button>
                  <button
                    onClick={addExpenseRow}
                    className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris
                  </button>
                </div>
              </div>

              <div className="table-wrap">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-medium select-none">
                      <th className="p-3 text-center w-12">No</th>
                      <th className="p-3 w-1/5">Kategori</th>
                      <th className="p-3 w-1/3">Uraian Barang / Layanan</th>
                      <th className="p-3 w-28">Tanggal</th>
                      <th className="p-3 text-right w-20">Qty</th>
                      <th className="p-3 text-right w-32">Harga Satuan</th>
                      <th className="p-3 text-right w-36">Total</th>
                      <th className="no-print p-3 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-800/20 text-slate-300 transition-colors">
                        <td className="p-3 text-center text-slate-500 font-mono font-bold">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.kategori}
                            onChange={(e) => handleExpenseFieldChange(idx, "kategori", e.target.value)}
                            onPaste={(e) => handleExpensePaste(e, idx)}
                            placeholder="Kategori (cth: Subsidi)"
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-amber-500/50 p-1.5 rounded text-slate-200 outline-none text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.uraian}
                            onChange={(e) => handleExpenseFieldChange(idx, "uraian", e.target.value)}
                            onPaste={(e) => handleExpensePaste(e, idx)}
                            placeholder="Uraian"
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-amber-500/50 p-1.5 rounded text-slate-200 outline-none text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.tanggal}
                            onChange={(e) => handleExpenseFieldChange(idx, "tanggal", e.target.value)}
                            onPaste={(e) => handleExpensePaste(e, idx)}
                            placeholder="cth: 2 Juni"
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-amber-500/50 p-1.5 rounded text-slate-200 outline-none text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={row.qty || ""}
                            onChange={(e) => handleExpenseFieldChange(idx, "qty", e.target.value)}
                            onPaste={(e) => handleExpensePaste(e, idx)}
                            placeholder="0"
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-amber-500/50 p-1.5 rounded text-slate-200 text-right outline-none text-xs font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={row.hargaSatuan || ""}
                            onChange={(e) => handleExpenseFieldChange(idx, "hargaSatuan", e.target.value)}
                            onPaste={(e) => handleExpensePaste(e, idx)}
                            placeholder="0"
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-amber-500/50 p-1.5 rounded text-slate-200 text-right outline-none text-xs font-mono"
                          />
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-100">
                          {formatRupiah(getExpenseAmt(row))}
                        </td>
                        <td className="no-print p-2 text-center">
                          <button
                            onClick={() => deleteExpenseRow(idx)}
                            disabled={expenses.length <= 1}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors disabled:opacity-30 disabled:hover:text-slate-500"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Expense Total Row */}
                    <tr className="bg-slate-950/50 border-t border-slate-700/80">
                      <td colSpan={4} className="p-4 text-xs font-bold text-slate-400 text-right">
                        SUBTOTAL PENGELUARAN :
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-400">
                        {expenses.reduce((sum, r) => sum + (Number(r.qty) || 0), 0)} Qty
                      </td>
                      <td className="p-4"></td>
                      <td className="p-4 text-right font-mono font-bold text-red-400 text-sm">
                        {formatRupiah(totalExpense)}
                      </td>
                      <td className="no-print"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Signatures Block */}
            <div className="hidden print:grid grid-cols-2 mt-12 pt-8 text-black text-center text-xs gap-12 font-bold page-break-inside-avoid">
              <div className="space-y-16">
                <p>Mengetahui,</p>
                <p>Ketua Cabang / Panitia Pelaksana</p>
                <p className="border-t border-black/30 pt-1 w-48 mx-auto">___________________________</p>
              </div>
              <div className="space-y-16">
                <p>Disusun Oleh,</p>
                <p>Bendahara Cabang</p>
                <p className="border-t border-black/30 pt-1 w-48 mx-auto">___________________________</p>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar Ringkasan (1/4 of screen) */}
          <div className="no-print space-y-6">
            <aside className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5 sticky top-28">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800/80 flex items-center justify-between">
                <span>Ringkasan Saldo</span>
                <HelpCircle className="w-4 h-4 text-slate-500 cursor-help" title="Sisa saldo = Total Pemasukan - Total Pengeluaran" />
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Pemasukan</span>
                  <span className="font-mono font-bold text-emerald-400">{formatRupiah(totalIncome)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Pengeluaran</span>
                  <span className="font-mono font-bold text-red-400">{formatRupiah(totalExpense)}</span>
                </div>
                <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-1">
                  <span className="text-slate-400 text-xs font-semibold">Sisa Saldo Kas</span>
                  <span className={`text-xl font-bold font-mono ${balance >= 0 ? "text-amber-400" : "text-rose-400"}`}>
                    {formatRupiah(balance)}
                  </span>
                  <span className="text-[10px] text-slate-500 italic mt-0.5">
                    {balance >= 0 ? "*Surplus Keuangan" : "*Defisit Keuangan!"}
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-[11px] leading-relaxed">
                <span className="font-bold text-slate-400 block mb-0.5">Sistem Log:</span>
                <p className="text-amber-500 font-mono italic">{statusMsg}</p>
              </div>

              {/* Reset Action */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Aksi Pembersihan</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleResetIncomes}
                    className="py-2 px-1 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/40 hover:border-rose-800 text-rose-300 text-[10px] font-bold rounded-lg transition-all text-center leading-none"
                    title="Kosongkan seluruh data tabel pemasukan"
                  >
                    Kosongkan Pemasukan
                  </button>
                  <button
                    onClick={handleResetExpenses}
                    className="py-2 px-1 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/40 hover:border-rose-800 text-rose-300 text-[10px] font-bold rounded-lg transition-all text-center leading-none"
                    title="Kosongkan seluruh data tabel pengeluaran"
                  >
                    Kosongkan Pengeluaran
                  </button>
                </div>
                <button
                  onClick={handleReset}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold rounded-lg transition-all text-center uppercase tracking-wider"
                  title="Kosongkan seluruh data kedua tabel sekaligus"
                >
                  Kosongkan Semua Tabel
                </button>
              </div>
            </aside>
          </div>
        </div>

        {/* SECTION 4: AI Gemini Analyst Panel (Full width at bottom) */}
        <section className="no-print">
          <AiAnalysisPanel
            reportTitle={reportTitle}
            branchName={branchName}
            eventName={eventName}
            year={year}
            incomes={incomes}
            expenses={expenses}
          />
        </section>
      </main>

      {/* Copy-paste Modals */}
      <ExcelPasteModal
        isOpen={pasteModalType !== null}
        onClose={() => setPasteModalType(null)}
        onApply={handleImportApply}
        type={pasteModalType || "income"}
      />

      {/* Iframe warning modal */}
      {showIframeWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-slate-100">
            <button
              onClick={() => setShowIframeWarning(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <Printer className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-100">Cetak Laporan Cabang</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fitur cetak langsung dibatasi karena aplikasi dijalankan di dalam bingkai pratinjau (iframe). Untuk hasil cetak dan PDF yang lancar, silakan buka aplikasi di tab mandiri.
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  window.open(window.location.href, "_blank");
                  setShowIframeWarning(false);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
              >
                <ExternalLink className="w-4 h-4" /> Buka di Tab Baru
              </button>
              <button
                onClick={() => setShowIframeWarning(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition-all border border-slate-700"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
