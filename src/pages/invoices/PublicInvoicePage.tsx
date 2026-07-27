import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Download, FileX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import invoiceApi from "../../api/invoice.api";
import { ProfessionalInvoice } from "../../features/invoices/components/ProfessionalInvoice";
import { generateInvoicePDF } from "../../utils/pdfGenerator";
import type { Invoice } from "../../features/invoices/invoice.types";

export default function PublicInvoicePage() {
  const { token = "" } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    invoiceApi
      .getPublicByToken(token)
      .then((res) => {
        if (res.data) {
          setInvoice(res.data);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleDownloadPDF = async () => {
    if (!invoice || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      await generateInvoicePDF(invoice);
      toast.success("Invoice PDF downloaded");
    } catch {
      toast.error("Unable to generate invoice PDF. Please try again.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="flex items-center gap-3 font-bold text-slate-600 text-sm">
          <Loader2 className="animate-spin text-orange-600" size={20} />
          <span>Loading Tax Invoice...</span>
        </div>
      </div>
    );
  }

  if (notFound || !invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="h-16 w-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <FileX size={32} />
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Invoice Not Found</h1>
        <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
          The requested invoice public token is invalid or has expired. Please verify the URL with the sender.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
      {/* Public Action Header */}
      <div className="mx-auto max-w-4xl mb-6 flex items-center justify-between gap-4 bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Public Invoice Viewer</span>
          <h2 className="text-sm font-black text-slate-900">{invoice.invoiceNumber}</h2>
        </div>
        <button
          disabled={generatingPdf}
          onClick={handleDownloadPDF}
          className="flex min-h-10 items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-xs font-black text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={14} className="mr-1.5" />
          {generatingPdf ? "Generating PDF..." : "Download PDF"}
        </button>
      </div>

      {/* Reused Professional Invoice Presentation Component */}
      <div className="mx-auto max-w-4xl">
        <ProfessionalInvoice invoice={invoice} />
      </div>
    </div>
  );
}
