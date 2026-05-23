import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus } from 'lucide-react';
import apiClient from '../api/client';

export default function CreateGroupModal({ isOpen, onClose, onSuccess, contacts = [] }) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [creating, setCreating] = useState(false);

  const toggleUser = (user) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUsers.length === 0) {
      alert('Please enter a group name and add at least one person.');
      return;
    }
    
    setCreating(true);
    try {
      // Create Group
      const { data: group } = await apiClient.post('groups/', { 
        name: groupName,
        description: description 
      });
      
      // Add members
      for (const user of selectedUsers) {
        await apiClient.post(`groups/${group.id}/add_member/`, {
          user_id: user.id
        });
      }
      
      onSuccess(group);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-bold">Create Group</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="e.g. Goa Trip, Apartment Rent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description (Optional)
              </label>
              <textarea 
                className="input-field resize-none h-20" 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this group for?"
              ></textarea>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Add People</label>
              <p className="text-xs text-slate-500 mb-3">
                Select from your saved contacts. To add someone new, go to the People tab first.
              </p>

              {contacts.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-sm text-slate-500 border border-slate-100">
                  You have no contacts yet. Please add them from the People tab.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {contacts.map(c => {
                    const isSelected = selectedUsers.find(u => u.id === c.contact_user.id);
                    return (
                      <div 
                        key={c.id} 
                        onClick={() => toggleUser(c.contact_user)}
                        className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:border-emerald-100'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{c.contact_user.first_name} {c.contact_user.last_name}</p>
                          <p className="text-xs text-slate-500">{c.contact_user.email}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><path d="M20 6L9 17l-5-5"/></svg>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedUsers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Selected ({selectedUsers.length})</h3>
                <div className="space-y-2">
                  {selectedUsers.map(u => (
                    <div key={u.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                      <span className="text-sm">{u.email}</span>
                      <button onClick={() => toggleUser(u)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={handleSubmit}
              disabled={creating || !groupName || selectedUsers.length === 0}
              className="btn-primary w-full"
            >
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
