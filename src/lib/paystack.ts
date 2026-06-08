const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

interface PaystackInitializeParams {
  email: string;
  amount: number; // in kobo (smallest currency unit)
  reference: string;
  callback_url?: string;
  metadata?: Record<string, any>;
}

interface PaystackResponse {
  status: boolean;
  message: string;
  data: any;
}

async function paystackRequest(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: any
): Promise<PaystackResponse> {
  const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.json();
}

export async function initializeTransaction(
  params: PaystackInitializeParams
): Promise<PaystackResponse> {
  return paystackRequest("/transaction/initialize", "POST", {
    ...params,
    amount: params.amount * 100, // Convert Naira to kobo
  });
}

export async function verifyTransaction(
  reference: string
): Promise<PaystackResponse> {
  return paystackRequest(`/transaction/verify/${reference}`);
}

export function generateReference(): string {
  return `UNINEST-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
