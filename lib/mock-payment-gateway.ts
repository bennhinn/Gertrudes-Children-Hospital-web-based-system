/**
 * Mock Payment Gateway
 * Simulates real payment processing with predictable test behaviors
 */

export type PaymentMethod = 'card' | 'mpesa' | 'cash' | 'insurance' | 'bank_transfer';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export interface CardDetails {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
}

export interface MpesaDetails {
  phoneNumber: string;
  accountReference?: string;
}

export interface InsuranceDetails {
  policyNumber: string;
  providerName: string;
  memberId?: string;
}

export interface BankTransferDetails {
  accountNumber: string;
  bankName: string;
  accountName: string;
  reference: string;
}

export interface PaymentRequest {
  amount: number;
  currency: 'KES' | 'USD';
  paymentMethod: PaymentMethod;
  invoiceId: string;
  caregiverId: string;
  childId?: string;
  paymentDetails: CardDetails | MpesaDetails | InsuranceDetails | BankTransferDetails | null;
}

export interface PaymentResponse {
  success: boolean;
  status: PaymentStatus;
  transactionId: string;
  message: string;
  receiptNumber?: string;
  cardLast4?: string;
  cardBrand?: string;
  mpesaTransactionId?: string;
  insuranceCoverage?: {
    approvedAmount: number;
    coveragePercent: number;
    remainingBalance: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Test card numbers with specific behaviors
 */
const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  INSUFFICIENT_FUNDS: '4000000000000002',
  CARD_DECLINED: '4000000000009995',
  EXPIRED_CARD: '4000000000000069',
  INCORRECT_CVC: '4000000000000127',
};

/**
 * Test M-Pesa phone numbers
 */
const TEST_MPESA = {
  SUCCESS: '0712345678',
  PIN_REQUIRED: '0787654321',
  INSUFFICIENT_BALANCE: '0700000000',
};

/**
 * Test insurance policies
 */
const TEST_INSURANCE = {
  FULL_COVERAGE: 'POL-12345',
  PARTIAL_COVERAGE: 'POL-99999',
  REJECTED: 'POL-00000',
};

/**
 * Generate transaction ID
 */
function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

/**
 * Generate receipt number
 */
function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 11).toUpperCase();
  return `RCP-${year}-${random}`;
}

/**
 * Detect card brand from card number
 */
function detectCardBrand(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (cleaned.startsWith('4')) return 'Visa';
  if (cleaned.startsWith('5')) return 'Mastercard';
  if (cleaned.startsWith('3')) return 'American Express';
  if (cleaned.startsWith('6')) return 'Discover';
  
  return 'Unknown';
}

/**
 * Get last 4 digits of card
 */
function getCardLast4(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  return cleaned.slice(-4);
}

/**
 * Simulate processing delay
 */
async function simulateDelay(min: number = 1000, max: number = 3000): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Process card payment
 */
async function processCardPayment(
  amount: number,
  cardDetails: CardDetails
): Promise<PaymentResponse> {
  await simulateDelay(2000, 3000);

  const cardNumber = cardDetails.cardNumber.replace(/\s/g, '');
  const transactionId = generateTransactionId();
  const receiptNumber = generateReceiptNumber();
  const cardBrand = detectCardBrand(cardNumber);
  const cardLast4 = getCardLast4(cardNumber);

  // Check for test card behaviors
  if (cardNumber === TEST_CARDS.INSUFFICIENT_FUNDS) {
    return {
      success: false,
      status: 'failed',
      transactionId,
      message: 'Payment declined - Insufficient funds',
      cardLast4,
      cardBrand,
    };
  }

  if (cardNumber === TEST_CARDS.CARD_DECLINED) {
    return {
      success: false,
      status: 'failed',
      transactionId,
      message: 'Payment declined - Card declined by issuer',
      cardLast4,
      cardBrand,
    };
  }

  if (cardNumber === TEST_CARDS.EXPIRED_CARD) {
    return {
      success: false,
      status: 'failed',
      transactionId,
      message: 'Payment failed - Card has expired',
      cardLast4,
      cardBrand,
    };
  }

  if (cardNumber === TEST_CARDS.INCORRECT_CVC) {
    return {
      success: false,
      status: 'failed',
      transactionId,
      message: 'Payment failed - Incorrect CVC',
      cardLast4,
      cardBrand,
    };
  }

  // For test success card or random cards (95% success rate)
  if (cardNumber === TEST_CARDS.SUCCESS || Math.random() < 0.95) {
    return {
      success: true,
      status: 'completed',
      transactionId,
      receiptNumber,
      message: 'Payment successful',
      cardLast4,
      cardBrand,
    };
  }

  // Random failure
  return {
    success: false,
    status: 'failed',
    transactionId,
    message: 'Payment failed - Please try again',
    cardLast4,
    cardBrand,
  };
}

/**
 * Process M-Pesa payment
 */
async function processMpesaPayment(
  amount: number,
  mpesaDetails: MpesaDetails
): Promise<PaymentResponse> {
  await simulateDelay(3000, 5000);

  const transactionId = generateTransactionId();
  const receiptNumber = generateReceiptNumber();
  const phoneNumber = mpesaDetails.phoneNumber;

  // Check for test phone behaviors
  if (phoneNumber === TEST_MPESA.INSUFFICIENT_BALANCE) {
    return {
      success: false,
      status: 'failed',
      transactionId,
      message: 'M-Pesa payment failed - Insufficient balance',
      metadata: { phoneNumber },
    };
  }

  if (phoneNumber === TEST_MPESA.PIN_REQUIRED) {
    // Simulate PIN confirmation step
    await simulateDelay(2000, 3000);
  }

  // 98% success rate for M-Pesa
  if (phoneNumber === TEST_MPESA.SUCCESS || Math.random() < 0.98) {
    const mpesaTransactionId = `MPE${Date.now()}${Math.floor(Math.random() * 10000)}`;
    
    return {
      success: true,
      status: 'completed',
      transactionId,
      receiptNumber,
      message: 'M-Pesa payment successful',
      mpesaTransactionId,
      metadata: { phoneNumber },
    };
  }

  return {
    success: false,
    status: 'failed',
    transactionId,
    message: 'M-Pesa payment failed - Please try again',
    metadata: { phoneNumber },
  };
}

/**
 * Process insurance claim
 */
async function processInsurancePayment(
  amount: number,
  insuranceDetails: InsuranceDetails
): Promise<PaymentResponse> {
  await simulateDelay(5000, 10000);

  const transactionId = generateTransactionId();
  const policyNumber = insuranceDetails.policyNumber;

  // Check for test policy behaviors
  if (policyNumber === TEST_INSURANCE.REJECTED) {
    return {
      success: false,
      status: 'failed',
      transactionId,
      message: 'Insurance claim denied - Invalid or inactive policy',
    };
  }

  if (policyNumber === TEST_INSURANCE.FULL_COVERAGE) {
    return {
      success: true,
      status: 'completed',
      transactionId,
      receiptNumber: generateReceiptNumber(),
      message: 'Insurance claim approved - 100% coverage',
      insuranceCoverage: {
        approvedAmount: amount,
        coveragePercent: 100,
        remainingBalance: 0,
      },
    };
  }

  if (policyNumber === TEST_INSURANCE.PARTIAL_COVERAGE) {
    const coveragePercent = 80;
    const approvedAmount = (amount * coveragePercent) / 100;
    const remainingBalance = amount - approvedAmount;

    return {
      success: true,
      status: 'completed',
      transactionId,
      receiptNumber: generateReceiptNumber(),
      message: `Insurance claim approved - ${coveragePercent}% coverage`,
      insuranceCoverage: {
        approvedAmount,
        coveragePercent,
        remainingBalance,
      },
    };
  }

  // Random coverage for other policies (85% approval, 60-90% coverage)
  if (Math.random() < 0.85) {
    const coveragePercent = Math.floor(Math.random() * 31) + 60; // 60-90%
    const approvedAmount = (amount * coveragePercent) / 100;
    const remainingBalance = amount - approvedAmount;

    return {
      success: true,
      status: 'completed',
      transactionId,
      receiptNumber: generateReceiptNumber(),
      message: `Insurance claim approved - ${coveragePercent}% coverage`,
      insuranceCoverage: {
        approvedAmount,
        coveragePercent,
        remainingBalance,
      },
    };
  }

  return {
    success: false,
    status: 'failed',
    transactionId,
    message: 'Insurance claim denied - Please contact your provider',
  };
}

/**
 * Process cash payment (always succeeds for staff)
 */
async function processCashPayment(amount: number): Promise<PaymentResponse> {
  await simulateDelay(500, 1000);

  return {
    success: true,
    status: 'completed',
    transactionId: generateTransactionId(),
    receiptNumber: generateReceiptNumber(),
    message: 'Cash payment received',
  };
}

/**
 * Process bank transfer
 */
async function processBankTransfer(
  amount: number,
  bankDetails: BankTransferDetails
): Promise<PaymentResponse> {
  await simulateDelay(3000, 5000);

  // 90% success rate for bank transfers
  if (Math.random() < 0.9) {
    return {
      success: true,
      status: 'completed',
      transactionId: generateTransactionId(),
      receiptNumber: generateReceiptNumber(),
      message: 'Bank transfer successful',
      metadata: {
        bankName: bankDetails.bankName,
        reference: bankDetails.reference,
      },
    };
  }

  return {
    success: false,
    status: 'failed',
    transactionId: generateTransactionId(),
    message: 'Bank transfer failed - Please verify account details',
  };
}

/**
 * Main payment processing function
 */
export async function processPayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    switch (request.paymentMethod) {
      case 'card':
        if (!request.paymentDetails || !('cardNumber' in request.paymentDetails)) {
          throw new Error('Card details required');
        }
        return await processCardPayment(request.amount, request.paymentDetails as CardDetails);

      case 'mpesa':
        if (!request.paymentDetails || !('phoneNumber' in request.paymentDetails)) {
          throw new Error('M-Pesa phone number required');
        }
        return await processMpesaPayment(request.amount, request.paymentDetails as MpesaDetails);

      case 'insurance':
        if (!request.paymentDetails || !('policyNumber' in request.paymentDetails)) {
          throw new Error('Insurance policy details required');
        }
        return await processInsurancePayment(request.amount, request.paymentDetails as InsuranceDetails);

      case 'cash':
        return await processCashPayment(request.amount);

      case 'bank_transfer':
        if (!request.paymentDetails || !('accountNumber' in request.paymentDetails)) {
          throw new Error('Bank account details required');
        }
        return await processBankTransfer(request.amount, request.paymentDetails as BankTransferDetails);

      default:
        throw new Error('Invalid payment method');
    }
  } catch (error) {
    return {
      success: false,
      status: 'failed',
      transactionId: generateTransactionId(),
      message: error instanceof Error ? error.message : 'Payment processing failed',
    };
  }
}

/**
 * Process refund (mock - instant approval)
 */
export async function processRefund(
  paymentId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; refundNumber: string; message: string }> {
  await simulateDelay(1000, 3000);

  const refundNumber = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  // 95% success rate for refunds
  if (Math.random() < 0.95) {
    return {
      success: true,
      refundNumber,
      message: 'Refund processed successfully',
    };
  }

  return {
    success: false,
    refundNumber: '',
    message: 'Refund failed - Please try again',
  };
}

/**
 * Export test constants for documentation
 */
export const TEST_DATA = {
  CARDS: TEST_CARDS,
  MPESA: TEST_MPESA,
  INSURANCE: TEST_INSURANCE,
};