import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Receipt, Users, ShieldCheck } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="p-6 flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="text-2xl font-bold text-primary tracking-tight">SplitSync</div>
        <div className="flex gap-4">
          <Link to="/login" className="px-5 py-2 text-slate-600 font-medium hover:text-slate-900 transition-colors">Log In</Link>
          <Link to="/signup" className="px-5 py-2 bg-primary text-white font-medium rounded-xl shadow-lg shadow-primary/30 hover:scale-105 transition-transform">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-3xl mx-auto mt-12 mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 font-medium text-sm mb-6 border border-slate-200">
            A simpler way to manage shared expenses
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
            Share expenses, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
              without the tension.
            </span>
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-xl mx-auto">
            SplitSync keeps track of your shared costs and helps everyone settle up directly using secure UPI links. No middlemen, no hidden fees, just straightforward sharing.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              Get Started for Free <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <div className="grid sm:grid-cols-3 gap-8 mt-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Create Groups</h3>
            <p className="text-slate-500 text-sm">Organize trips, apartments, or dinners easily with the people you care about.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100"
          >
            <div className="w-12 h-12 bg-emerald-50 text-primary rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Receipt size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Track Expenses</h3>
            <p className="text-slate-500 text-sm">Split costs equally, specify exact amounts, or use percentages to ensure fairness.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Settle with UPI</h3>
            <p className="text-slate-500 text-sm">Generate smart UPI links so friends can pay you directly to your bank account.</p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
