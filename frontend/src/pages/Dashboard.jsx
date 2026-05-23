import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { LogOut, PlusCircle, Users, User, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import CreateGroupModal from '../components/CreateGroupModal';
import AddPersonModal from '../components/AddPersonModal';
import SettleUpModal from '../components/SettleUpModal';
import apiClient from '../api/client';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeTab, setActiveTab] = useState('groups');
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalOwedToMe, setTotalOwedToMe] = useState(0);
  const [contactBalances, setContactBalances] = useState({});
  const [settleTarget, setSettleTarget] = useState(null);

  const fetchData = async () => {
      try {
        const [groupsRes, contactsRes, expensesRes] = await Promise.all([
          apiClient.get('groups/'),
          apiClient.get('contacts/'),
          apiClient.get('expenses/')
        ]);
        setGroups(groupsRes.data);
        
        // Combine explicit contacts and all group members into the People tab
        const uniquePeopleMap = new Map();
        contactsRes.data.forEach(c => {
           uniquePeopleMap.set(c.contact_user.id, c);
        });
        
        groupsRes.data.forEach(g => {
           g.members.forEach(m => {
              if (m.user.id !== user?.id && !uniquePeopleMap.has(m.user.id)) {
                 uniquePeopleMap.set(m.user.id, {
                    id: `group-member-${m.user.id}`,
                    contact_user: m.user
                 });
              }
           });
        });
        
        setContacts(Array.from(uniquePeopleMap.values()));
        
        const cBalances = {};
        
        expensesRes.data.forEach(exp => {
          if (!exp.is_approved) return;
          
          const isPayer = exp.paid_by?.id === user?.id;
          const mySplit = exp.splits?.find(s => s.user?.id === user?.id || s.user === user?.id);
          const myOwedAmount = mySplit ? parseFloat(mySplit.amount_owed) : 0;
          
          if (isPayer) {
            // I paid. Others owe me.
            exp.splits.forEach(s => {
               const sUid = s.user?.id || s.user;
               if (sUid !== user?.id) {
                 const amt = parseFloat(s.amount_owed);
                 cBalances[sUid] = (cBalances[sUid] || 0) + amt;
               }
            });
          } else {
            // Someone else paid. I owe them.
            if (myOwedAmount > 0) {
              const payerId = exp.paid_by?.id;
              cBalances[payerId] = (cBalances[payerId] || 0) - myOwedAmount;
            }
          }
        });
        
        let owe = 0;
        let owedToMe = 0;
        Object.values(cBalances).forEach(bal => {
           if (bal > 0) owedToMe += bal;
           else if (bal < 0) owe += Math.abs(bal);
        });
        
        setContactBalances(cBalances);
        setTotalOwed(owe);
        setTotalOwedToMe(owedToMe);
      } catch (err) {
        console.error('Failed to fetch data');
      }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGroupCreated = (newGroup) => {
    setGroups([newGroup, ...groups]);
  };

  const handlePersonAdded = (newContact) => {
    setContacts([newContact, ...contacts]);
  };

  return (
    <div className="pb-24 max-w-3xl mx-auto md:pt-8 md:px-4">
      {/* Header */}
      <header className="px-6 py-8 bg-white shadow-sm md:rounded-3xl md:border md:border-slate-100 z-10 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-slate-500">Welcome back,</p>
            <h1 className="text-2xl font-bold text-slate-900">{user?.first_name || user?.username}</h1>
          </div>
          <button onClick={logout} className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            <LogOut size={20} />
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-red-50 p-4 rounded-2xl border border-red-100">
            <p className="text-sm text-red-600 mb-1 font-medium">You owe</p>
            <p className="text-2xl font-bold text-red-700">₹{totalOwed.toFixed(2)}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <p className="text-sm text-emerald-600 mb-1 font-medium">You are owed</p>
            <p className="text-2xl font-bold text-emerald-700">₹{totalOwedToMe.toFixed(2)}</p>
          </motion.div>
        </div>
      </header>

      {/* Missing UPI Warning */}
      {!user?.upi_id && (
        <div className="mx-6 mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex gap-3 items-start cursor-pointer" onClick={() => navigate('/profile-setup')}>
          <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-orange-800 font-bold text-sm">Action Required</h3>
            <p className="text-orange-700 text-xs mt-1">Please complete your profile to receive money via UPI.</p>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="px-6 pb-6">
        {activeTab === 'groups' ? (
          <>
            <h2 className="text-lg font-bold mb-4">Your Groups</h2>
            {groups.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>No groups yet. Create one to get started.</p>
              </div>
        ) : (
          <div className="space-y-3">
            {groups.map(g => (
              <Link 
                to={`/groups/${g.id}`} 
                key={g.id} 
                className="block p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-primary/30 transition-colors flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold text-slate-900">{g.name}</h3>
                  {g.description && <p className="text-sm text-slate-500 truncate">{g.description}</p>}
                  <p className="text-xs text-slate-400 mt-1">{g.created_at ? new Date(g.created_at).toLocaleDateString() : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </>
    ) : (
          <>
            <h2 className="text-lg font-bold mb-4">Your People</h2>
            {contacts.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>No saved contacts yet. Add someone to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map(c => {
                  const uid = c.contact_user.id;
                  const bal = contactBalances[uid] || 0;
                  
                  return (
                    <div key={c.id} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-500">
                          {c.contact_user?.first_name?.charAt(0) || c.contact_user?.email?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{c.contact_user?.first_name} {c.contact_user?.last_name}</h3>
                          <p className="text-xs text-slate-500">{c.contact_user?.email}</p>
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col items-end">
                        {bal > 0.01 ? (
                          <>
                            <p className="text-emerald-500 text-xs font-bold mb-1">Owes you ₹{bal.toFixed(2)}</p>
                            <button onClick={() => setSettleTarget({ user: c.contact_user, amount: bal, type: 'receive' })} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">Remind / Received</button>
                          </>
                        ) : bal < -0.01 ? (
                          <>
                            <p className="text-red-500 text-xs font-bold mb-1">You owe ₹{Math.abs(bal).toFixed(2)}</p>
                            <button onClick={() => setSettleTarget({ user: c.contact_user, amount: Math.abs(bal), type: 'pay' })} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">Pay / Settle</button>
                          </>
                        ) : (
                          <p className="text-slate-400 text-xs font-medium">Settled up</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-full shadow-xl border border-slate-100 z-50">
        <button 
          onClick={() => { setActiveTab('groups'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-colors ${activeTab === 'groups' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Users size={24} className={activeTab === 'groups' ? 'drop-shadow-sm' : ''} />
          <span className="text-[10px] mt-1 font-medium">Groups</span>
        </button>
        <button 
          onClick={() => { setActiveTab('people'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-colors ${activeTab === 'people' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <User size={24} className={activeTab === 'people' ? 'drop-shadow-sm' : ''} />
          <span className="text-[10px] mt-1 font-medium">People</span>
        </button>
        
        <div className="px-2">
          <button 
            onClick={() => activeTab === 'groups' ? setIsGroupModalOpen(true) : setIsPersonModalOpen(true)}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/40 hover:scale-105 transition-transform"
          >
            <PlusCircle size={28} />
          </button>
        </div>

        <button 
          onClick={() => navigate('/profile-setup')}
          className="flex flex-col items-center justify-center w-16 h-14 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-600">
            {user?.first_name?.charAt(0) || user?.email?.charAt(0)}
          </div>
          <span className="text-[10px] mt-1 font-medium">Profile</span>
        </button>
      </div>

      <CreateGroupModal 
        isOpen={isGroupModalOpen} 
        onClose={() => setIsGroupModalOpen(false)} 
        onSuccess={handleGroupCreated}
        contacts={contacts} 
      />

      <AddPersonModal 
        isOpen={isPersonModalOpen} 
        onClose={() => setIsPersonModalOpen(false)} 
        onSuccess={handlePersonAdded} 
      />

      <SettleUpModal 
        isOpen={!!settleTarget} 
        onClose={() => setSettleTarget(null)} 
        targetUser={settleTarget?.user} 
        amount={settleTarget?.amount || 0} 
        type={settleTarget?.type} 
        groups={groups} 
        onSuccess={fetchData} 
      />
    </div>
  );
}
