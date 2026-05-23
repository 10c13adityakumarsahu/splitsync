import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, AlertTriangle } from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ManageMembersModal({ isOpen, onClose, group, contacts, onUpdate }) {
  const { user } = useAuth();
  const [removingId, setRemovingId] = useState(null);
  const [warningMsg, setWarningMsg] = useState('');
  const [balanceToTransfer, setBalanceToTransfer] = useState(0);
  const [addingId, setAddingId] = useState(null);

  if (!isOpen || !group) return null;

  const handleRemoveClick = async (memberUserId) => {
    setRemovingId(memberUserId);
    setWarningMsg('');
    try {
      const res = await apiClient.get(`groups/${group.id}/member_balance/?user_id=${memberUserId}`);
      const balance = parseFloat(res.data.balance);
      
      if (balance !== 0) {
        setBalanceToTransfer(balance);
        setWarningMsg(`This user has an unsettled balance of ₹${Math.abs(balance).toFixed(2)} in this group. If you remove them, this balance will be transferred to YOU. Are you sure you want to proceed?`);
      } else {
        // Direct remove if 0 balance
        await confirmRemove(memberUserId, false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to check member balance.');
      setRemovingId(null);
    }
  };

  const confirmRemove = async (memberUserId, confirmTransfer) => {
    try {
      await apiClient.post(`groups/${group.id}/remove_member/`, {
        user_id: memberUserId,
        confirm_transfer: confirmTransfer
      });
      onUpdate();
      setRemovingId(null);
      setWarningMsg('');
    } catch (err) {
      console.error(err);
      alert('Failed to remove member.');
    }
  };

  const handleAddMember = async (contactUserId) => {
    setAddingId(contactUserId);
    try {
      await apiClient.post(`groups/${group.id}/add_member/`, {
        user_id: contactUserId
      });
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Failed to add member.');
    } finally {
      setAddingId(null);
    }
  };

  const groupMemberIds = group.members.map(m => m.user.id);
  const availableContacts = contacts.filter(c => !groupMemberIds.includes(c.contact_user.id));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-bold">Manage Members</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            {warningMsg && removingId && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-orange-500 shrink-0" size={24} />
                  <div>
                    <p className="text-orange-800 text-sm font-medium">{warningMsg}</p>
                    <div className="mt-4 flex gap-3">
                      <button 
                        onClick={() => { setWarningMsg(''); setRemovingId(null); }}
                        className="flex-1 py-2 bg-white text-slate-600 rounded-lg text-sm border border-slate-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => confirmRemove(removingId, true)}
                        className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold shadow-md shadow-orange-500/20"
                      >
                        Yes, Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Current Members</h3>
              <div className="space-y-2">
                {group.members.map(m => (
                  <div key={m.user.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">{m.user.id === user?.id ? 'You' : `${m.user.first_name} ${m.user.last_name}`}</p>
                      <p className="text-xs text-slate-500">{m.user.email}</p>
                    </div>
                    {m.user.id !== user?.id && (
                      <button 
                        onClick={() => handleRemoveClick(m.user.id)}
                        disabled={removingId === m.user.id}
                        className="text-red-500 text-xs font-bold px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {removingId === m.user.id && !warningMsg ? '...' : 'Remove'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Add from Contacts</h3>
              {availableContacts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                  No more contacts to add. Go to the People tab to add friends!
                </p>
              ) : (
                <div className="space-y-2">
                  {availableContacts.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 hover:border-primary/30 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-900">{c.contact_user.first_name} {c.contact_user.last_name}</p>
                        <p className="text-xs text-slate-500">{c.contact_user.email}</p>
                      </div>
                      <button 
                        onClick={() => handleAddMember(c.contact_user.id)}
                        disabled={addingId === c.contact_user.id}
                        className="text-primary text-xs font-bold px-3 py-1.5 bg-primary/5 hover:bg-primary/10 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <UserPlus size={14} /> Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
