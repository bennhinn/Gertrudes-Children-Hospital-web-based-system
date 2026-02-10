import { useState } from 'react';
import type { 
  PaymentMethod,
  CardDetails,
  MpesaDetails,
  InsuranceDetails,
  BankTransferDetails,
  PaymentResponse 
} from '@/lib/mock-payment-gateway';

// Define the payment request interface for the hook
export interface ProcessPaymentRequest {
  amount: number;
  currency: 'KES' | 'USD';
  paymentMethod: PaymentMethod;
  invoiceId: string;
  caregiverId: string;
  childId?: string;
  paymentDetails: CardDetails | MpesaDetails | InsuranceDetails | BankTransferDetails | null;
}

interface UsePaymentReturn {
  processPayment: (request: ProcessPaymentRequest) => Promise<PaymentResponse>;
  createInvoice: (invoiceData: any) => Promise<any>;
  generateReceipt: (paymentId: string) => Promise<void>;
  requestRefund: (paymentId: string, amount: number, reason: string) => Promise<any>;
  getPaymentHistory: (filters?: any) => Promise<any>;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for payment operations
 */
export function usePayment(): UsePaymentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Process a payment
   */
  const processPayment = async (request: ProcessPaymentRequest): Promise<PaymentResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment processing failed');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create an invoice
   */
  const createInvoice = async (invoiceData: any): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invoice creation failed');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invoice creation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate and download receipt
   */
  const generateReceipt = async (paymentId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/${paymentId}/receipt`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Receipt generation failed');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Receipt generation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Request a refund
   */
  const requestRefund = async (
    paymentId: string,
    amount: number,
    reason: string
  ): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Refund request failed');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Refund request failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get payment history
   */
  const getPaymentHistory = async (filters?: {
    child_id?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`/api/payments/history?${params.toString()}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment history');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment history';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    processPayment,
    createInvoice,
    generateReceipt,
    requestRefund,
    getPaymentHistory,
    loading,
    error,
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'KES'): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(method: string, details?: any): string {
  switch (method) {
    case 'card':
      return details?.cardBrand && details?.cardLast4
        ? `${details.cardBrand} ****${details.cardLast4}`
        : 'Card';
    case 'mpesa':
      return details?.mpesaPhone ? `M-Pesa - ${details.mpesaPhone}` : 'M-Pesa';
    case 'cash':
      return 'Cash';
    case 'insurance':
      return 'Insurance';
    case 'bank_transfer':
      return 'Bank Transfer';
    default:
      return method;
  }
}

/**
 * Get status color for badges
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
    case 'paid':
      return 'green';
    case 'pending':
    case 'processing':
      return 'yellow';
    case 'failed':
    case 'cancelled':
      return 'red';
    case 'refunded':
      return 'blue';
    default:
      return 'gray';
  }
}