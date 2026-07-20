export type ReportKey="overview"|"sales"|"purchases"|"inventory"|"stock-valuation"|"customer-outstanding"|"supplier-outstanding"|"expenses"|"gst-summary"|"profit-loss";
export const reportConfigs:Record<ReportKey,{title:string;description:string;currentState?:boolean;restricted?:boolean;source?:string}>={
  overview:{title:"Business Overview",description:"A concise view of sales, purchases, expenses, balances and stock.",restricted:true},
  sales:{title:"Sales Report",description:"Issued invoice sales, GST, collections and outstanding amounts.",source:"/invoices"},
  purchases:{title:"Purchase Report",description:"Ordered and received purchase values by supplier and material.",source:"/purchases"},
  inventory:{title:"Inventory Report",description:"Current stock with movement reconciliation.",currentState:true,source:"/materials"},
  "stock-valuation":{title:"Stock Valuation Report",description:"Current stock valued using available last purchase cost.",currentState:true,restricted:true,source:"/materials"},
  "customer-outstanding":{title:"Customer Outstanding Report",description:"Money to receive, credit limits and ageing.",currentState:true,restricted:true,source:"/financials/receivables"},
  "supplier-outstanding":{title:"Supplier Outstanding Report",description:"Money to pay and supplier ageing.",currentState:true,restricted:true,source:"/financials/payables"},
  expenses:{title:"Expense Report",description:"Paid, pending, GST and category-wise business expenses.",source:"/expenses"},
  "gst-summary":{title:"GST Summary",description:"Operational estimate of output and input GST.",restricted:true},
  "profit-loss":{title:"Profit & Loss Summary",description:"Estimated management-level operating profit.",restricted:true},
};
