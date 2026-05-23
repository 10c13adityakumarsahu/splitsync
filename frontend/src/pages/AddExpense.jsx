import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function AddExpense() {
  const navigate = useNavigate();
  const { id: groupId } = useParams();
  const { user } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [splitType, setSplitType] = useState('EQUAL'); // EQUAL, EXACT, PERCENT
  const [paidById, setPaidById] = useState('');
  
  // State for splits
  // For EQUAL: selected member IDs
  const [selectedMembers, setSelectedMembers] = useState([]);
  
  // For EXACT / PERCENT: maps of userId -> value
  const [exactAmounts, setExactAmounts] = useState({});
  const [percentages, setPercentages] = useState({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const { data } = await apiClient.get(`groups/${groupId}/`);
        setGroup(data);
        const memberIds = data.members.map(m => m.user.id);
        setSelectedMembers(memberIds);
        setPaidById(user?.id || '');
        
        // Init empty exact/percent maps
        const initExact = {};
        const initPercent = {};
        memberIds.forEach(id => {
          initExact[id] = '';
          initPercent[id] = '';
        });
        setExactAmounts(initExact);
        setPercentages(initPercent);
        
      } catch (err) {
        console.error(err);
      }
    };
    if (groupId) fetchGroup();
  }, [groupId, user]);

  const toggleMember = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const updateExact = (id, val) => setExactAmounts(prev => ({ ...prev, [id]: val }));
  const updatePercent = (id, val) => setPercentages(prev => ({ ...prev, [id]: val }));

  const totalAmount = parseFloat(amount) || 0;

  // Validation
  const validateSplits = () => {
    if (totalAmount <= 0) return "Please enter a valid amount.";
    if (!description.trim()) return "Please enter a description.";
    
    if (splitType === 'EQUAL') {
      if (selectedMembers.length === 0) return "Select at least one person to split with.";
    } else if (splitType === 'EXACT') {
      let sum = 0;
      Object.values(exactAmounts).forEach(v => { sum += parseFloat(v) || 0; });
      if (Math.abs(sum - totalAmount) > 0.01) {
        return `Exact amounts must add up to ₹${totalAmount.toFixed(2)}. Currently: ₹${sum.toFixed(2)}`;
      }
    } else if (splitType === 'PERCENT') {
      let sum = 0;
      Object.values(percentages).forEach(v => { sum += parseFloat(v) || 0; });
      if (Math.abs(sum - 100) > 0.01) {
        return `Percentages must add up to 100%. Currently: ${sum.toFixed(2)}%`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    setError('');
    const errMsg = validateSplits();
    if (errMsg) {
      setError(errMsg);
      return;
    }

    setSaving(true);
    try {
      // Build splits payload
      const splits = [];
      const numAmount = parseFloat(amount);
      
      group.members.forEach(m => {
        const uid = m.user.id;
        let amount_owed = 0;
        
        if (splitType === 'EQUAL') {
          if (selectedMembers.includes(uid)) {
            amount_owed = numAmount / selectedMembers.length;
          }
        } else if (splitType === 'EXACT') {
          amount_owed = parseFloat(exactAmounts[uid]) || 0;
        } else if (splitType === 'PERCENT') {
          const pct = parseFloat(percentages[uid]) || 0;
          amount_owed = (pct / 100) * numAmount;
        }

        const amount_paid = uid === paidById ? numAmount : 0;
        
        if (amount_owed > 0 || amount_paid > 0) {
          splits.push({
            user_id: uid,
            amount_owed: amount_owed.toFixed(2),
            amount_paid: amount_paid.toFixed(2),
            split_type: splitType
          });
        }
      });

      const payload = {
        title: description,
        description: description,
        amount: numAmount.toFixed(2),
        category: category,
        group: groupId,
        paid_by_id: paidById,
        splits: splits
      };

      await apiClient.post('expenses/', payload);
      navigate(`/groups/${groupId}`);
      
    } catch (err) {
      console.error(err);
      setError('Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };

  if (!group) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 max-w-lg mx-auto flex flex-col">
      <header className="px-4 py-4 flex items-center gap-4 bg-white border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Add Expense</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Amount Input */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
          <p className="text-sm text-slate-500 mb-2 font-medium">How much was spent?</p>
          <div className="flex items-center justify-center text-4xl font-bold text-slate-900">
            <span className="text-slate-400 mr-1">₹</span>
            <input 
              type="number" 
              className="bg-transparent w-full max-w-[200px] outline-none text-center placeholder-slate-300"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Details Input */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
            <input 
              type="text" 
              className="w-full text-lg outline-none placeholder-slate-300 font-medium"
              placeholder="e.g. Dinner, Cab, Groceries"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {['General', 'Food', 'Travel', 'Shopping', 'Utilities'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${category === cat ? 'bg-primary text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Paid By</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={paidById}
              onChange={e => setPaidById(e.target.value)}
            >
              {group.members.map(m => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.id === user?.id ? 'Me' : `${m.user.first_name} ${m.user.last_name}`}
                </option>
              ))}
            </select>
            {paidById !== user?.id && (
              <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                <AlertCircle size={14} /> This expense will require their approval.
              </p>
            )}
          </div>
        </div>

        {/* Split Logic */}
        <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex">
          <button 
            className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all ${splitType === 'EQUAL' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setSplitType('EQUAL')}
          >
            Equally
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all ${splitType === 'EXACT' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setSplitType('EXACT')}
          >
            Exact
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all ${splitType === 'PERCENT' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setSplitType('PERCENT')}
          >
            Percent
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-2 space-y-1">
          {group.members.map(m => {
            const uid = m.user.id;
            const isSelected = selectedMembers.includes(uid);
            
            return (
              <div key={uid} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  {splitType === 'EQUAL' && (
                    <div 
                      onClick={() => toggleMember(uid)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300'}`}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                    {m.user.first_name?.charAt(0) || m.user.email?.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-700">{m.user.id === user?.id ? 'Me' : m.user.first_name}</span>
                </div>
                
                <div className="text-right">
                  {splitType === 'EQUAL' ? (
                    <span className="text-sm font-bold text-slate-700">
                      ₹{isSelected && totalAmount ? (totalAmount / selectedMembers.length).toFixed(2) : '0.00'}
                    </span>
                  ) : splitType === 'EXACT' ? (
                    <div className="flex items-center bg-slate-100 rounded-lg px-3 py-1 w-24">
                      <span className="text-slate-400 text-sm mr-1">₹</span>
                      <input 
                        type="number" 
                        className="bg-transparent w-full text-right outline-none text-sm font-bold"
                        placeholder="0.00"
                        value={exactAmounts[uid] || ''}
                        onChange={e => updateExact(uid, e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center bg-slate-100 rounded-lg px-3 py-1 w-24 justify-end">
                      <input 
                        type="number" 
                        className="bg-transparent w-full text-right outline-none text-sm font-bold pr-1"
                        placeholder="0"
                        value={percentages[uid] || ''}
                        onChange={e => updatePercent(uid, e.target.value)}
                      />
                      <span className="text-slate-400 text-sm">%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 text-center">
            {error}
          </div>
        )}

      </div>

      <div className="p-4 bg-white border-t border-slate-100 z-10 sticky bottom-0">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
        >
          {saving ? 'Saving...' : <><Check size={20} /> Save Expense</>}
        </button>
      </div>
    </div>
  );
}
