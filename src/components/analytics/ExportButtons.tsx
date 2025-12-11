"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ExportButtons({ targetId }: { targetId: string }) {
  async function exportPng() {
    const el = document.getElementById(targetId);
    if (!el) return;

    const canvas = await html2canvas(el);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${targetId}.png`;
    link.click();
  }

  async function exportPdf() {
    const el = document.getElementById(targetId);
    if (!el) return;

    const canvas = await html2canvas(el);
    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("landscape", "pt", [canvas.width, canvas.height]);
    pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${targetId}.pdf`);
  }

  return (
    <div className="flex gap-2">
      <button onClick={exportPng} className="rounded-md border px-3 py-1 text-sm">
        Export PNG
      </button>
      <button onClick={exportPdf} className="rounded-md border px-3 py-1 text-sm">
        Export PDF
      </button>
    </div>
  );
}
