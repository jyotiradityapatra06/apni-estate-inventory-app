import { apiClient } from "./apiClient";
import type { Expense, ExpenseCategory, ExpenseInput, ExpenseSummary } from "../features/expenses/expense.types";
export const expenseApi = {
  list:(query="")=>apiClient<{success:boolean;data:Expense[];pagination:{page:number;limit:number;total:number;pages:number}}>(`/expenses${query?`?${query}`:""}`),
  summary:()=>apiClient<{success:boolean;data:ExpenseSummary}>("/expenses/summary"),
  get:(id:string)=>apiClient<{success:boolean;data:Expense}>(`/expenses/${id}`),
  create:(body:ExpenseInput&{idempotencyKey:string})=>apiClient<{success:boolean;data:Expense}>("/expenses",{method:"POST",body}),
  update:(id:string,body:Partial<ExpenseInput>)=>apiClient<{success:boolean;data:Expense}>(`/expenses/${id}`,{method:"PATCH",body}),
  markPaid:(id:string,paymentMode:string)=>apiClient<{success:boolean;data:Expense}>(`/expenses/${id}/mark-paid`,{method:"POST",body:{paymentMode}}),
  cancel:(id:string,reason:string)=>apiClient<{success:boolean;data:Expense}>(`/expenses/${id}/cancel`,{method:"POST",body:{reason}}),
};
export const expenseCategoryApi = {
  list:(query="")=>apiClient<{success:boolean;data:ExpenseCategory[]}>(`/expense-categories${query?`?${query}`:""}`),
  create:(body:{name:string;description?:string})=>apiClient<{success:boolean;data:ExpenseCategory}>("/expense-categories",{method:"POST",body}),
  update:(id:string,body:{name?:string;description?:string;isActive?:boolean})=>apiClient<{success:boolean;data:ExpenseCategory}>(`/expense-categories/${id}`,{method:"PATCH",body}),
  deactivate:(id:string)=>apiClient<{success:boolean;data:ExpenseCategory}>(`/expense-categories/${id}/deactivate`,{method:"POST"}),
};
