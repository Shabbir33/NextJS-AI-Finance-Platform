import { inngest } from "@/lib/inngest/client";
import { serve } from "inngest/next";
import {
  checkBudgetAlert,
  processRecurringTransactions,
  triggerRecurringTransactions,
} from "@/lib/inngest/function";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    /* your functions will be passed here later! */
    checkBudgetAlert,
    triggerRecurringTransactions,
    processRecurringTransactions,
  ],
});
