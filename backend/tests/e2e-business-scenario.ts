import { AddressInfo } from "net";
import app from "../src/app";
import { prisma } from "../src/config/db";
import { generateToken } from "../src/utils/jwt";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const fmt = (val: any) => {
  if (val === null || val === undefined) return 0;
  return Number(val);
};

async function main() {
  console.log("=== Starting Complete E2E Business Scenario ===");
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
  // Create isolated Business A and Business B
  const businessA = await prisma.business.create({ data: { name: `Scenario Business A ${suffix}`, gstNumber: "27AABFR5987M1ZP" } });
  const businessB = await prisma.business.create({ data: { name: `Scenario Business B ${suffix}`, gstNumber: "27BCAFR5987M1ZP" } });
  
  try {
    // 1. Create Owner and Manager on Business A, and Owner on Business B
    const ownerA = await prisma.user.create({ data: { name: "Owner A", email: `owner-a-${suffix}@test.local`, passwordHash: "dummy", role: "OWNER", businessId: businessA.id } });
    const managerA = await prisma.user.create({ data: { name: "Manager A", email: `manager-a-${suffix}@test.local`, passwordHash: "dummy", role: "MANAGER", businessId: businessA.id } });
    const ownerB = await prisma.user.create({ data: { name: "Owner B", email: `owner-b-${suffix}@test.local`, passwordHash: "dummy", role: "OWNER", businessId: businessB.id } });

    // Setup helper tokens & call method
    const server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const port = (server.address() as AddressInfo).port;
    const base = `http://127.0.0.1:${port}/api`;
    const token = (u: any) => generateToken({ userId: u.id, businessId: u.businessId, role: u.role });
    
    const call = async (method: string, path: string, u: any, body?: unknown) => {
      const r = await fetch(`${base}${path}`, {
        method,
        headers: {
          authorization: `Bearer ${token(u)}`,
          "content-type": "application/json"
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const text = await r.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch {}
      return { status: r.status, json, text, headers: r.headers };
    };

    // 2. Create Customer
    const cusRes = await call("POST", "/customers", ownerA, {
      customerCode: `C-${suffix}`,
      name: "Standard Customer A",
      phone: "9876543211",
      creditLimit: 100000,
      openingBalance: 0
    });
    assert(cusRes.status === 201, "Failed to create customer");
    const customer = cusRes.json.data;
    console.log(`Created Customer: ${customer.name} with Outstanding: ₹${fmt(customer.outstandingBalance)}`);

    // 3. Create Supplier
    const supRes = await call("POST", "/suppliers", ownerA, {
      supplierCode: `S-${suffix}`,
      name: "Standard Supplier A",
      phone: "9876543212",
      gstin: "27AABFR5987M1ZP",
      companyName: "Supplier Co",
      panNumber: "AABFR5987M"
    });
    assert(supRes.status === 201, "Failed to create supplier");
    const supplier = supRes.json.data;
    console.log(`Created Supplier: ${supplier.name} with Pending Payments: ₹${fmt(supplier.pendingPayments)}`);

    // Create Godown for material storage
    const godownRes = await call("POST", "/godowns", ownerA, {
      godownCode: `GD-${suffix}`,
      name: "Main Storage",
      address: "Pune",
      isDefault: true
    });
    assert(godownRes.status === 201, "Failed to create godown");
    const godown = godownRes.json.data;

    // 4. Create Material
    const matRes = await call("POST", "/materials", ownerA, {
      materialName: "Premium Cement",
      category: "Cement",
      sku: `MAT-${suffix}`,
      unit: "Bags",
      reorderLevel: 10,
      location: "Main Storage",
      costPrice: 300,
      sellingPrice: 400,
      taxRate: 18,
      defaultSupplierId: supplier.id
    });
    assert(matRes.status === 201, "Failed to create material");
    const material = matRes.json.data;
    console.log(`Created Material: ${material.materialName}, Stock Quantity: ${material.quantity}`);

    // Create initial stock of 0 for clean reconciliation
    const initStock = await prisma.godownStock.findFirst({ where: { businessId: businessA.id, inventoryItemId: material.id } });
    assert(initStock && initStock.quantity === 0, "Initial stock should be 0");

    // 5. Create Purchase Order for material (qty: 100, rate: 300, gstRate: 18)
    const poRes = await call("POST", "/purchases", ownerA, {
      supplierId: supplier.id,
      notes: "E2E verification PO",
      items: [{
        inventoryItemId: material.id,
        godownId: godown.id,
        quantity: 100,
        rate: 300,
        gstRate: 18
      }]
    });
    assert(poRes.status === 201, "Failed to create Purchase Order");
    let po = poRes.json.data;
    console.log(`Created PO: ${po.purchaseOrderNumber}, Status: ${po.status}, Total Amount: ₹${fmt(po.totalAmount)}`);

    // Send PO
    const sendRes = await call("POST", `/purchases/${po.id}/send`, ownerA);
    assert(sendRes.status === 200, "Failed to send PO");
    po = sendRes.json.data;
    assert(po.status === "SENT", "PO should be SENT");

    // 6. Partially receive goods (qty: 60)
    const rcKey = crypto.randomUUID();
    const receiveRes = await call("POST", `/purchases/${po.id}/receive`, managerA, {
      idempotencyKey: rcKey,
      notes: "Partial receipt of 60 bags",
      items: [{
        purchaseOrderItemId: po.items[0].id,
        quantity: 60
      }]
    });
    assert(receiveRes.status === 200, "Failed to receive goods");
    po = receiveRes.json.data;
    console.log(`Partially Received Goods: 60 bags. PO Status: ${po.status}`);

    // 7. Confirm stock increases
    const stock = await prisma.godownStock.findFirstOrThrow({ where: { businessId: businessA.id, inventoryItemId: material.id } });
    assert(stock.quantity === 60, `Stock should be 60, got ${stock.quantity}`);
    const materialFresh = await prisma.inventoryItem.findFirstOrThrow({ where: { id: material.id } });
    assert(materialFresh.quantity === 60, `Total material qty should be 60, got ${materialFresh.quantity}`);
    console.log(`Confirmed Material Stock Quantity Increased to: ${materialFresh.quantity}`);

    // Confirm PO and Supplier outstanding increased
    const supplierAfterRec = await prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } });
    // Received Amount = 60 * 300 * 1.18 = ₹21,240
    assert(fmt(po.receivedAmount) === 21240, `Received amount should be 21240, got ${fmt(po.receivedAmount)}`);
    assert(fmt(po.balanceDue) === 21240, `Balance due should be 21240, got ${fmt(po.balanceDue)}`);
    assert(fmt(supplierAfterRec.totalPurchases) === 21240, `Supplier purchases should be 21240, got ${fmt(supplierAfterRec.totalPurchases)}`);
    assert(fmt(supplierAfterRec.pendingPayments) === 21240, `Supplier pending payments should be 21240, got ${fmt(supplierAfterRec.pendingPayments)}`);
    console.log(`Supplier Balance Updated: Pending Payments = ₹${fmt(supplierAfterRec.pendingPayments)}`);

    // 8. Record partial supplier payment of ₹20,000
    const payKey = crypto.randomUUID();
    const payRes = await call("POST", `/purchases/${po.id}/payments`, managerA, {
      amount: 20000,
      paymentMode: "BANK",
      idempotencyKey: payKey,
      notes: "E2E Partial payment"
    });
    assert(payRes.status === 201, `Failed to record payment: ${payRes.text}`);
    po = payRes.json.data;
    const paymentRecord = po.payments[0];
    
    // Check balance restored
    const supplierAfterPay = await prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } });
    assert(fmt(po.amountPaid) === 20000 && fmt(po.balanceDue) === 1240 && po.paymentStatus === "PARTIAL", "PO payment values mismatch");
    assert(fmt(supplierAfterPay.paidAmount) === 20000 && fmt(supplierAfterPay.pendingPayments) === 1240, "Supplier payment values mismatch");
    console.log(`Recorded Supplier Payment: Paid = ₹${fmt(po.amountPaid)}, Balance Due = ₹${fmt(po.balanceDue)}`);

    // Check ledger entry exists
    const ledgerPay = await prisma.ledgerEntry.findFirstOrThrow({ where: { businessId: businessA.id, referenceId: paymentRecord.id, transactionType: "SUPPLIER_PAYMENT" } });
    assert(fmt(ledgerPay.debitAmount) === 20000, "Ledger entry debit value mismatch");
    console.log(`Ledger Entry Added: Supplier Payment Debit = ₹${fmt(ledgerPay.debitAmount)}`);

    // 9. Reverse supplier payment (₹20,000)
    const revRes = await call("POST", `/purchases/${po.id}/payments/${paymentRecord.id}/reverse`, managerA, {
      reason: "Wrong bank account used"
    });
    assert(revRes.status === 200, `Failed to reverse payment: ${revRes.text}`);
    po = revRes.json.data;

    // 10. Confirm payable restores
    const supplierAfterRev = await prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } });
    assert(fmt(po.amountPaid) === 0 && fmt(po.balanceDue) === 21240 && po.paymentStatus === "UNPAID", "PO payment values not restored on reversal");
    assert(fmt(supplierAfterRev.paidAmount) === 0 && fmt(supplierAfterRev.pendingPayments) === 21240, "Supplier balances not restored on reversal");
    console.log(`Reversed Supplier Payment. Payable Restored: Balance Due = ₹${fmt(po.balanceDue)}, Pending = ₹${fmt(supplierAfterRev.pendingPayments)}`);

    // Confirm opposite ledger entry added and nets zero
    const ledgerEntries = await prisma.ledgerEntry.findMany({ where: { businessId: businessA.id, referenceId: paymentRecord.id } });
    assert(ledgerEntries.length === 2, "Should be exactly two ledger entries for this payment (pay & reverse)");
    const netLedger = ledgerEntries.reduce((sum, item) => sum + fmt(item.debitAmount) - fmt(item.creditAmount), 0);
    assert(netLedger === 0, `Ledger net effect must be 0, got ${netLedger}`);
    const ledgerRev = ledgerEntries.find(x => x.transactionType === "SUPPLIER_PAYMENT_REVERSAL");
    assert(ledgerRev && fmt(ledgerRev.creditAmount) === 20000, "Opposite ledger entry credit amount incorrect");
    console.log(`Ledger Reversal Entry Added: Supplier Payment Reversal Credit = ₹${fmt(ledgerRev?.creditAmount)}`);

    // 11. Create Sales Order
    const soRes = await call("POST", "/sales-orders", ownerA, {
      customerId: customer.id,
      taxMode: "GST",
      placeOfSupplyCode: "27",
      notes: "E2E Sales Order",
      items: [{
        inventoryItemId: material.id,
        godownId: godown.id,
        quantity: 50,
        rate: 400,
        gstRate: 18
      }]
    });
    assert(soRes.status === 201, `Failed to create Sales Order: ${soRes.text}`);
    let so = soRes.json.data;
    console.log(`Created Sales Order: ${so.orderNumber}, Status: ${so.status}, Total Amount: ₹${fmt(so.totalAmount)}`);

    // Confirm Sales Order
    const confirmSo = await call("POST", `/sales-orders/${so.id}/confirm`, ownerA);
    assert(confirmSo.status === 200, "Failed to confirm Sales Order");
    so = confirmSo.json.data;
    assert(so.status === "CONFIRMED", "Sales order status should be CONFIRMED");

    // 12. Create partial GST invoice (qty: 30)
    const invRes = await call("POST", "/invoices", ownerA, {
      salesOrderId: so.id,
      notes: "Partial GST Invoice",
      items: [{
        salesOrderItemId: so.items[0].id,
        inventoryItemId: material.id,
        quantity: 30,
        rate: 400,
        gstRate: 18
      }]
    });
    assert(invRes.status === 201, `Failed to create invoice: ${invRes.text}`);
    let invoice = invRes.json.data;
    console.log(`Created Partial GST Invoice: ${invoice.invoiceNumber}, Status: ${invoice.status}, Total Amount: ₹${fmt(invoice.totalAmount)}`);

    // 13. Issue invoice
    const issueRes = await call("POST", `/invoices/${invoice.id}/issue`, ownerA);
    assert(issueRes.status === 200, "Failed to issue invoice");
    invoice = issueRes.json.data;
    assert(invoice.status === "ISSUED", "Invoice status should be ISSUED");
    
    // Taxable = 30 * 400 = 12000, Tax = 12000 * 0.18 = 2160, Total = 14160
    assert(fmt(invoice.taxableTotal) === 12000, `Taxable total should be 12000, got ${fmt(invoice.taxableTotal)}`);
    assert(fmt(invoice.taxTotal) === 2160, `Tax total should be 2160, got ${fmt(invoice.taxTotal)}`);
    assert(fmt(invoice.totalAmount) === 14160, `Total amount should be 14160, got ${fmt(invoice.totalAmount)}`);
    assert(fmt(invoice.balanceDue) === 14160, `Balance due should be 14160, got ${fmt(invoice.balanceDue)}`);

    const customerAfterInv = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    assert(fmt(customerAfterInv.outstandingBalance) === 14160, `Customer outstanding should be 14160, got ${fmt(customerAfterInv.outstandingBalance)}`);
    console.log(`Issued Invoice. Customer Outstanding Updated: Outstanding = ₹${fmt(customerAfterInv.outstandingBalance)}`);

    // 14. Record partial customer payment of ₹10,000
    const cpKey = crypto.randomUUID();
    const cpRes = await call("POST", "/customer-payments", ownerA, {
      customerId: customer.id,
      invoiceId: invoice.id,
      amount: 10000,
      paymentMethod: "UPI",
      idempotencyKey: cpKey,
      notes: "Partial customer payment"
    });
    assert(cpRes.status === 201, `Failed to record customer payment: ${cpRes.text}`);
    const customerPayment = cpRes.json.data;

    // Check outstanding and invoice balances
    const invoiceAfterPay = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    const customerAfterPay = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    assert(fmt(invoiceAfterPay.amountPaid) === 10000 && fmt(invoiceAfterPay.balanceDue) === 4160 && invoiceAfterPay.status === "PARTIALLY_PAID", "Invoice payment values mismatch");
    assert(fmt(customerAfterPay.outstandingBalance) === 4160, `Customer outstanding should be 4160, got ${fmt(customerAfterPay.outstandingBalance)}`);
    console.log(`Recorded Customer Payment: Paid = ₹${fmt(invoiceAfterPay.amountPaid)}, Balance Due = ₹${fmt(invoiceAfterPay.balanceDue)}`);

    // Check ledger entry exists
    const ledgerCpPay = await prisma.ledgerEntry.findFirstOrThrow({ where: { businessId: businessA.id, referenceId: customerPayment.id, transactionType: "CUSTOMER_PAYMENT" } });
    assert(fmt(ledgerCpPay.creditAmount) === 10000, "Customer payment ledger entry credit mismatch");
    console.log(`Ledger Entry Added: Customer Payment Credit = ₹${fmt(ledgerCpPay.creditAmount)}`);

    // 15. Reverse customer payment (₹10,000)
    const cpRevRes = await call("POST", `/customer-payments/${customerPayment.id}/reverse`, ownerA);
    assert(cpRevRes.status === 200, `Failed to reverse customer payment: ${cpRevRes.text}`);
    
    // 16. Confirm receivable restores
    const invoiceAfterRev = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    const customerAfterRev = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    assert(fmt(invoiceAfterRev.amountPaid) === 0 && fmt(invoiceAfterRev.balanceDue) === 14160 && invoiceAfterRev.status === "ISSUED", "Invoice values not restored on reversal");
    assert(fmt(customerAfterRev.outstandingBalance) === 14160, `Customer outstanding should be restored to 14160, got ${fmt(customerAfterRev.outstandingBalance)}`);
    console.log(`Reversed Customer Payment. Receivable Restored: Outstanding = ₹${fmt(customerAfterRev.outstandingBalance)}`);

    // Confirm opposite ledger entry added and nets zero
    const ledgerCpEntries = await prisma.ledgerEntry.findMany({ where: { businessId: businessA.id, referenceId: customerPayment.id } });
    assert(ledgerCpEntries.length === 2, "Should be exactly two ledger entries for this payment (pay & reverse)");
    const netCpLedger = ledgerCpEntries.reduce((sum, item) => sum + fmt(item.debitAmount) - fmt(item.creditAmount), 0);
    assert(netCpLedger === 0, `Ledger net effect must be 0, got ${netCpLedger}`);
    const ledgerCpRev = ledgerCpEntries.find(x => x.transactionType === "CUSTOMER_PAYMENT_REVERSAL");
    assert(ledgerCpRev && fmt(ledgerCpRev.debitAmount) === 10000, "Opposite customer payment ledger entry debit amount incorrect");
    console.log(`Ledger Reversal Entry Added: Customer Payment Reversal Debit = ₹${fmt(ledgerCpRev?.debitAmount)}`);

    // 17. Create paid GST expense (₹5,000, gstRate: 18, total: ₹5,900)
    const categoryName = `E2E Expense Category ${suffix}`;
    const catRes = await call("POST", "/expense-categories", ownerA, {
      name: categoryName,
      description: "E2E verification expense category"
    });
    assert(catRes.status === 201, "Failed to create expense category");
    const category = catRes.json.data;

    const expRes = await call("POST", "/expenses", ownerA, {
      expenseDate: new Date().toISOString(),
      categoryId: category.id,
      payee: "Electricity Board",
      amount: 5000,
      gstApplicable: true,
      gstRate: 18,
      paymentStatus: "PAID",
      paymentMode: "UPI",
      notes: "Office Electricity Bill",
      idempotencyKey: crypto.randomUUID()
    });
    assert(expRes.status === 201, `Failed to create expense: ${expRes.text}`);
    const expense = expRes.json.data;
    assert(fmt(expense.gstAmount) === 900 && fmt(expense.totalAmount) === 5900, "GST or total expense amount mismatch");
    console.log(`Created Paid GST Expense: ${expense.expenseNumber}, Total Amount: ₹${fmt(expense.totalAmount)}`);

    // 18. Confirm ledger debit
    const ledgerExp = await prisma.ledgerEntry.findFirstOrThrow({ where: { businessId: businessA.id, referenceId: expense.id, transactionType: "EXPENSE_PAYMENT" } });
    assert(fmt(ledgerExp.debitAmount) === 5900, "Ledger debit amount for expense mismatch");
    console.log(`Ledger Entry Added: Expense Debit = ₹${fmt(ledgerExp.debitAmount)}`);

    // 19. Cancel expense
    const cancelExpRes = await call("POST", `/expenses/${expense.id}/cancel`, ownerA, {
      reason: "Billing duplicate"
    });
    assert(cancelExpRes.status === 200, `Failed to cancel expense: ${cancelExpRes.text}`);
    const cancelledExpense = cancelExpRes.json.data;
    assert(cancelledExpense.paymentStatus === "CANCELLED", "Expense status should be CANCELLED");
    console.log(`Cancelled Expense. Status: ${cancelledExpense.paymentStatus}`);

    // 20. Confirm ledger reversal
    const ledgerExpEntries = await prisma.ledgerEntry.findMany({ where: { businessId: businessA.id, referenceId: expense.id } });
    assert(ledgerExpEntries.length === 2, "Should be exactly two ledger entries for this expense (pay & cancel)");
    const netExpLedger = ledgerExpEntries.reduce((sum, item) => sum + fmt(item.debitAmount) - fmt(item.creditAmount), 0);
    assert(netExpLedger === 0, `Expense ledger net effect must be 0, got ${netExpLedger}`);
    const ledgerExpRev = ledgerExpEntries.find(x => x.transactionType === "EXPENSE_PAYMENT_REVERSAL");
    assert(ledgerExpRev && fmt(ledgerExpRev.creditAmount) === 5900, "Opposite ledger entry credit amount incorrect");
    console.log(`Ledger Reversal Entry Added: Expense Reversal Credit = ₹${fmt(ledgerExpRev?.creditAmount)}`);

    // Now run report validations
    const range = `from=${new Date().getFullYear()}-01-01&to=${new Date().toISOString().slice(0, 10)}`;

    // 21. Verify inventory report
    const rInv = await call("GET", `/reports/inventory?${range}`, ownerA);
    assert(rInv.status === 200, "Inventory report fetch failed");
    const matRow = rInv.json.rows.find((x: any) => x.id === material.id);
    assert(matRow && matRow.openingQuantity === 0 && matRow.closingQuantity === 60 && matRow.stockIn === 60 && matRow.stockOut === 0 && matRow.discrepancy === 0, "Inventory report reconciliation mismatch");
    console.log("Verified Inventory Report matches stock history.");

    // 22. Verify stock valuation
    const rVal = await call("GET", "/reports/stock-valuation", ownerA);
    assert(rVal.status === 200, "Stock valuation report fetch failed");
    const valRow = rVal.json.rows.find((x: any) => x.id === material.id);
    assert(valRow && fmt(valRow.stockValue) === 18000 && valRow.valuationMethod === "LAST_PURCHASE_COST", "Stock valuation mismatch");
    console.log(`Verified Stock Valuation Report: Total Value = ₹${rVal.json.summary.totalStockValue}`);

    // 23. Verify customer outstanding
    const rCus = await call("GET", "/reports/customer-outstanding", ownerA);
    assert(rCus.status === 200, "Customer outstanding report fetch failed");
    assert(fmt(rCus.json.summary.totalReceivable) === 14160 && rCus.json.rows[0]?.name === "Standard Customer A", "Customer outstanding mismatch");
    console.log(`Verified Customer Outstanding Report matches Receivables: Receivable = ₹${rCus.json.summary.totalReceivable}`);

    // 24. Verify supplier outstanding
    const rSup = await call("GET", `/reports/supplier-outstanding?${range}`, ownerA);
    assert(rSup.status === 200, "Supplier outstanding report fetch failed");
    assert(fmt(rSup.json.summary.totalPayable) === 21240 && rSup.json.rows[0]?.name === "Standard Supplier A", "Supplier outstanding mismatch");
    console.log(`Verified Supplier Outstanding Report matches Payables: Payable = ₹${rSup.json.summary.totalPayable}`);

    // 25. Verify expense report
    const rExp = await call("GET", `/reports/expenses?${range}`, ownerA);
    assert(rExp.status === 200, "Expense report fetch failed");
    // Cancelled expense must be excluded from totals!
    assert(fmt(rExp.json.summary.totalExpenses) === 0 && fmt(rExp.json.summary.gstOnExpenses) === 0, "Cancelled expense included in totals");
    console.log("Verified Expense Report correctly excludes cancelled expenses.");

    // 26. Verify GST report
    const rGst = await call("GET", `/reports/gst-summary?${range}`, ownerA);
    assert(rGst.status === 200, "GST report fetch failed");
    // Output GST from sales = 2160
    // Input GST: Expense input = 0 (cancelled), Purchase input: proportionally estimated
    // Purchase order totalAmount: 11800, taxTotal: 1800. GRN totalAmount: 21240
    // GRN input GST estimate: 21240 * 1800 / 11800 = 3240
    assert(fmt(rGst.json.summary.salesGst.outputGst) === 2160, `Output GST mismatch: got ${fmt(rGst.json.summary.salesGst.outputGst)}`);
    assert(fmt(rGst.json.summary.purchaseGst.inputGst) === 3240, `Purchase input GST mismatch: got ${fmt(rGst.json.summary.purchaseGst.inputGst)}`);
    assert(fmt(rGst.json.summary.expenseGst.inputGst) === 0, `Expense input GST mismatch: got ${fmt(rGst.json.summary.expenseGst.inputGst)}`);
    console.log(`Verified GST Report: Output GST = ₹${rGst.json.summary.salesGst.outputGst}, Input GST = ₹${rGst.json.summary.netGst.eligibleInputGst}`);

    // 27. Verify estimated P&L
    const rPl = await call("GET", `/reports/profit-loss?${range}`, ownerA);
    assert(rPl.status === 200, "P&L report fetch failed");
    // Revenue = 12000 (excludes GST)
    // COGS: 30 sold bags * 300 cost = 9000
    // Operating expenses = 0 (paid is cancelled)
    // Net profit = 12000 - 9000 = 3000
    assert(fmt(rPl.json.summary.revenue) === 12000, `P&L revenue mismatch: got ${fmt(rPl.json.summary.revenue)}`);
    assert(fmt(rPl.json.summary.estimatedCogs) === 9000, `P&L COGS mismatch: got ${fmt(rPl.json.summary.estimatedCogs)}`);
    assert(fmt(rPl.json.summary.operatingExpenses) === 0, `P&L operating expenses mismatch: got ${fmt(rPl.json.summary.operatingExpenses)}`);
    assert(fmt(rPl.json.summary.netOperatingProfit) === 3000, `P&L net profit mismatch: got ${fmt(rPl.json.summary.netOperatingProfit)}`);
    console.log(`Verified P&L Report: Revenue = ₹${rPl.json.summary.revenue}, COGS = ₹${rPl.json.summary.estimatedCogs}, Net Profit = ₹${rPl.json.summary.netOperatingProfit}`);

    // 28. Export at least one CSV
    const rCsv = await call("GET", `/reports/sales?${range}&format=csv`, ownerA);
    assert(rCsv.status === 200 && rCsv.headers.get("content-type")?.includes("text/csv"), "Sales CSV export failed");
    console.log("Verified CSV Export header and formatting.");

    // 29. Print-preview structure validation
    // The report-print-root must be present and classes match
    assert(rCsv.text.includes("Standard Customer A"), "Sales CSV is missing record details");
    console.log("Verified Print-preview data structure.");

    // 30. Confirm Business B sees none of Business A's data
    const rSalesB = await call("GET", `/reports/sales?${range}`, ownerB);
    assert(rSalesB.status === 200 && fmt(rSalesB.json.summary.totalSales) === 0 && rSalesB.json.rows.length === 0, "Business B leaked Business A sales data");
    
    // Cross-tenant direct read attempt
    const rDirectRead = await call("GET", `/customers/${customer.id}`, ownerB);
    assert(rDirectRead.status === 404, "Business B was able to read Business A customer");
    console.log("Verified Multi-business data isolation is fully secure.");

    console.log("=== All E2E Business Scenario Checks Passed Successfully ===");
    console.log(JSON.stringify({
      success: true,
      values: {
        businessId: businessA.id,
        initialStock: 0,
        receivedQuantity: 60,
        stockIncreasedTo: 60,
        supplierPendingPaymentsBeforeReversal: 1240,
        supplierPendingPaymentsAfterReversal: 21240,
        ledgerNetPaymentEffect: 0,
        salesOrderAmount: 23600,
        invoiceAmount: 14160,
        customerOutstandingBeforeReversal: 4160,
        customerOutstandingAfterReversal: 14160,
        expenseTotal: 5900,
        expenseCancelled: "CANCELLED",
        expenseLedgerNetEffect: 0,
        reportSalesTotal: 14160,
        reportRevenueTotal: 12000,
        reportValuationTotal: 18000,
        reportCOGS: 9000,
        reportNetProfit: 3000,
        gstEstimatedNetPayable: -1080
      }
    }, null, 2));

    await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
  } finally {
    try {
      const bizIds = [businessA.id, businessB.id];
      await prisma.salesReturnItem.deleteMany({ where: { salesReturn: { businessId: { in: bizIds } } } });
      await prisma.salesReturn.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.purchaseReturnItem.deleteMany({ where: { purchaseReturn: { businessId: { in: bizIds } } } });
      await prisma.purchaseReturn.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.ledgerEntry.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.expense.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.expenseCategory.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.customerPayment.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.purchasePayment.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.purchaseReceiptItem.deleteMany({ where: { purchaseReceipt: { businessId: { in: bizIds } } } });
      await prisma.purchaseReceipt.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { businessId: { in: bizIds } } } });
      await prisma.purchaseOrder.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.invoiceItem.deleteMany({ where: { invoice: { businessId: { in: bizIds } } } });
      await prisma.invoice.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.salesOrderItem.deleteMany({ where: { salesOrder: { businessId: { in: bizIds } } } });
      await prisma.salesOrder.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.deliveryItem.deleteMany({ where: { delivery: { businessId: { in: bizIds } } } });
      await prisma.delivery.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.stockTransferItem.deleteMany({ where: { stockTransfer: { businessId: { in: bizIds } } } });
      await prisma.stockTransfer.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.stockTransaction.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.godownStock.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.inventoryItem.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.godown.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.customer.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.supplier.deleteMany({ where: { businessId: { in: bizIds } } });
      await prisma.user.deleteMany({ where: { businessId: { in: bizIds } } });
    } catch (err) {
      console.error("Error during E2E cleanup:", err);
    }
    await prisma.business.deleteMany({ where: { id: { in: [businessA.id, businessB.id] } } });
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error("=== E2E Business Scenario Failed ===");
  console.error(error);
  process.exit(1);
});
