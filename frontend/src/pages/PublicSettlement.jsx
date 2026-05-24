import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, QrCode, AlertCircle } from 'lucide-react';
import apiClient from '../api/client';

export default function PublicSettlement() {
  const { token } = useParams();
  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchSettlement = async () => {
      try {
        const { data } = await apiClient.get(`settlements/public/${token}/`);
        setSettlement(data);
      } catch (err) {
        setError('Invalid or expired settlement link.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettlement();
  }, [token]);

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">Loading...</div>;
  if (error) return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-red-500">{error}</div>;

  const upiId = settlement.receiver?.upi_id || 'unknown@upi';
  const upiLink = `upi://pay?pa=${upiId}&pn=${settlement.receiver?.first_name || 'User'}&am=${settlement.amount}&tn=SplitSync%20Settlement`;

  const handlePayClick = (e) => {
    e.preventDefault();
    window.location.href = upiLink;
    setTimeout(() => {
      setShowConfirmModal(true);
    }, 1500); // Show modal after a brief delay
  };

  const handleConfirmPayment = async () => {
    setConfirming(true);
    try {
      await apiClient.post(`settlements/public/${token}/confirm_payment/`);
      setShowConfirmModal(false);
      setPaymentSuccess(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm payment.');
    } finally {
      setConfirming(false);
    }
  };

  if (paymentSuccess || settlement.confirmation?.is_confirmed) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Payment Confirmed</h2>
          <p className="text-slate-500">The receiver has been notified and needs to lock the settlement.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="bg-primary p-8 text-center text-white">
          <p className="text-primary-100 mb-1">Payment Request</p>
          <h1 className="text-4xl font-bold tracking-tight">₹{settlement.amount}</h1>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-4">
            <span className="text-slate-500">To</span>
            <span className="font-semibold text-slate-900">{settlement.receiver?.first_name || settlement.receiver?.email}</span>
          </div>

          <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-4">
            <span className="text-slate-500">From</span>
            <span className="font-semibold text-slate-900">{settlement.payer?.first_name || settlement.payer?.email}</span>
          </div>

          <div className="flex justify-between items-center text-sm pb-2">
            <span className="text-slate-500">UPI ID</span>
            <span className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">{upiId}</span>
          </div>

          <div className="pt-4 grid gap-3">
            <button 
              onClick={handlePayClick}
              className="flex items-center justify-center w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            >
              Pay with UPI App
            </button>

            <button className="flex items-center justify-center w-full py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl active:bg-slate-50 transition-colors">
              <QrCode size={20} className="mr-2" /> Show QR Code
            </button>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Was the payment done?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Did your payment go through successfully via the UPI app?
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Retry
                </button>
                <button 
                  onClick={handleConfirmPayment}
                  disabled={confirming}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors"
                >
                  {confirming ? 'Wait...' : 'Yes, Settle'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
