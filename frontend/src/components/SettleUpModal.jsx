import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function SettleUpModal({ isOpen, onClose, targetUser, amount, type, groups, onSuccess }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !targetUser) return null;

  const handleSettle = async () => {
    setSaving(true);
    setError('');
    try {
      // Find a shared group
      const sharedGroup = groups.find(g => g.members.some(m => m.user.id === targetUser.id));
      
      if (!sharedGroup) {
        setError("You don't share any groups with this user to record the settlement.");
        setSaving(false);
        return;
      }

      // If type === 'pay', you owe them. So you pay them.
      // You are the payer. They owe the split (mathematically).
      // If type === 'receive', they owe you. So they pay you.
      // They are the payer. You owe the split (mathematically).
      
      const payerId = type === 'pay' ? user.id : targetUser.id;
      const borrowerId = type === 'pay' ? targetUser.id : user.id;

      const payload = {
        title: 'Settlement',
        description: 'Settlement',
        amount: amount.toFixed(2),
        category: 'Settlement',
        group: sharedGroup.id,
        paid_by_id: payerId,
        splits: [
          {
            user_id: borrowerId,
            amount_owed: amount.toFixed(2),
            amount_paid: 0,
            split_type: 'EXACT'
          }
        ]
      };

      await apiClient.post('expenses/', payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to record settlement.');
    } finally {
      setSaving(false);
    }
  };

  const getAppName = (appCode) => {
    switch (appCode) {
      case 'gpay': return 'Google Pay';
      case 'phonepe': return 'PhonePe';
      case 'paytm': return 'Paytm';
      case 'cred': return 'CRED';
      default: return 'UPI App';
    }
  };

  const getUpiDeepLink = () => {
    if (!targetUser.upi_id) return null;
    
    const pa = encodeURIComponent(targetUser.upi_id);
    const pn = encodeURIComponent(`${targetUser.first_name} ${targetUser.last_name}`);
    const am = amount.toFixed(2);
    const cu = 'INR';
    
    const app = user.preferred_upi_app || 'other';
    let scheme = 'upi://pay';
    
    switch (app) {
      case 'gpay': scheme = 'tez://upi/pay'; break;
      case 'phonepe': scheme = 'phonepe://pay'; break;
      case 'paytm': scheme = 'paytmmp://pay'; break;
      case 'cred': scheme = 'credpay://upi/pay'; break;
      case 'other':
      default: scheme = 'upi://pay'; break;
    }
    
    return `${scheme}?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-slate-900/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
        >
          <div className="p-6 pb-2 text-center relative">
            <button onClick={onClose} className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${type === 'pay' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
              <Check size={32} strokeWidth={3} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {type === 'pay' ? 'Settle Up' : 'Record Payment'}
            </h2>
            <p className="text-sm text-slate-500">
              {type === 'pay' ? `You are paying ${targetUser.first_name}` : `${targetUser.first_name} paid you`}
            </p>
          </div>
          
          <div className="p-6 pt-4 text-center">
            <p className="text-4xl font-bold text-slate-900 mb-6">₹{amount.toFixed(2)}</p>

            {error && <p className="text-sm text-red-500 mb-4 bg-red-50 p-2 rounded-xl">{error}</p>}

            {type === 'pay' && targetUser.upi_id ? (
              <div className="space-y-3 mt-4">
                <button 
                  onClick={() => {
                    handleSettle();
                    const link = getUpiDeepLink();
                    if (link) window.location.href = link;
                  }}
                  disabled={saving}
                  className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 text-white font-bold text-lg transition-all"
                >
                  {saving ? 'Processing...' : `Pay via ${getAppName(user.preferred_upi_app)}`}
                </button>
                <button 
                  onClick={handleSettle}
                  disabled={saving}
                  className="w-full py-3 rounded-2xl border-2 border-red-50 text-red-500 font-bold hover:bg-red-50 transition-colors"
                >
                  Record Payment Manually
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSettle}
                disabled={saving}
                className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-md transition-all mt-4 ${
                  type === 'pay' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                }`}
              >
                {saving ? 'Processing...' : 'Confirm'}
              </button>
            )}

            <button onClick={onClose} className="mt-4 text-sm font-bold text-slate-400 hover:text-slate-600">
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
