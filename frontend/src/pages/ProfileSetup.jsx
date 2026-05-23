import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { motion } from 'framer-motion';
import { Wallet, X } from 'lucide-react';

export default function ProfileSetup() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    upi_id: user?.upi_id || '',
    upi_number: user?.upi_number || '',
    preferred_upi_app: user?.preferred_upi_app || 'gpay'
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.patch('users/profile/', formData);
      await refreshUser();
      navigate('/');
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Failed to save profile details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 w-full max-w-md relative"
      >
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Complete Your Profile</h2>
          <p className="text-slate-500">We need your UPI details so friends can pay you directly for shared expenses.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              UPI ID <span className="text-red-500">*</span>
            </label>
            <input 
              name="upi_id"
              type="text" 
              className="input-field" 
              value={formData.upi_id}
              onChange={handleChange}
              placeholder="e.g. name@okaxis"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              UPI Number (Optional)
            </label>
            <input 
              name="upi_number"
              type="text" 
              className="input-field" 
              value={formData.upi_number}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Frequently Used UPI App <span className="text-red-500">*</span>
            </label>
            <select 
              name="preferred_upi_app" 
              className="input-field"
              value={formData.preferred_upi_app}
              onChange={handleChange}
              required
            >
              <option value="gpay">Google Pay</option>
              <option value="phonepe">PhonePe</option>
              <option value="paytm">Paytm</option>
              <option value="cred">CRED</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
