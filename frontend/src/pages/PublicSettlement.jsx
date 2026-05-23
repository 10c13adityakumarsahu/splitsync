import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, QrCode } from 'lucide-react';

export default function PublicSettlement() {
  const { token } = useParams();

  // In a real implementation, we would fetch the settlement details using React Query
  // For now, let's use placeholder data
  
  const paymentDetails = {
    amount: "500.00",
    payer: "Rahul",
    receiver: "Aditya",
    upiId: "aditya@okaxis",
    message: "Dinner Split"
  };

  const upiLink = `upi://pay?pa=${paymentDetails.upiId}&pn=${paymentDetails.receiver}&am=${paymentDetails.amount}&tn=${encodeURIComponent(paymentDetails.message)}`;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="bg-primary p-8 text-center text-white">
          <p className="text-primary-100 mb-1">Payment Request</p>
          <h1 className="text-4xl font-bold tracking-tight">₹{paymentDetails.amount}</h1>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-4">
            <span className="text-slate-500">To</span>
            <span className="font-semibold text-slate-900">{paymentDetails.receiver}</span>
          </div>

          <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-4">
            <span className="text-slate-500">From</span>
            <span className="font-semibold text-slate-900">{paymentDetails.payer}</span>
          </div>

          <div className="flex justify-between items-center text-sm pb-2">
            <span className="text-slate-500">UPI ID</span>
            <span className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">{paymentDetails.upiId}</span>
          </div>

          <div className="pt-4 grid gap-3">
            <a 
              href={upiLink}
              className="flex items-center justify-center w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            >
              Pay with UPI App
            </a>

            <button className="flex items-center justify-center w-full py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl active:bg-slate-50 transition-colors">
              <QrCode size={20} className="mr-2" /> Show QR Code
            </button>

            <button className="flex items-center justify-center w-full py-4 mt-4 bg-emerald-50 text-emerald-600 font-bold rounded-2xl active:bg-emerald-100 transition-colors">
              <CheckCircle2 size={20} className="mr-2" /> I Have Paid
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
