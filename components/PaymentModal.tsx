'use client';

import { useState } from 'react';
import { usePayment, formatCurrency } from '@/hooks/usePayment';
import type { PaymentMethod } from '@/lib/mock-payment-gateway';
import { 
  CreditCard, 
  Smartphone, 
  Shield, 
  Banknote, 
  Loader, 
  CheckCircle, 
  X, 
  ChevronLeft,
  AlertCircle,
  Calendar,
  Receipt,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'mpesa':
        return <Smartphone className="h-5 w-5" />;
      case 'insurance':
        return <Shield className="h-5 w-5" />;
      case 'bank_transfer':
        return <Banknote className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getPaymentMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case 'card':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'mpesa':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'insurance':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'bank_transfer':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 touch-manipulation">
      {/* Mobile-optimized modal container */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            {step === 'details' ? (
              <button
                onClick={() => setStep('method')}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Receipt className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Payment</h2>
                  <p className="text-xs text-slate-500">{invoiceNumber}</p>
                </div>
              </div>
            )}
            
            <button
              onClick={onCancel}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 active:scale-95"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Invoice Summary - Mobile Optimized */}
          {step !== 'processing' && step !== 'success' && step !== 'failed' && (
            <div className="p-4 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Invoice Summary</h3>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">{formatCurrency(totalAmount)}</div>
                  <div className="text-xs text-slate-500">Total amount</div>
                </div>
              </div>
              
              {/* Quick items preview */}
              <div className="space-y-2 mb-3">
                {items.slice(0, 2).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 truncate flex-1">
                      {item.quantity > 1 && `${item.quantity} × `}{item.description}
                    </span>
                    <span className="font-medium text-slate-900 ml-2">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                {items.length > 2 && (
                  <div className="text-xs text-slate-500 text-center">
                    +{items.length - 2} more items
                  </div>
                )}
              </div>
              
              {/* Breakdown expandable */}
              <details className="group">
                <summary className="flex items-center justify-center gap-1 text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-700">
                  <span>View breakdown</span>
                  <ChevronLeft className="h-4 w-4 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-medium">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax (16%)</span>
                    <span className="font-medium text-slate-900">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </details>
            </div>
          )}

          {/* Step 1: Select Payment Method */}
          {step === 'method' && (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Choose Payment Method</h3>
              
              <div className="space-y-2">
                {[
                  { id: 'card', label: 'Credit/Debit Card', desc: 'Visa, Mastercard, Amex' },
                  { id: 'mpesa', label: 'M-Pesa', desc: 'Mobile Money' },
                  { id: 'insurance', label: 'Insurance', desc: 'Submit claim' },
                  { id: 'bank_transfer', label: 'Bank Transfer', desc: 'Direct transfer' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id as PaymentMethod)}
                    className={`w-full p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${getPaymentMethodColor(method.id as PaymentMethod)} ${paymentMethod === method.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${paymentMethod === method.id ? 'bg-white' : ''}`}>
                        {getPaymentMethodIcon(method.id as PaymentMethod)}
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-sm">{method.label}</div>
                        <div className="text-xs opacity-80">{method.desc}</div>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-slate-400 rotate-180" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Test Mode Banner */}
              <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-800">Test Mode</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Use test credentials: Card: 4242..., M-Pesa: 0712345678
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Enter Payment Details */}
          {step === 'details' && (
            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${getPaymentMethodColor(paymentMethod)}`}>
                  {getPaymentMethodIcon(paymentMethod)}
                  <span className="capitalize">{paymentMethod === 'bank_transfer' ? 'Bank Transfer' : paymentMethod}</span>
                </div>
              </div>

              {/* Card Details Form */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        value={cardDetails.cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const formatted = value.replace(/(.{4})/g, '$1 ').trim();
                          setCardDetails({ ...cardDetails, cardNumber: formatted });
                        }}
                        className="w-full h-12 px-4 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        maxLength={19}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Expiry</label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="MM"
                            value={cardDetails.expiryMonth}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                              setCardDetails({ ...cardDetails, expiryMonth: value });
                            }}
                            className="w-full h-12 px-3 border border-slate-300 rounded-xl text-center text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                            maxLength={2}
                            required
                          />
                          <span className="flex items-center text-slate-400">/</span>
                          <input
                            type="text"
                            placeholder="YYYY"
                            value={cardDetails.expiryYear}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setCardDetails({ ...cardDetails, expiryYear: value });
                            }}
                            className="w-full h-12 px-3 border border-slate-300 rounded-xl text-center text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setCardDetails({ ...cardDetails, cvv: value });
                          }}
                          className="w-full h-12 px-3 border border-slate-300 rounded-xl text-center text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={cardDetails.cardholderName}
                        onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                        className="w-full h-12 px-4 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* M-Pesa Details Form */}
              {paymentMethod === 'mpesa' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">+254</div>
                      <input
                        type="tel"
                        placeholder="7XX XXX XXX"
                        value={mpesaDetails.phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                          setMpesaDetails({ ...mpesaDetails, phoneNumber: value });
                        }}
                        className="w-full h-12 pl-14 pr-4 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Smartphone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-800">
                        You will receive an M-Pesa prompt on your phone to complete the payment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Insurance Details Form */}
              {paymentMethod === 'insurance' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Policy Number</label>
                    <input
                      type="text"
                      placeholder="POL-12345"
                      value={insuranceDetails.policyNumber}
                      onChange={(e) => setInsuranceDetails({ ...insuranceDetails, policyNumber: e.target.value })}
                      className="w-full h-12 px-4 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Provider Name</label>
                    <input
                      type="text"
                      placeholder="AAR Insurance"
                      value={insuranceDetails.providerName}
                      onChange={(e) => setInsuranceDetails({ ...insuranceDetails, providerName: e.target.value })}
                      className="w-full h-12 px-4 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Member ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="MEM-12345"
                      value={insuranceDetails.memberId}
                      onChange={(e) => setInsuranceDetails({ ...insuranceDetails, memberId: e.target.value })}
                      className="w-full h-12 px-4 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Bank Transfer Details Form */}
              {paymentMethod === 'bank_transfer' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Bank Name</label>
                    <select
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                      className="w-full h-12 px-4 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white"
                      required
                    >
                      <option value="">Select Bank</option>
                      <option value="Equity Bank">Equity Bank</option>
                      <option value="KCB Bank">KCB Bank</option>
                      <option value="Co-operative Bank">Co-operative Bank</option>
                      <option value="Standard Chartered">Standard Chartered</option>
                      <option value="Absa Bank">Absa Bank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="1234567890"
                      value={bankDetails.accountNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setBankDetails({ ...bankDetails, accountNumber: value });
                      }}
                      className="w-full h-12 px-4 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Account Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={bankDetails.accountName}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                      className="w-full h-12 px-4 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Reference</label>
                    <input
                      type="text"
                      placeholder="Invoice #{invoiceNumber}"
                      value={bankDetails.reference || `Invoice ${invoiceNumber}`}
                      onChange={(e) => setBankDetails({ ...bankDetails, reference: e.target.value })}
                      className="w-full h-12 px-4 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-slate-100 border-t-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {paymentMethod === 'mpesa' ? (
                    <Smartphone className="h-6 w-6 text-blue-600 animate-pulse" />
                  ) : (
                    <Loader className="h-6 w-6 text-blue-600 animate-pulse" />
                  )}
                </div>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">Processing Payment</h3>
              <p className="mt-2 text-sm text-slate-600 text-center max-w-[280px]">
                {paymentMethod === 'mpesa' && 'Please check your phone and enter your M-Pesa PIN'}
                {paymentMethod === 'card' && 'Please wait while we process your card payment'}
                {paymentMethod === 'insurance' && 'Verifying insurance coverage...'}
                {paymentMethod === 'bank_transfer' && 'Processing bank transfer request...'}
              </p>
              <div className="mt-4 h-1 w-32 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full w-3/4 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && result && (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-50">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">Payment Successful!</h3>
              <p className="mt-2 text-sm text-slate-600">
                Your payment of {formatCurrency(totalAmount)} was completed successfully
              </p>

              <div className="w-full mt-6 space-y-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Receipt Number</span>
                    <span className="text-sm font-medium text-slate-900">{result.receiptNumber}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-slate-600">Transaction ID</span>
                    <span className="text-sm font-medium text-slate-900 truncate ml-2">{result.transactionId}</span>
                  </div>
                </div>

                {result.insuranceCoverage && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Insurance Coverage
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-800">Coverage</span>
                        <span className="font-semibold text-blue-900">{result.insuranceCoverage.coveragePercent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-800">Approved Amount</span>
                        <span className="font-medium text-blue-900">{formatCurrency(result.insuranceCoverage.approvedAmount)}</span>
                      </div>
                      {result.insuranceCoverage.remainingBalance > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span>Your Balance</span>
                          <span className="font-medium">{formatCurrency(result.insuranceCoverage.remainingBalance)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full mt-8">
                <button
                  onClick={onSuccess}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
                >
                  Done
                </button>
                <p className="mt-3 text-xs text-slate-500">
                  Closing automatically in 3 seconds...
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Failed */}
          {step === 'failed' && result && (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-50">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">Payment Failed</h3>
              <p className="mt-2 text-sm text-slate-600 max-w-[280px]">
                {result.message || 'There was an error processing your payment'}
              </p>

              <div className="w-full mt-8 space-y-3">
                <button
                  onClick={() => setStep('method')}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
                >
                  Try Another Method
                </button>
                <button
                  onClick={onCancel}
                  className="w-full h-12 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer for Action Buttons */}
        {(step === 'details' || step === 'method') && (
          <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4">
            {step === 'details' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Total Amount</span>
                  <span className="text-lg font-bold text-slate-900">{formatCurrency(totalAmount)}</span>
                </div>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pay {formatCurrency(totalAmount)}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (paymentMethod) {
                    setStep('details');
                  }
                }}
                disabled={!paymentMethod}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue with {paymentMethod === 'bank_transfer' ? 'Bank Transfer' : paymentMethod}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}