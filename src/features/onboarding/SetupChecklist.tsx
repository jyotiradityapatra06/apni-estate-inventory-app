import { useState, useEffect } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { Business } from "../../context/AuthContext";

export interface SetupChecklistProps {
  business: Business | null;
  inventoryCount: number;
  customerCount: number;
  godownCount: number;
  invoiceCount: number;
  paymentCount: number;
  recentSales?: any[];
}

export function SetupChecklist({
  business,
  inventoryCount,
  customerCount,
  godownCount,
  invoiceCount,
  paymentCount,
  recentSales = [],
}: SetupChecklistProps) {
  const getStorageKey = (bizId?: string) => (bizId ? `setup_dismissed_${bizId}` : null);

  const [setupDismissed, setSetupDismissed] = useState<boolean>(() => {
    const key = getStorageKey(business?.id);
    return key ? !!localStorage.getItem(key) : false;
  });

  useEffect(() => {
    const key = getStorageKey(business?.id);
    if (key) {
      setSetupDismissed(!!localStorage.getItem(key));
    }
  }, [business?.id]);

  const setupSteps = [
    {
      label: "Complete Business Profile",
      path: "/management",
      done: Boolean(business?.gstNumber || business?.phone || business?.address),
    },
    {
      label: "Add First Godown",
      path: "/godowns/new",
      done: godownCount > 0,
    },
    {
      label: "Add First Material",
      path: "/materials/new",
      done: inventoryCount > 0,
    },
    {
      label: "Add First Customer",
      path: "/customers/new",
      done: customerCount > 0,
    },
    {
      label: "Create First Invoice",
      path: "/invoices/new",
      done: invoiceCount > 0,
    },
    {
      label: "Record Payment",
      path: "/payments/new",
      done: paymentCount > 0,
    },
  ];

  const doneCount = setupSteps.filter((s) => s.done).length;
  const progressPercent = Math.round((doneCount / setupSteps.length) * 100);

  const dismissSetup = () => {
    const key = getStorageKey(business?.id);
    if (key) {
      localStorage.setItem(key, "true");
    }
    setSetupDismissed(true);
    toast.success("First-time setup guide dismissed");
  };

  if (setupDismissed || doneCount >= setupSteps.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-orange-200/80 bg-orange-50/20 dark:bg-orange-950/20 p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-foreground text-base sm:text-lg">
            Welcome to APNI ESTATE &mdash; Complete your business setup 🚀
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            Follow this step-by-step checklist to configure your construction material ERP.
          </p>
        </div>
        <button
          onClick={dismissSetup}
          className="text-muted-foreground hover:text-foreground text-xs font-semibold uppercase tracking-wider cursor-pointer"
        >
          Skip guide
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm font-medium text-muted-foreground">
          <span>
            Setup Progress ({doneCount} of {setupSteps.length} complete)
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 pt-2">
        {setupSteps.map((step, idx) => (
          <Link
            key={idx}
            to={step.path}
            className={`rounded-xl border p-3 block text-left text-xs sm:text-sm transition-colors ${
              step.done
                ? "bg-green-50/50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300 animate-fade-in"
                : "bg-card hover:bg-muted border-border text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between font-semibold">
              <span>
                {idx + 1}. {step.label}
              </span>
              <span
                className={
                  step.done
                    ? "text-green-600 dark:text-green-400 font-bold ml-1"
                    : "text-muted-foreground ml-1"
                }
              >
                {step.done ? "✓" : "○"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-normal">
              {step.done ? "Completed successfully" : "Click to set up"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default SetupChecklist;
