import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Receipt, AlertCircle, Clock, Check, Settings, Coffee, Car, Film, ShoppingBag, Zap, Search, Filter } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import ManageMembersModal from '../components/ManageMembersModal';

export default function GroupDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterWhoPaid, setFilterWhoPaid] = useState('All');
  const [filterStatus, setFilterStatus] = useState('Unsettled');

  const [loading, setLoading] = useState(true);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchGroupData = async () => {
    try {
      const [groupRes, expensesRes, contactsRes] = await Promise.all([
        apiClient.get(`groups/${id}/`),
        apiClient.get(`expenses/?group=${id}`),
        apiClient.get('contacts/')
      ]);
      setGroup(groupRes.data);
      if (expensesRes.data.results) {
        setExpenses(expensesRes.data.results);
        setNextPageUrl(expensesRes.data.next);
      } else {
        setExpenses(expensesRes.data);
      }
      setContacts(contactsRes.data);
    } catch (error) {
      console.error("Failed to fetch group details");
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreExpenses = async () => {
    if (!nextPageUrl) return;
    setLoadingMore(true);
    try {
      // Create a relative URL from the absolute next URL
      const relativeUrl = nextPageUrl.split('/api/')[1];
      const res = await apiClient.get(relativeUrl);
      setExpenses([...expenses, ...res.data.results]);
      setNextPageUrl(res.data.next);
    } catch (error) {
      console.error("Failed to load more expenses", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!group) return <div className="p-8 text-center text-red-500">Group not found</div>;

  const handleApprove = async (expenseId) => {
    try {
      await apiClient.post(`expenses/${expenseId}/approve/`);
      setExpenses(expenses.map(e => e.id === expenseId ? { ...e, is_approved: true } : e));
    } catch (err) {
      console.error(err);
      alert('Failed to approve expense');
    }
  };

  const handleDecline = async (expenseId) => {
    try {
      if (!window.confirm('Are you sure you want to decline this expense?')) return;
      await apiClient.post(`expenses/${expenseId}/decline/`);
      setExpenses(expenses.map(e => e.id === expenseId ? { ...e, is_approved: false } : e));
    } catch (err) {
      console.error(err);
      alert('Failed to decline expense');
    }
  };

  const handleDelete = async (expenseId) => {
    try {
      if (!window.confirm('Are you sure you want to delete this expense?')) return;
      await apiClient.delete(`expenses/${expenseId}/`);
      setExpenses(expenses.filter(e => e.id !== expenseId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete expense');
    }
  };

  const totalExpenses = expenses
    .filter(exp => exp.is_approved && exp.category !== 'Settlement')
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2);
    
  const filteredExpenses = expenses.filter(exp => {
    // Search
    if (searchQuery && !exp.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    // Category
    if (filterCategory !== 'All' && exp.category !== filterCategory) return false;
    // Who Paid
    if (filterWhoPaid === 'You' && exp.paid_by?.id !== user?.id) return false;
    if (filterWhoPaid === 'Others' && exp.paid_by?.id === user?.id) return false;
    // Status
    if (filterStatus === 'Settled' && !exp.is_approved) return false;
    if (filterStatus === 'Unsettled' && exp.is_approved) return false;
    return true;
  });

  const getCategoryIcon = (cat) => {
    switch(cat) {
      case 'Food': return <Coffee size={24} />;
      case 'Travel': return <Car size={24} />;
      case 'Entertainment': return <Film size={24} />;
      case 'Shopping': return <ShoppingBag size={24} />;
      case 'Utilities': return <Zap size={24} />;
      default: return <Receipt size={24} />;
    }
  };

  const getUserStake = (expense) => {
    const isPayer = expense.paid_by?.id === user?.id;
    const mySplit = expense.splits?.find(s => s.user?.id === user?.id || s.user === user?.id);
    const myOwed = mySplit ? parseFloat(mySplit.amount_owed) : 0;
    
    if (expense.category === 'Settlement') {
      if (isPayer) {
        return { type: 'settlement', text: 'You paid', amount: parseFloat(expense.amount), color: 'text-emerald-500', bg: 'bg-emerald-50' };
      } else {
        return { type: 'settlement', text: 'You received', amount: parseFloat(expense.amount), color: 'text-slate-500', bg: 'bg-slate-50' };
      }
    }
    
    if (isPayer) {
      const amountLent = parseFloat(expense.amount) - myOwed;
      if (amountLent > 0) return { type: 'lent', text: 'You lent', amount: amountLent, color: 'text-emerald-500', bg: 'bg-emerald-50' };
      return { type: 'neutral', text: 'You paid your share', amount: 0, color: 'text-slate-500', bg: 'bg-slate-50' };
    } else {
      if (myOwed > 0) return { type: 'borrowed', text: 'You borrowed', amount: myOwed, color: 'text-red-500', bg: 'bg-red-50' };
      return { type: 'neutral', text: 'Not involved', amount: 0, color: 'text-slate-400', bg: 'bg-slate-50' };
    }
  };

  return (
    <div className="pb-24 max-w-lg mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="px-4 py-6 bg-white sticky top-0 z-10 border-b border-slate-100 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{group.name}</h1>
          <button 
            onClick={() => setIsManageModalOpen(true)}
            className="text-sm text-slate-500 flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Users size={14} /> {group.members?.length || 0} members <Settings size={12} className="ml-1" />
          </button>
        </div>
      </header>

      {/* Summary Card */}
      <div className="p-4">
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gradient-to-br from-primary to-emerald-700 text-white p-6 rounded-3xl shadow-xl shadow-primary/20">
          <p className="text-primary-100 text-sm mb-1">Total Group Expenses</p>
          <h2 className="text-3xl font-bold">₹{totalExpenses}</h2>
          
          <div className="mt-6 flex gap-3">
            <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md py-2 px-4 rounded-xl text-sm font-medium transition-colors">
              Settle Up
            </button>
            <button className="flex-1 bg-white text-primary hover:bg-slate-50 py-2 px-4 rounded-xl text-sm font-medium transition-colors">
              Balances
            </button>
          </div>
        </motion.div>
      </div>

      {/* Expenses List */}
      <div className="px-4 mt-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Expenses</h3>
        </div>

        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="input-field pl-10 bg-white m-0 h-full"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-xl flex items-center justify-center border transition-colors ${showFilters ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <Filter size={20} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'General', 'Food', 'Travel', 'Shopping', 'Utilities'].map(cat => (
                      <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCategory === cat ? 'bg-primary text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Who Paid</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={filterWhoPaid} onChange={e => setFilterWhoPaid(e.target.value)}>
                      <option value="All">Anyone</option>
                      <option value="You">You</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Status</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                      <option value="All">All Statuses</option>
                      <option value="Settled">Settled</option>
                      <option value="Unsettled">Pending</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="space-y-3">
          {filteredExpenses.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No expenses found matching filters.</p>
          ) : (
            filteredExpenses.map((expense, i) => {
              const stake = getUserStake(expense);
              return (
                <motion.div 
                  key={expense.id}
                  initial={{ y: 10, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }} 
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      {getCategoryIcon(expense.category)}
                    </div>
                    <div>
                      {expense.category === 'Settlement' ? (
                        <>
                          <p className="font-semibold text-slate-900 line-clamp-1">Payment</p>
                          <p className="text-xs text-slate-500">
                            {expense.paid_by?.id === user?.id ? 'You' : (expense.paid_by?.first_name || 'Someone')} 
                            {' '}paid{' '}
                            {expense.splits[0]?.user?.id === user?.id ? 'you' : (expense.splits[0]?.user?.first_name || 'someone')}
                            {' '}₹{expense.amount}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-slate-900 line-clamp-1">{expense.description}</p>
                          <p className="text-xs text-slate-500">
                            {expense.paid_by?.id === user?.id ? 'You paid' : `${expense.paid_by?.first_name || 'Someone'} paid`} 
                            {' '}₹{expense.amount}
                          </p>
                        </>
                      )}
                      
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(expense.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {!expense.is_approved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 text-[10px] font-bold border border-orange-100">
                            <Clock size={10} /> Pending
                          </span>
                        )}
                        {!expense.is_approved && expense.paid_by?.id === user?.id && (
                          <button 
                            onClick={() => handleApprove(expense.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[10px] font-bold border border-emerald-100 transition-colors"
                          >
                            <Check size={10} /> Approve
                          </button>
                        )}
                        {expense.creator?.id === user?.id && expense.is_approved && expense.category !== 'Settlement' && (
                          <button 
                            onClick={() => handleDecline(expense.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 text-[10px] font-bold border border-orange-100 transition-colors"
                          >
                            Decline
                          </button>
                        )}
                        {expense.creator?.id === user?.id && (
                          <button 
                            onClick={() => handleDelete(expense.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-bold border border-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    <p className={`text-xs font-medium mb-0.5 ${stake.color}`}>{stake.text}</p>
                    {stake.amount > 0 && <p className={`font-bold ${stake.color}`}>₹{stake.amount.toFixed(2)}</p>}
                    {!expense.is_approved && <p className="text-[10px] text-slate-400 mt-1">unsettled</p>}
                  </div>
                </motion.div>
              );
            })
          )}
          
          {nextPageUrl && (
            <div className="text-center pt-4 pb-8">
              <button 
                onClick={fetchMoreExpenses}
                disabled={loadingMore}
                className="px-6 py-2 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More Transactions'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl shadow-slate-900/30"
          onClick={() => navigate(`/groups/${id}/add-expense`)}
        >
          <Receipt size={24} />
        </motion.button>
      </div>

      <ManageMembersModal 
        isOpen={isManageModalOpen} 
        onClose={() => setIsManageModalOpen(false)} 
        group={group} 
        contacts={contacts} 
        onUpdate={fetchGroupData} 
      />
    </div>
  );
}
