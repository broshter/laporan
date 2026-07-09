/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp, AlertCircle, FileText, TrendingUp, Lightbulb } from "lucide-react";
import { IncomeRow, ExpenseRow, AiAnalysisResult } from "../types";
import { motion } from "motion/react";

interface AiAnalysisPanelProps {
  reportTitle: string;
  branchName: string;
  eventName: string;
  year: string;
  incomes: IncomeRow[];
  expenses: ExpenseRow[];
}

const ENCOURAGING_MESSAGES = [
  "Membaca seluruh baris pemasukan & dispensasi...",
  "Mengklasifikasikan pos pengeluaran Anda...",
  "Menganalisis efisiensi alokasi biaya...",
  "Merumuskan rekomendasi finansial taktis...",
  "Menyusun draf kata pengantar LPJ formal..."
];

export default function AiAnalysisPanel({ reportTitle, branchName, eventName, year, incomes, expenses }: AiAnalysisPanelProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);

  const startAnalysis = async () => {
    setLoading(true);
    setAnalysis(null);
    setError("");

    // Cycle messages
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx = (currentIdx + 1) % ENCOURAGING_MESSAGES.length;
      setMsgIdx(currentIdx);
    }, 2000);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportTitle,
          branchName,
          eventName,
          year,
          incomes,
          expenses
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil analisis keuangan dari server.");
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan sistem ketika melakukan analisis AI.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const copyLpjToClipboard = () => {
    if (!analysis?.lpjDraft) return;
    navigator.clipboard.writeText(analysis.lpjDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const renderRichText = (text: string) => {
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h5 key={idx} className="text-sm font-bold text-amber-400 mt-5 mb-2.5 uppercase tracking-wider flex items-center gap-2 first:mt-0">
            <span className="w-2 h-2 rounded bg-amber-500" />
            {line.replace("### ", "")}
          </h5>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <div key={idx} className="pl-4 py-1.5 flex items-start gap-2.5 text-slate-300 leading-relaxed text-xs">
            <span className="text-amber-500 shrink-0 mt-1.5">•</span>
            <span>{line.replace("- ", "")}</span>
          </div>
        );
      }
      
      // Inline bold formatting: **text**
      if (line.includes("**")) {
        const parts = line.split("**");
        return (
          <p key={idx} className="text-xs text-slate-300 leading-relaxed py-1">
            {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-amber-300 font-bold">{part}</strong> : part)}
          </p>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-300 leading-relaxed py-1 min-h-[1.25rem]">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Banner Header */}
      <div className="p-6 bg-gradient-to-r from-slate-800 via-indigo-950 to-slate-800 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">Panel Audit Finansial & LPJ Otomatis</h3>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Dukung akuntabilitas organisasi dengan asisten audit AI Gemini. Dapatkan evaluasi kelayakan per pos, taktik efisiensi anggaran, dan naskah pembuka LPJ resmi yang sesuai standar disiplin administrasi cabang Sukoharjo.
          </p>
        </div>
        <button
          disabled={loading || incomes.length === 0}
          onClick={startAnalysis}
          className="px-5 py-2.5 text-xs bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/30 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" /> Mengaudit Data...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" /> Mulai Audit Keuangan AI
            </>
          )}
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="p-6">
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-1">
              <h5 className="text-sm font-bold text-indigo-400">Merangkai Perspektif Tim Audit Keuangan...</h5>
              <p className="text-xs text-slate-400 font-mono italic animate-fade-in">
                &ldquo;{ENCOURAGING_MESSAGES[msgIdx]}&rdquo;
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-lg flex items-start gap-3 text-rose-200 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Gagal Melakukan Audit AI</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!loading && !analysis && !error && (
          <div className="py-10 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
            <Sparkles className="w-10 h-10 text-slate-700 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-400">Audit Belum Dimulai</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Klik tombol &ldquo;Mulai Audit Keuangan AI&rdquo; di atas untuk mengaktifkan opini auditor, kelayakan pos anggaran, draf LPJ formal, dan taktik efisiensi.
            </p>
          </div>
        )}

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 1. Executive Summary */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold text-slate-200">Ringkasan Eksekutif Hasil Audit</h4>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-5 border border-slate-800/80 rounded-lg whitespace-pre-line space-y-1">
                {renderRichText(analysis.executiveSummary)}
              </div>
            </div>

            {/* 2. Efficiency Analysis */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-200">Evaluasi Efisiensi & Kelayakan Biaya</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.efficiencyAnalysis.map((item, idx) => (
                  <div key={idx} className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-800 border border-slate-700 text-amber-400 uppercase tracking-wider rounded-md">
                        {item.category}
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {item.percentage}% dari Kas
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xs text-slate-400">Total Biaya:</span>
                      <span className="text-sm font-bold text-slate-200 font-mono">{formatRupiah(item.amount)}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed italic border-t border-slate-800/80 pt-2 mt-2">
                      {item.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Strategic Recommendations */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Lightbulb className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-200">Rekomendasi Taktis Penyelenggaraan Mendatang</h4>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start bg-slate-950/20 p-3.5 border border-slate-800/50 rounded-lg">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-mono font-bold text-xs text-indigo-400 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-slate-300 leading-relaxed">
                      {rec.includes("**") ? (
                        rec.split("**").map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-amber-400 font-bold">{part}</strong> : part)
                      ) : (
                        rec
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. LPJ Document Draft */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-sm font-bold text-slate-200">Draf Kata Pengantar LPJ Resmi</h4>
                </div>
                <button
                  onClick={copyLpjToClipboard}
                  className="px-3 py-1.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-all flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Berhasil Disalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Salin Teks LPJ
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-all max-h-[350px] overflow-y-auto">
                {analysis.lpjDraft}
              </div>
              <p className="text-[11px] text-slate-500 text-center italic">
                Draf ini dapat disalin secara langsung untuk dijadikan halaman pembuka proposal LPJ Keuangan cetak.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
