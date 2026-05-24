import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import apiClient from '../api/client';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    phone_number: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const password = formData.password;
  const passwordCriteria = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains an uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains a special character', met: /[^A-Za-z0-9]/.test(password) }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordCriteria.every(c => c.met)) {
      alert('Please meet all password requirements');
      return;
    }
    try {
      await apiClient.post('auth/register/', formData);
      await login(formData.email, formData.password);
      navigate('/profile-setup');
    } catch (error) {
      console.error('Signup failed', error);
      alert('Signup failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create an Account</h1>
          <p className="text-slate-500">Join SplitSync today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input 
                name="first_name"
                type="text" 
                className="input-field" 
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input 
                name="last_name"
                type="text" 
                className="input-field" 
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email address <span className="text-red-500">*</span>
            </label>
            <input 
              name="email"
              type="email" 
              className="input-field" 
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input 
              name="phone_number"
              type="tel" 
              className="input-field" 
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input 
                name="password"
                type={showPassword ? "text" : "password"} 
                className="input-field pr-12"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password Requirements</p>
            {passwordCriteria.map((criterion, idx) => (
              <div key={idx} className="flex items-center text-sm">
                {criterion.met ? (
                  <CheckCircle2 size={16} className="text-emerald-500 mr-2" />
                ) : (
                  <Circle size={16} className="text-slate-300 mr-2" />
                )}
                <span className={criterion.met ? "text-slate-700" : "text-slate-500"}>
                  {criterion.label}
                </span>
              </div>
            ))}
          </div>

          <button type="submit" className="btn-primary w-full mt-6" disabled={!passwordCriteria.every(c => c.met)}>
            Sign Up
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-primary font-bold">Log In</Link>
        </div>
      </motion.div>
    </div>
  );
}
