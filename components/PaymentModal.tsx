'use client';

import { useState } from 'react';
import { usePayment, formatCurrency } from '@/hooks/usePayment';
import type { PaymentMethod } from '@/lib/mock-payment-gateway';

interface PaymentModalProps {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  items: Array<{
    description: string;
    quantity: number;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  discount?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentModal({
  invoiceId,
  invoiceNumber,
  totalAmount,
  items,
  subtotal,
  tax,
  discount = 0,
  onSuccess,
  onCancel,
}: PaymentModalProps) {
  const { processPayment, loading, error } = usePayment();
  
  const [step, setStep] = useState<'method' | 'details' | 'processing' | 'success' | 'failed'>('method');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [result, setResult] = useState<any>(null);

  // Card details state
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
  });

  // M-Pesa details state
  const [mpesaDetails, setMpesaDetails] = useState({
    phoneNumber: '',
  });

  // Insurance details state
  const [insuranceDetails, setInsuranceDetails] = useState({
    policyNumber: '',
    providerName: '',
    memberId: '',
  });

  // Bank transfer details state
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    bankName: '',
    accountName: '',
    reference: '',
  });

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');

    try {
      let paymentDetails: any = null;

      switch (paymentMethod) {
        case 'card':
          paymentDetails = cardDetails;
          break;
        case 'mpesa':
          paymentDetails = mpesaDetails;
          break;
        case 'insurance':
          paymentDetails = insuranceDetails;
          break;
        case 'bank_transfer':
          paymentDetails = bankDetails;
          break;
        case 'cash':
          paymentDetails = null;
          break;
      }

      const response = await processPayment({
        amount: totalAmount,
        currency: 'KES',
        paymentMethod,
        invoiceId,
        caregiverId: 'current-user-id', // Get from auth context
        paymentDetails,
      });

      setResult(response);

      if (response.success) {
        setStep('success');
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        setStep('failed');
      }
    } catch (err) {
      setStep('failed');
      setResult({ message: err instanceof Error ? err.message : 'Payment failed' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-green-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">Payment</h2>
          <p className="text-green-100">Invoice: {invoiceNumber}</p>
        </div>

        {/* Invoice Summary */}
        <div className="p-6 bg-gray-50 border-b">
          <h3 className="font-semibold mb-3">Invoice Summary</h3>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.description} {item.quantity > 1 && `(×${item.quantity})`}
                </span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Tax (16%):</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Content Based on Step */}
        <div className="p-6">
          {/* Step 1: Select Payment Method */}
          {step === 'method' && (
            <div>
              <h3 className="font-semibold mb-4">Choose Payment Method</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleMethodSelect('card')}
                  className="p-6 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <div className="text-4xl mb-2">💳</div>
                  <div className="font-semibold">Credit/Debit Card</div>
                  <div className="text-sm text-gray-600">Visa, Mastercard, Amex</div>
                </button>

                <button
                  onClick={() => handleMethodSelect('mpesa')}
                  className="p-6 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <div className="text-4xl mb-2">📱</div>
                  <div className="font-semibold">M-Pesa</div>
                  <div className="text-sm text-gray-600">Mobile Money</div>
                </button>

                <button
                  onClick={() => handleMethodSelect('insurance')}
                  className="p-6 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <div className="text-4xl mb-2">🏥</div>
                  <div className="font-semibold">Insurance</div>
                  <div className="text-sm text-gray-600">Submit claim</div>
                </button>

                <button
                  onClick={() => handleMethodSelect('bank_transfer')}
                  className="p-6 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <div className="text-4xl mb-2">🏦</div>
                  <div className="font-semibold">Bank Transfer</div>
                  <div className="text-sm text-gray-600">Direct transfer</div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Enter Payment Details */}
          {step === 'details' && (
            <form onSubmit={handleSubmit}>
              <button
                type="button"
                onClick={() => setStep('method')}
                className="text-sm text-gray-600 mb-4 hover:text-gray-800"
              >
                ← Change payment method
              </button>

              {/* Card Details Form */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <h3 className="font-semibold mb-4">Card Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Test: Use 4242424242424242 for success
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Expiry Month</label>
                      <input
                        type="text"
                        placeholder="MM"
                        value={cardDetails.expiryMonth}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiryMonth: e.target.value })}
                        className="w-full p-3 border rounded-lg"
                        maxLength={2}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Expiry Year</label>
                      <input
                        type="text"
                        placeholder="YYYY"
                        value={cardDetails.expiryYear}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiryYear: e.target.value })}
                        className="w-full p-3 border rounded-lg"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      maxLength={4}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardDetails.cardholderName}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      required
                    />
                  </div>
                </div>
              )}

              {/* M-Pesa Details Form */}
              {paymentMethod === 'mpesa' && (
                <div className="space-y-4">
                  <h3 className="font-semibold mb-4">M-Pesa Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="0712345678"
                      value={mpesaDetails.phoneNumber}
                      onChange={(e) => setMpesaDetails({ ...mpesaDetails, phoneNumber: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Test: Use 0712345678 for success
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      You will receive an M-Pesa prompt on your phone to complete the payment.
                    </p>
                  </div>
                </div>
              )}

              {/* Insurance Details Form */}
              {paymentMethod === 'insurance' && (
                <div className="space-y-4">
                  <h3 className="font-semibold mb-4">Insurance Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Policy Number</label>
                    <input
                      type="text"
                      placeholder="POL-12345"
                      value={insuranceDetails.policyNumber}
                      onChange={(e) => setInsuranceDetails({ ...insuranceDetails, policyNumber: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Test: Use POL-12345 for 100% coverage
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Provider Name</label>
                    <input
                      type="text"
                      placeholder="AAR Insurance"
                      value={insuranceDetails.providerName}
                      onChange={(e) => setInsuranceDetails({ ...insuranceDetails, providerName: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Member ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="MEM-12345"
                      value={insuranceDetails.memberId}
                      onChange={(e) => setInsuranceDetails({ ...insuranceDetails, memberId: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Bank Transfer Details Form */}
              {paymentMethod === 'bank_transfer' && (
                <div className="space-y-4">
                  <h3 className="font-semibold mb-4">Bank Transfer Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="Equity Bank"
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="1234567890"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Account Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={bankDetails.accountName}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Reference</label>
                    <input
                      type="text"
                      placeholder="Payment reference"
                      value={bankDetails.reference}
                      onChange={(e) => setBankDetails({ ...bankDetails, reference: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Pay {formatCurrency(totalAmount)}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Processing Payment...</h3>
              <p className="text-gray-600">
                {paymentMethod === 'mpesa' && 'Please enter your M-Pesa PIN on your phone'}
                {paymentMethod === 'card' && 'Please wait while we process your payment'}
                {paymentMethod === 'insurance' && 'Verifying insurance coverage...'}
                {paymentMethod === 'bank_transfer' && 'Processing bank transfer...'}
              </p>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && result && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-4">
                Receipt: {result.receiptNumber}
              </p>
              <p className="text-gray-600 mb-6">
                Transaction ID: {result.transactionId}
              </p>
              
              {result.insuranceCoverage && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left max-w-md mx-auto">
                  <h4 className="font-semibold mb-2">Insurance Coverage</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Coverage:</span>
                      <span className="font-semibold">{result.insuranceCoverage.coveragePercent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approved Amount:</span>
                      <span>{formatCurrency(result.insuranceCoverage.approvedAmount)}</span>
                    </div>
                    {result.insuranceCoverage.remainingBalance > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>Your Balance:</span>
                        <span>{formatCurrency(result.insuranceCoverage.remainingBalance)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={onSuccess}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Done
              </button>
            </div>
          )}

          {/* Step 5: Failed */}
          {step === 'failed' && result && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-6">
                {result.message}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setStep('method')}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Try Again
                </button>
                <button
                  onClick={onCancel}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}