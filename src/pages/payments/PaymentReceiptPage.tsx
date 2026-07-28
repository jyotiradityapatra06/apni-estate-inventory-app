import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { toast } from "sonner";
import paymentApi from "../../api/payment.api";
import { useAuth } from "../../hooks/useAuth";
import { Printer, ArrowLeft } from "lucide-react";
import { PaymentReceipt } from "../../features/payments/components/PaymentReceipt";

export default function PaymentReceiptPage() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { business } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentApi
      .getById(id)
      .then((r) => {
        setData(r.data);
        setLoading(false);
      })
      .catch((e: any) => {
        toast.error(e.message || "Failed to load payment receipt");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" role="status" aria-label="Loading payment receipt" />;
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
        <h2 className="text-lg font-bold">Payment Receipt Not Found</h2>
        <p className="mt-1 text-sm">The requested payment receipt could not be loaded.</p>
        <button onClick={() => nav("/payments")} className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white">
          Back to Payments
        </button>
      </div>
    );
  }

  const receipt = data.receipt || {};
  const biz = receipt.business || {
    name: business?.name || "APNI ESTATE ERP",
    address: business?.address,
    phone: business?.phone,
    gstNumber: business?.gstNumber,
  };
  const cust = receipt.customer || data.customer || {};
  const inv = receipt.invoice || data.invoice || {};
  const pymt = receipt.payment || {
    paymentNumber: data.paymentNumber,
    paymentDate: data.paymentDate,
    amount: Number(data.amount || 0),
    paymentMethod: data.paymentMethod,
    referenceNumber: data.referenceNumber,
    bankName: data.bankName,
    notes: data.notes,
    status: data.status,
    receivedBy: data.receivedBy,
  };

  const receiptData = {
    paymentNumber: pymt.paymentNumber,
    paymentDate: pymt.paymentDate,
    amount: pymt.amount,
    paymentMethod: pymt.paymentMethod,
    referenceNumber: pymt.referenceNumber,
    bankName: pymt.bankName,
    notes: pymt.notes,
    status: pymt.status,
    business: biz,
    customer: cust,
    invoice: inv,
    receivedBy: pymt.receivedBy,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Screen Navigation Controls (Hidden during print) */}
      <div className="flex items-center justify-between border-b border-border pb-4 print:hidden">
        <button
          onClick={() => nav("/payments")}
          className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Payments
        </button>

        <div className="flex gap-3">
          <Link
            to={`/payments/${id}`}
            className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
          >
            Payment Details
          </Link>
          <button
            onClick={handlePrint}
            className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-xs font-bold text-white hover:bg-orange-700 shadow-sm transition-colors cursor-pointer"
          >
            <Printer size={16} />
            Print Official Receipt (A4)
          </button>
        </div>
      </div>

      {/* Main Printable A4 Receipt Component */}
      <PaymentReceipt data={receiptData} />
    </div>
  );
}

