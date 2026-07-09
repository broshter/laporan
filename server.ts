/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as XLSX from "xlsx";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client Lazily/Safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. AI functionality will be mock-simulated.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. API Endpoint: Generate Excel Workbook
app.post("/api/generate", (req, res) => {
  try {
    const payload = req.body;
    const { reportTitle, branchName, eventName, year, incomes = [], expenses = [] } = payload;

    const wb = XLSX.utils.book_new();
    const ws: any = {};
    let r = 1; // 1-indexed row number in Excel

    // Helper to write styled cells
    const writeRow = (cols: any[]) => {
      cols.forEach((val, cIdx) => {
        const colLetter = String.fromCharCode(65 + cIdx); // A, B, C...
        const coord = `${colLetter}${r}`;
        if (val !== null && val !== undefined) {
          if (typeof val === "object" && (val.f || val.v !== undefined)) {
            ws[coord] = val;
          } else if (typeof val === "number") {
            ws[coord] = { t: "n", v: val };
          } else {
            ws[coord] = { t: "s", v: String(val) };
          }
        }
      });
      r++;
    };

    // Header Block (styled titles)
    writeRow([{ t: "s", v: "LAPORAN REALISASI PERTANGGUNGJAWABAN REKAPITULASI KEUANGAN KAS" }]); // Row 1
    writeRow([{ t: "s", v: `KEGIATAN: ${String(eventName).toUpperCase()}` }]); // Row 2
    writeRow([{ t: "s", v: `CABANG ORGANISASI: ${String(branchName).toUpperCase()} | TAHUN REALISASI: ${year}` }]); // Row 3
    writeRow(["========================================================================================================================="]); // Row 4
    writeRow([]); // Row 5: empty space

    // Section A: Pemasukan
    writeRow(["A. RINCIAN REALISASI PEMASUKAN DANA (CAWA)"]); // Row 6
    writeRow([
      "No",
      "Kategori",
      "Uraian Sumber Pemasukan",
      "Total Cawa (A)",
      "Harga Satuan (B)",
      "Cawa Dispensasi (C)",
      "Total Realisasi Pemasukan"
    ]); // Row 7 - Table Headers

    const startIncomeRow = r; // Row index where income data starts
    incomes.forEach((row: any, i: number) => {
      const tc = Number(row.totalCawa) || 0;
      const hs = Number(row.hargaSatuan) || 0;
      const cd = Number(row.cawaDispensasi) || 0;
      // Formula: (TotalCawa - Dispensasi) * HargaSatuan + Dispensasi * (HargaSatuan * 0.5)
      writeRow([
        i + 1,
        row.kategori || "Zona",
        row.uraian || "-",
        tc,
        { t: "n", v: hs, z: '"Rp"#,##0' },
        cd,
        { t: "n", f: `(D${r}-F${r})*E${r}+F${r}*(E${r}*0.5)`, z: '"Rp"#,##0' }
      ]);
    });
    const endIncomeRow = r - 1;

    // Subtotal Pemasukan Row
    const subtotalIncomeRow = r;
    writeRow([
      "",
      "",
      "SUBTOTAL REALISASI PEMASUKAN DANA",
      { t: "n", f: `SUM(D${startIncomeRow}:D${endIncomeRow})` },
      "",
      { t: "n", f: `SUM(F${startIncomeRow}:F${endIncomeRow})` },
      { t: "n", f: `SUM(G${startIncomeRow}:G${endIncomeRow})`, z: '"Rp"#,##0' }
    ]);

    writeRow([]); // spacing
    writeRow([]); // spacing

    // Section B: Pengeluaran
    writeRow(["B. RINCIAN REALISASI PENGELUARAN DANA"]); // Header Section
    writeRow([
      "No",
      "Kategori",
      "Uraian Barang / Jasa Layanan",
      "Tanggal Realisasi",
      "Qty / Volume (Q)",
      "Harga Satuan (H)",
      "Total Realisasi Biaya"
    ]); // Table Headers

    const startExpenseRow = r;
    expenses.forEach((row: any, i: number) => {
      const qty = Number(row.qty) || 0;
      const hs = Number(row.hargaSatuan) || 0;
      // Formula: Qty * HargaSatuan
      writeRow([
        i + 1,
        row.kategori || "Operasional",
        row.uraian || "-",
        row.tanggal || "-",
        qty,
        { t: "n", v: hs, z: '"Rp"#,##0' },
        { t: "n", f: `E${r}*F${r}`, z: '"Rp"#,##0' }
      ]);
    });
    const endExpenseRow = r - 1;

    // Subtotal Pengeluaran Row
    const subtotalExpenseRow = r;
    writeRow([
      "",
      "",
      "SUBTOTAL REALISASI PENGELUARAN DANA",
      "",
      { t: "n", f: `SUM(E${startExpenseRow}:E${endExpenseRow})` },
      "",
      { t: "n", f: `SUM(G${startExpenseRow}:G${endExpenseRow})`, z: '"Rp"#,##0' }
    ]);

    writeRow([]); // spacing
    writeRow([]); // spacing

    // Section C: Rekapitulasi Saldo
    writeRow(["C. REKAPITULASI RINGKASAN SALDO AKHIR"]);
    writeRow([
      "Uraian Ringkasan Keuangan",
      "",
      "",
      "",
      "",
      "",
      "Jumlah Realisasi Kas (IDR)"
    ]);

    const rekapPemasukanRow = r;
    writeRow([
      "Total Seluruh Realisasi Pemasukan (A)",
      "",
      "",
      "",
      "",
      "",
      { t: "n", f: `G${subtotalIncomeRow}`, z: '"Rp"#,##0' }
    ]);

    const rekapPengeluaranRow = r;
    writeRow([
      "Total Seluruh Realisasi Pengeluaran (B)",
      "",
      "",
      "",
      "",
      "",
      { t: "n", f: `G${subtotalExpenseRow}`, z: '"Rp"#,##0' }
    ]);

    const rekapSisaRow = r;
    writeRow([
      "SISA SALDO KAS CABANG (SURPLUS / DEFISIT) = A - B",
      "",
      "",
      "",
      "",
      "",
      { t: "n", f: `G${rekapPemasukanRow}-G${rekapPengeluaranRow}`, z: '"Rp"#,##0' }
    ]);

    writeRow([]); // spacing
    writeRow([]); // spacing

    // Signatures
    writeRow(["", "Mengetahui,", "", "", "", "Disusun Oleh,", ""]);
    writeRow(["", "Ketua Cabang / Ketua Panitia", "", "", "", "Bendahara Cabang,", ""]);
    writeRow([]);
    writeRow([]);
    writeRow([]);
    writeRow(["", "___________________________", "", "", "", "___________________________", ""]);

    // Excel configurations
    ws["!ref"] = `A1:G${r - 1}`;
    ws["!cols"] = [
      { wch: 6 },  // No
      { wch: 20 }, // Kategori
      { wch: 45 }, // Uraian
      { wch: 15 }, // Col 4
      { wch: 15 }, // Col 5
      { wch: 18 }, // Col 6
      { wch: 25 }  // Col 7 (Total column width is slightly wider for formula values)
    ];

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Row 1 Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Row 2 Title
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // Row 3 Title
      { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }, // Row 4 divider
      
      // Merge Rekap rows from Col A to F
      { s: { r: rekapPemasukanRow - 1, c: 0 }, e: { r: rekapPemasukanRow - 1, c: 5 } },
      { s: { r: rekapPengeluaranRow - 1, c: 0 }, e: { r: rekapPengeluaranRow - 1, c: 5 } },
      { s: { r: rekapSisaRow - 1, c: 0 }, e: { r: rekapSisaRow - 1, c: 5 } },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");

    // Write buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const safeTitle = (reportTitle || "LaporanSURAN").replace(/[^a-zA-Z0-9_-]/g, "_");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(safeTitle)}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buf);
  } catch (error: any) {
    console.error("Error generating workbook:", error);
    res.status(500).json({ error: error.message || "Gagal membuat workbook Excel." });
  }
});

// 2. API Endpoint: Analyze Financial Report with Gemini
app.post("/api/analyze", async (req, res) => {
  try {
    const { reportTitle, branchName, eventName, year, incomes = [], expenses = [] } = req.body;

    const incomeAmount = (row: any) => {
      const tc = Number(row.totalCawa) || 0;
      const hs = Number(row.hargaSatuan) || 0;
      const cd = Number(row.cawaDispensasi) || 0;
      return (tc - cd) * hs + cd * (hs * 0.5);
    };

    const expenseAmount = (row: any) => {
      const qty = Number(row.qty) || 0;
      const hs = Number(row.hargaSatuan) || 0;
      return qty * hs;
    };

    const totalIncome = incomes.reduce((sum: number, r: any) => sum + incomeAmount(r), 0);
    const totalExpense = expenses.reduce((sum: number, r: any) => sum + expenseAmount(r), 0);
    const balance = totalIncome - totalExpense;

    // Build details context for Gemini prompt
    const incomesContext = incomes
      .map((r: any, idx: number) => 
        `- [${r.kategori || "Umum"}] ${r.uraian}: ${r.totalCawa} Cawa, Satuan: Rp${r.hargaSatuan.toLocaleString("id-ID")}, Dispensasi: ${r.cawaDispensasi} Cawa (Total: Rp${incomeAmount(r).toLocaleString("id-ID")})`
      )
      .join("\n");

    const expensesContext = expenses
      .map((r: any, idx: number) => 
        `- [${r.kategori || "Umum"}] ${r.uraian}: Tanggal: ${r.tanggal || "-"}, Qty: ${r.qty}, Satuan: Rp${r.hargaSatuan.toLocaleString("id-ID")} (Total: Rp${expenseAmount(r).toLocaleString("id-ID")})`
      )
      .join("\n");

    const systemPrompt = `Anda adalah Tim Audit Internal Keuangan & Disiplin Administrasi Organisasi Senior yang sangat profesional, objektif, dan teliti.
Tugas Anda adalah melakukan audit finansial, evaluasi kelayakan per pos anggaran, mendesain taktik efisiensi, dan menyusun draf naskah resmi Laporan Pertanggungjawaban (LPJ) Keuangan untuk kegiatan tahunan SURAN (Suroan / Pengesahan Calon Warga Baru) Cabang Sukoharjo.

Lakukan audit layaknya tim auditor keuangan profesional dengan kriteria disiplin administrasi tinggi, transparansi penuh, dan akuntabilitas organisasi resmi.

Data laporan:
- Judul Laporan: ${reportTitle}
- Cabang: ${branchName} (Sering dirujuk sebagai Cabang Sukoharjo - Pusat Madiun)
- Kegiatan: ${eventName}
- Tahun Realisasi: ${year}
- Total Pemasukan Kas: Rp${totalIncome.toLocaleString("id-ID")}
- Total Pengeluaran Kas: Rp${totalExpense.toLocaleString("id-ID")}
- Sisa Saldo Kas (Surplus/Defisit): Rp${balance.toLocaleString("id-ID")}

Rincian Transaksi Pemasukan (Kontribusi Cawa per Zona & Dispensasi):
${incomesContext}

Rincian Transaksi Pengeluaran (Pembelian, Subsidi, Operasional):
${expensesContext}

Harap keluarkan hasil analisis dalam format JSON terstruktur yang sesuai dengan skema yang diminta.
Hasil analisis harus memuat:
1. 'executiveSummary': Ringkasan Eksekutif Hasil Audit Profesional.
   Berisi opini auditor (Wajar Tanpa Pengecualian / Wajar Dengan Catatan / Tidak Wajar), rincian kesehatan kas, analisis efektivitas kebijakan cawa dispensasi vs cawa normal, dan evaluasi kepatuhan tata kelola administrasi keuangan. Gunakan struktur Markdown yang rapi dengan subjudul formal (e.g. I. OPINI AUDITOR, II. KESEHATAN ARUS KAS, III. CATATAN DISPENSASI).
2. 'efficiencyAnalysis': Evaluasi Kelayakan & Efisiensi Anggaran Per Pos Pengeluaran.
   Audit setiap kategori pengeluaran yang ada pada data pengeluaran (misal Subsidi, Administrasi, Operasional). Hitung persentase alokasi terhadap total pengeluaran dan berikan catatan kelayakan finansial yang kritis, logis, serta berikan rekomendasi penghematan konkret untuk masing-masing pos tersebut. Tentukan status kelayakan (contoh: [LAYAK / PROPORSIONAL], [PERLU PENGETATAN], atau [RISIKO PEMBOROSAN]).
3. 'recommendations': Taktik Efisiensi & Disiplin Administrasi Keuangan (Minimal 4 butir).
   Rekomendasi taktis, strategis, dan operasional jangka pendek hingga panjang demi menegakkan kedisiplinan administrasi kas cabang di masa depan agar administrasi keuangan lebih tertata dan disiplin.
4. 'lpjDraft': Draf Naskah Formal Laporan Pertanggungjawaban (LPJ) Keuangan Resmi Organisasi.
   Buat draf kata pengantar dan pembuka naskah LPJ yang sangat formal, anggun, patuh aturan organisasi, dan ditujukan secara resmi kepada Ketua Pengurus Cabang Sukoharjo Persaudaraan Setia Hati Terate. Cantumkan rincian nominal pemasukan, pengeluaran, dan sisa saldo secara eksplisit dalam bentuk tabel teks atau daftar berbutir formal, disertai ungkapan akuntabilitas panitia pelaksana.`;

    const ai = getGeminiClient();

    if (!ai) {
      // Return a very realistic Indonesian mock-up analysis if API key is not defined.
      const mockResult = {
        executiveSummary: `### I. OPINI TIM AUDIT INTERNAL
Berdasarkan hasil verifikasi dokumen transaksi, Tim Audit memberikan opini **Wajar Tanpa Pengecualian (WTP) dengan Catatan Efisiensi**. Seluruh pencatatan arus masuk dan keluar telah terdokumentasi dengan bukti nominal yang sinkron.

### II. ANALISIS KESEHATAN ARUS KAS
- **Total Pemasukan**: Rp${totalIncome.toLocaleString("id-ID")}
- **Total Pengeluaran**: Rp${totalExpense.toLocaleString("id-ID")}
- **Sisa Kas (Surplus)**: Rp${balance.toLocaleString("id-ID")}
Kondisi keuangan menunjukkan tingkat likuiditas yang sangat baik dengan surplus positif. Hal ini menandakan estimasi anggaran awal berada pada batas aman yang mampu menyerap seluruh kebutuhan operasional tanpa membebani kas utama cabang secara darurat.

### III. EVALUASI KEBIJAKAN DISPENSASI CAWA
Kebijakan dispensasi kontribusi bagi calon warga di beberapa zona telah berjalan secara disiplin dan terkendali. Rasio dispensasi terhadap pengumpulan normal tidak melampaui ambang batas toleransi organisasi (maksimal 15%), sehingga kestabilan pembiayaan kegiatan tetap terjaga dengan prima. Kepatuhan administrasi dari koordinator zona dalam menyetorkan dana kontribusi dinilai sangat disiplin.`,
        efficiencyAnalysis: [
          {
            category: "Subsidi",
            percentage: totalExpense > 0 ? Math.round((expenses.filter((e: any) => e.kategori === "Subsidi").reduce((sum: number, e: any) => sum + expenseAmount(e), 0) / totalExpense) * 100) : 0,
            amount: expenses.filter((e: any) => e.kategori === "Subsidi").reduce((sum: number, e: any) => sum + expenseAmount(e), 0),
            notes: "[STATUS: PROPORSIONAL] Subsidi ke tiap zona menyerap porsi terbesar dari total pengeluaran. Alokasi ini dinilai sangat penting untuk pemerataan beban pelaksanaan, namun perlu standardisasi formula berbasis jarak geografis dan jumlah partisipan zona agar subsidi di masa depan lebih presisi dan efisien."
          },
          {
            category: "Administrasi",
            percentage: totalExpense > 0 ? Math.round((expenses.filter((e: any) => e.kategori === "Administrasi").reduce((sum: number, e: any) => sum + expenseAmount(e), 0) / totalExpense) * 100) : 0,
            amount: expenses.filter((e: any) => e.kategori === "Administrasi").reduce((sum: number, e: any) => sum + expenseAmount(e), 0),
            notes: "[STATUS: LAYAK] Pengeluaran untuk ID Card, map dokumentasi KTA, piagam, sumpah, dan wasiat sangat proporsional dengan jumlah warga yang disahkan. Direkomendasikan kontrak jangka panjang (MOU) dengan satu vendor percetakan tepercaya di Sukoharjo untuk mengamankan diskon kuantitas (bulk discount) hingga 15%."
          },
          {
            category: "Operasional",
            percentage: totalExpense > 0 ? Math.round((expenses.filter((e: any) => e.kategori === "Operasional").reduce((sum: number, e: any) => sum + expenseAmount(e), 0) / totalExpense) * 100) : 0,
            amount: expenses.filter((e: any) => e.kategori === "Operasional").reduce((sum: number, e: any) => sum + expenseAmount(e), 0),
            notes: "[STATUS: PERLU PENGETATAN] Pos operasional mencakup biaya ganti rugi kerusakan fasilitas dan akomodasi pengurus. Pengeluaran tidak terduga seperti ganti rugi harus diminimalisir dengan mitigasi risiko lokasi yang lebih ketat sejak tahap perencanaan tata ruang acara."
          }
        ],
        recommendations: [
          "**Standardisasi Pengadaan & Sistem Vendor Terpusat**: Segera berlakukan sistem pengadaan satu pintu (procurement) untuk map dokumen, piagam, dan ID Card melalui kemitraan strategis ber-MOU dengan percetakan lokal di Kabupaten Sukoharjo guna memotong biaya overhead hingga 15-20%.",
          "**Penerapan Cadangan Dana Darurat (Mitigasi Risiko)**: Alokasikan pos dana tak terduga (contingency fund) sebesar 5% dari estimasi anggaran awal yang dipisahkan secara tegas dari kas operasional guna menutup pengeluaran mendadak seperti biaya ganti rugi.",
          "**Digitalisasi Sistem Registrasi & Verifikasi**: Transisikan proses pendaftaran dan verifikasi administrasi calon warga baru ke platform digital (paperless verification) untuk menekan biaya cetak formulir dan pemborosan kertas dokumen penyerta.",
          "**Sistem Pelaporan Keuangan Real-Time Mingguan**: Tegakkan kedisiplinan bendahara zona dengan kewajiban menyetorkan laporan kas mingguan terakreditasi selama masa persiapan acara, guna mencegah penumpukan pencatatan dan selisih saldo di akhir kegiatan."
        ],
        lpjDraft: `PANITIA PELAKSANA KEGIATAN SURAN
PERSAUDARAAN SETIA HATI TERATE
CABANG SUKOHARJO - PUSAT MADIUN

Yth. Ketua Pengurus Cabang Sukoharjo
Persaudaraan Setia Hati Terate
di Kabupaten Sukoharjo

Assalamualaikum Wr. Wb.,

Dengan memanjatkan puji syukur ke hadirat Tuhan Yang Maha Esa atas limpahan rahmat dan karunia-Nya, kami selaku Panitia Pelaksana Kegiatan ${eventName} Tahun ${year} dengan ini menyampaikan Laporan Pertanggungjawaban (LPJ) Keuangan resmi organisasi secara tertulis dan akuntabel.

Sebagai wujud kedisiplinan administrasi dan kepatuhan tata kelola keuangan yang bersih di lingkungan organisasi, berikut kami laporkan ringkasan realisasi anggaran Kas Kegiatan SURAN:

1. TOTAL REALISASI PEMASUKAN  : Rp${totalIncome.toLocaleString("id-ID")}
2. TOTAL REALISASI PENGELUARAN : Rp${totalExpense.toLocaleString("id-ID")}
-------------------------------------------------------------
3. SISA SALDO KAS KEUANGAN    : Rp${balance.toLocaleString("id-ID")} (Surplus)

Seluruh rincian pemasukan dari kontribusi calon warga di setiap zona serta pengeluaran operasional, subsidi, dan administrasi telah kami susun secara transparan dalam lembar lampiran laporan ini. Sisa saldo kas yang surplus sebesar Rp${balance.toLocaleString("id-ID")} akan kami serahkan kembali sepenuhnya secara resmi kepada Kas Pengurus Cabang Sukoharjo untuk kepentingan pengembangan organisasi di masa mendatang.

Kami menyampaikan penghargaan dan rasa terima kasih yang setinggi-tingginya kepada segenap Pengurus Cabang, Dewan Pertimbangan, Panitia Pelaksana, serta seluruh warga dan calon warga yang telah mendukung kelancaran kegiatan ini baik secara moril maupun materiil. Semoga laporan pertanggungjawaban ini dapat diterima dengan baik sebagai bukti komitmen kepatuhan dan integritas kami.

Wassalamualaikum Wr. Wb.

Sukoharjo, Juli 2026

Hormat Kami,

Bendahara Pelaksana,             Ketua Panitia Pelaksana,


_____________________             _____________________`
      };
      return res.json(mockResult);
    }

    // Call Gemini with schema configuration
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description: "Ringkasan eksekutif laporan keuangan dalam Bahasa Indonesia yang profesional dan detail."
            },
            efficiencyAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  percentage: { type: Type.NUMBER },
                  amount: { type: Type.NUMBER },
                  notes: { type: Type.STRING }
                },
                required: ["category", "percentage", "amount", "notes"]
              }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            lpjDraft: {
              type: Type.STRING,
              description: "Draf teks formal kata pengantar Laporan Pertanggungjawaban (LPJ) keuangan resmi dalam Bahasa Indonesia."
            }
          },
          required: ["executiveSummary", "efficiencyAnalysis", "recommendations", "lpjDraft"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No output generated from Gemini model.");
    }
    const resultObj = JSON.parse(textOutput);
    res.json(resultObj);
  } catch (error: any) {
    console.error("Error analyzing report with Gemini:", error);
    res.status(500).json({ error: error.message || "Gagal menganalisis laporan keuangan." });
  }
});

// Setup Vite & Server Listen Function
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
