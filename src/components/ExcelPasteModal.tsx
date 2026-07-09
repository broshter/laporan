/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Clipboard, Check, X, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface ExcelPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (parsedData: any[], mode: "replace" | "append") => void;
  type: "income" | "expense";
}

export default function ExcelPasteModal({ isOpen, onClose, onApply, type }: ExcelPasteModalProps) {
  const [pasteText, setPasteText] = useState("");
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [errorText, setErrorText] = useState("");

  const handleTextChange = (text: string) => {
    setPasteText(text);
    if (!text.trim()) {
      setPreviewRows([]);
      setErrorText("");
      return;
    }

    try {
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.split("\t").map((cell) => cell.trim()))
        .filter((cells) => cells.some(Boolean));

      if (lines.length === 0) {
        setPreviewRows([]);
        return;
      }

      // Check for headers and skip
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

      const parsed: any[] = [];
      let activeCategory = "";

      for (const cells of lines) {
        // Detect explicit Category marker e.g., "Kategori: Subsidi"
        const joinedLine = cells.join(" ");
        const catMatch = joinedLine.match(/^kategori\s*:?\s*(.+)$/i);
        if (catMatch) {
          activeCategory = catMatch[1].trim();
          continue;
        }

        if (isHeaderRow(cells)) continue;

        // Skip rows that look like summary totals
        const isTotalRow = cells.some((c) => /total|jumlah|sisa/i.test(c));
        if (isTotalRow) continue;

        if (type === "income") {
          // Expected income columns: [No (opt), Kategori (opt), Uraian, Total Cawa, Harga Satuan, Cawa Dispensasi]
          const next = [...cells];
          // Remove leading number column if it exists
          if (next.length > 4 && /^\d+$/.test(next[0])) next.shift();

          let kategori = "";
          let uraian = "";
          let totalCawa = 0;
          let hargaSatuan = 0;
          let cawaDispensasi = 0;

          if (next.length >= 4) {
            // Check if first is category or description
            const secondIsNumber = /^\d+$/.test(next[1].replace(/[^\d]/g, ""));
            if (secondIsNumber) {
              // Format: [Uraian, Total Cawa, Harga Satuan, Cawa Dispensasi]
              kategori = activeCategory;
              uraian = next[0];
              totalCawa = parseNumber(next[1]);
              hargaSatuan = parseNumber(next[2]);
              cawaDispensasi = parseNumber(next[3] || "0");
            } else {
              // Format: [Kategori, Uraian, Total Cawa, Harga Satuan, Cawa Dispensasi]
              kategori = next[0] || activeCategory;
              uraian = next[1];
              totalCawa = parseNumber(next[2]);
              hargaSatuan = parseNumber(next[3]);
              cawaDispensasi = parseNumber(next[4] || "0");
            }
          } else if (next.length === 3) {
            // [Uraian, Total Cawa, Harga Satuan]
            kategori = activeCategory;
            uraian = next[0];
            totalCawa = parseNumber(next[1]);
            hargaSatuan = parseNumber(next[2]);
          } else {
            continue;
          }

          parsed.push({ kategori, uraian, totalCawa, hargaSatuan, cawaDispensasi });
        } else {
          // Expected expense columns: [No (opt), Kategori (opt), Uraian, Tanggal, Qty, Harga Satuan]
          const next = [...cells];
          if (next.length > 4 && /^\d+$/.test(next[0])) next.shift();

          let kategori = "";
          let uraian = "";
          let tanggal = "";
          let qty = 0;
          let hargaSatuan = 0;

          if (next.length >= 5) {
            // Check if second cell is numeric or text (date)
            const thirdIsNumber = /^\d+$/.test(next[3].replace(/[^\d]/g, ""));
            if (thirdIsNumber) {
              // [Kategori, Uraian, Tanggal, Qty, Harga Satuan]
              kategori = next[0];
              uraian = next[1];
              tanggal = next[2];
              qty = parseNumber(next[3]);
              hargaSatuan = parseNumber(next[4]);
            } else {
              // [Uraian, Tanggal, Qty, Harga Satuan]
              kategori = activeCategory;
              uraian = next[0];
              tanggal = next[1];
              qty = parseNumber(next[2]);
              hargaSatuan = parseNumber(next[3]);
            }
          } else if (next.length === 4) {
            // [Uraian, Tanggal, Qty, Harga Satuan]
            kategori = activeCategory;
            uraian = next[0];
            tanggal = next[1];
            qty = parseNumber(next[2]);
            hargaSatuan = parseNumber(next[3]);
          } else if (next.length === 3) {
            // [Uraian, Qty, Harga Satuan]
            kategori = activeCategory;
            uraian = next[0];
            qty = parseNumber(next[1]);
            hargaSatuan = parseNumber(next[2]);
          } else {
            continue;
          }

          parsed.push({ kategori, uraian, tanggal, qty, hargaSatuan });
        }
      }

      if (parsed.length === 0) {
        setErrorText("Format data tidak dikenali. Pastikan Anda menyalin tabel Excel dengan benar.");
      } else {
        setErrorText("");
      }
      setPreviewRows(parsed);
    } catch (e) {
      setErrorText("Gagal membaca teks. Periksa apakah data disalin dari tabel dengan pembatas Tab.");
      setPreviewRows([]);
    }
  };

  const handleApply = (mode: "replace" | "append") => {
    if (previewRows.length === 0) return;
    onApply(previewRows, mode);
    setPasteText("");
    setPreviewRows([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Clipboard className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-slate-100">
              Tempel Data Excel - {type === "income" ? "Pemasukan" : "Pengeluaran"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">
              Salin/copy baris data dari Microsoft Excel atau Google Sheets, lalu tempelkan di bawah ini.
              Sistem akan memetakan kolom secara otomatis (Kategori, Uraian, Nilai Satuan, dll.).
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={
                type === "income"
                  // eslint-disable-next-line no-multi-str
                  ? "Kategori: Zona\nNO\tURAIAN SUMBER PEMASUKAN\tTOTAL CAWA\tHARGA SATUAN\tCAWA DISPENSASI\n1\tZona 1 (Nguter)\t58\t120000\t0"
                  // eslint-disable-next-line no-multi-str
                  : "Kategori: Subsidi\nNO\tURAIAN BARANG / LAYANAN\tTANGGAL\tQTY\tHARGA SATUAN\n1\tSubsidi Zona 1\t2 Juni 2026\t58\t55000"
              }
              className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 font-mono text-xs focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          {errorText && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg flex items-start gap-2.5 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorText}</span>
            </div>
          )}

          {previewRows.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                Pratinjau Hasil Impor ({previewRows.length} baris terdeteksi):
              </h4>
              <div className="border border-slate-800 rounded-lg overflow-x-auto max-h-48">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                      <th className="p-2 text-center w-10">No</th>
                      <th className="p-2">Kategori</th>
                      <th className="p-2">Uraian</th>
                      {type === "income" ? (
                        <>
                          <th className="p-2 text-right">Cawa</th>
                          <th className="p-2 text-right">Harga</th>
                          <th className="p-2 text-right font-mono text-emerald-500">Dispensasi</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2">Tanggal</th>
                          <th className="p-2 text-right">Qty</th>
                          <th className="p-2 text-right">Harga Satuan</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 text-slate-300">
                        <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                        <td className="p-2 text-amber-400 font-medium">{row.kategori || "-"}</td>
                        <td className="p-2 font-mono text-slate-200">{row.uraian}</td>
                        {type === "income" ? (
                          <>
                            <td className="p-2 text-right">{row.totalCawa}</td>
                            <td className="p-2 text-right">Rp{row.hargaSatuan.toLocaleString("id-ID")}</td>
                            <td className="p-2 text-right text-emerald-400 font-semibold">{row.cawaDispensasi}</td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 text-slate-400">{row.tanggal || "-"}</td>
                            <td className="p-2 text-right">{row.qty}</td>
                            <td className="p-2 text-right">Rp{row.hargaSatuan.toLocaleString("id-ID")}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all font-medium"
          >
            Batal
          </button>
          <button
            disabled={previewRows.length === 0}
            onClick={() => handleApply("append")}
            className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" /> Tambahkan ke Tabel
          </button>
          <button
            disabled={previewRows.length === 0}
            onClick={() => handleApply("replace")}
            className="px-4 py-2 text-xs bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg transition-all font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" /> Timpa & Ganti Isi Tabel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
