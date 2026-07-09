/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarChart, Bar, Cell, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { IncomeRow, ExpenseRow } from "../types";
import { PieChart as PieIcon, BarChart2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface ReportChartsProps {
  incomes: IncomeRow[];
  expenses: ExpenseRow[];
}

export default function ReportCharts({ incomes, expenses }: ReportChartsProps) {
  // Compute amounts
  const getIncomeAmt = (row: IncomeRow) => {
    return (row.totalCawa - row.cawaDispensasi) * row.hargaSatuan + row.cawaDispensasi * (row.hargaSatuan * 0.5);
  };

  const getExpenseAmt = (row: ExpenseRow) => {
    return row.qty * row.hargaSatuan;
  };

  const totalIncome = incomes.reduce((sum, r) => sum + getIncomeAmt(r), 0);
  const totalExpense = expenses.reduce((sum, r) => sum + getExpenseAmt(r), 0);
  const netBalance = totalIncome - totalExpense;

  // 1. Data for Bar Chart (Income vs Expense)
  const summaryData = [
    { name: "Pemasukan", Jumlah: totalIncome, fill: "#10b981" },
    { name: "Pengeluaran", Jumlah: totalExpense, fill: "#ef4444" }
  ];

  // 2. Data for Category Expenses Donut Chart
  const categoryExpensesMap: { [key: string]: number } = {};
  expenses.forEach((exp) => {
    const cat = exp.kategori.trim() || "Umum";
    const amt = getExpenseAmt(exp);
    categoryExpensesMap[cat] = (categoryExpensesMap[cat] || 0) + amt;
  });

  const categoryPieData = Object.keys(categoryExpensesMap).map((key) => ({
    name: key,
    value: categoryExpensesMap[key],
  })).sort((a, b) => b.value - a.value);

  // Color palette for Pie chart
  const COLORS = ["#f59e0b", "#6366f1", "#06b6d4", "#ec4899", "#8b5cf6", "#14b8a6", "#3b82f6"];

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const isDataEmpty = totalIncome === 0 && totalExpense === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Stat cards */}
      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-md">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pemasukan</p>
            <h4 className="text-xl font-bold font-mono text-emerald-400 mt-1">{formatRupiah(totalIncome)}</h4>
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-md">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pengeluaran</p>
            <h4 className="text-xl font-bold font-mono text-red-400 mt-1">{formatRupiah(totalExpense)}</h4>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-md">
          <div className={`p-3 rounded-lg ${netBalance >= 0 ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"}`}>
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sisa Saldo Kas Cabang</p>
            <h4 className={`text-xl font-bold font-mono mt-1 ${netBalance >= 0 ? "text-amber-400" : "text-rose-400"}`}>
              {formatRupiah(netBalance)}
            </h4>
          </div>
        </div>
      </div>

      {isDataEmpty ? (
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-slate-800/50 rounded-full text-slate-500 mb-4">
            <BarChart2 className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-semibold text-slate-300">Belum Ada Data Keuangan</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Isi atau tempel data pemasukan dan pengeluaran pada tabel di bawah untuk melihat infografis keuangan otomatis.
          </p>
        </div>
      ) : (
        <>
          {/* Bar Chart Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[320px]">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-slate-400" />
              <h4 className="text-sm font-bold text-slate-300">Pemasukan vs Pengeluaran</h4>
            </div>
            <div className="flex-1 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" tickFormatter={(v) => `Rp${v / 1000000}jt`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }}
                    formatter={(val: number) => [formatRupiah(val), "Jumlah"]}
                  />
                  <Bar dataKey="Jumlah">
                    {summaryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart Categories */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[320px]">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="w-4 h-4 text-slate-400" />
              <h4 className="text-sm font-bold text-slate-300">Distribusi Alokasi Pengeluaran</h4>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 items-center gap-4 overflow-hidden">
              {categoryPieData.length === 0 ? (
                <div className="md:col-span-2 text-center text-slate-500 text-xs py-8">
                  Tidak ada pengeluaran yang dicatat.
                </div>
              ) : (
                <>
                  <div className="h-[220px] w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }}
                          formatter={(val: number) => [formatRupiah(val), "Biaya"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend of Categories */}
                  <div className="overflow-y-auto max-h-[220px] pr-2 space-y-2.5 text-xs text-slate-300">
                    {categoryPieData.map((entry, idx) => {
                      const percentage = totalExpense > 0 ? ((entry.value / totalExpense) * 100).toFixed(1) : "0";
                      return (
                        <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-950/30 border border-slate-800/40">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span className="truncate font-semibold text-slate-200">{entry.name}</span>
                          </div>
                          <div className="text-right flex-shrink-0 pl-3">
                            <span className="font-mono font-bold text-amber-500">{percentage}%</span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              {formatRupiah(entry.value)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
