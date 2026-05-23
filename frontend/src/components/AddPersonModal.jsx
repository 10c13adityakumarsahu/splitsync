import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus } from 'lucide-react';
import apiClient from '../api/client';

export default function AddPersonModal({ isOpen, onClose, onSuccess }) {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    
    setSearchLoading(true);
    setSearchResults(null);
    try {
      const { data } = await apiClient.get(`users/search/?email=${encodeURIComponent(searchEmail)}`);
      setSearchResults(data);
    } catch (error) {
      if (error.response?.status === 404) {
        setSearchResults({ error: 'User not found.' });
      } else if (error.response?.status === 400) {
        setSearchResults({ error: error.response.data.error });
      } else {
        setSearchResults({ error: 'Search failed.' });
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddPerson = async (user) => {
    setAdding(true);
    try {
      const { data } = await apiClient.post('contacts/', { contact_user_id: user.id });
      onSuccess(data);
      onClose();
    } catch (error) {
      console.error('Failed to add contact', error);
      alert('Failed to add person.');
    } finally {
      setAdding(false);
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
            <h2 className="text-xl font-bold">Add Person</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input 
                type="email" 
                className="input-field" 
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                placeholder="Search by email..."
              />
              <button type="submit" disabled={searchLoading} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200">
                <Search size={20} />
              </button>
            </form>

            {searchLoading && <p className="text-sm text-slate-500 text-center py-4">Searching...</p>}
            
            {searchResults && !searchResults.error && (
              <div className="mt-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-900">{searchResults.first_name} {searchResults.last_name}</p>
                  <p className="text-sm text-slate-500">{searchResults.email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    UPI: <span className="font-mono bg-white px-1.5 py-0.5 rounded text-emerald-700">{searchResults.upi_id}</span>
                  </p>
                </div>
                <button 
                  onClick={() => handleAddPerson(searchResults)}
                  disabled={adding}
                  className="p-3 bg-primary text-white hover:bg-emerald-600 rounded-xl shadow-sm transition-colors"
                >
                  <UserPlus size={20} />
                </button>
              </div>
            )}

            {searchResults?.error && (
              <p className="text-sm text-red-500 text-center py-4">{searchResults.error}</p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
