import React, { useMemo, useState } from 'react';
import { ParsedStatement, Transaction } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  ArrowUpCircle, ArrowDownCircle, Wallet, Activity, Search, 
  TrendingUp, TrendingDown, DollarSign, Calendar, Tag 
} from 'lucide-react';

interface DashboardProps {
  data: ParsedStatement;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.summary.currency || 'USD'
    }).format(val);
  };

  // Prepare Chart Data
  const categoryData = useMemo(() => {
    const expenses = data.transactions.filter(t => t.type === 'EXPENSE');
    const categories: Record<string, number> = {};
    expenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories
  }, [data.transactions]);

  const dailyVolume = useMemo(() => {
    const days: Record<string, number> = {};
    data.transactions.forEach(t => {
      // Assuming date is YYYY-MM-DD
      const shortDate = t.date.slice(5); // MM-DD
      days[shortDate] = (days[shortDate] || 0) + t.amount;
    });
    return Object.entries(days).map(([name, amount]) => ({ name, amount }));
  }, [data.transactions]);

  const filteredTransactions = data.transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to get consistent colors for categories
  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200',
      'bg-amber-100 text-amber-700 border-amber-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-cyan-100 text-cyan-700 border-cyan-200',
    ];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Summary Cards - Enhanced UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Income Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Total Income</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2 group-hover:text-emerald-600 transition-colors">
                {formatCurrency(data.summary.totalIncome)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500 group-hover:bg-emerald-100 group-hover:scale-110 transition-all">
              <ArrowUpCircle size={24} />
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Total Expenses</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2 group-hover:text-rose-600 transition-colors">
                {formatCurrency(data.summary.totalExpenses)}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-500 group-hover:bg-rose-100 group-hover:scale-110 transition-all">
              <ArrowDownCircle size={24} />
            </div>
          </div>
        </div>

        {/* Closing Balance Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Closing Balance</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2 group-hover:text-blue-600 transition-colors">
                {formatCurrency(data.summary.closingBalance)}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-500 group-hover:bg-blue-100 group-hover:scale-110 transition-all">
              <Wallet size={24} />
            </div>
          </div>
        </div>

        {/* Net Flow Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
           <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Net Flow</p>
              <h3 className={`text-2xl font-bold mt-2 ${data.summary.totalIncome - data.summary.totalExpenses >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(data.summary.totalIncome - data.summary.totalExpenses)}
              </h3>
            </div>
            <div className={`p-3 rounded-xl transition-all group-hover:scale-110 ${data.summary.totalIncome - data.summary.totalExpenses >= 0 ? 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100' : 'bg-rose-50 text-rose-500 group-hover:bg-rose-100'}`}>
              <Activity size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights - Enhanced */}
      {data.insights.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full opacity-20 -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
          <h4 className="text-indigo-900 font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
            <span className="text-2xl">✨</span> Financial Insights
          </h4>
          <div className="grid md:grid-cols-2 gap-4 relative z-10">
            {data.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-white/60 p-3 rounded-lg border border-indigo-50/50 hover:bg-white transition-colors">
                <div className="mt-1 w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                <p className="text-indigo-900/80 text-sm leading-relaxed font-medium">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96 flex flex-col">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Tag size={18} className="text-blue-500" />
            Top Expense Categories
          </h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Legend iconType="circle" verticalAlign="bottom" height={36} iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96 flex flex-col">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Calendar size={18} className="text-blue-500" />
             Daily Spending Trend
          </h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} tick={{fill: '#94a3b8'}} />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)} 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table - Enhanced UI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <DollarSign size={20} className="text-blue-500" />
            Transactions
          </h4>
          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by merchant or category..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Date</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Description</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Category</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((t, idx) => (
                <tr key={idx} className="bg-white hover:bg-slate-50 transition-colors duration-150 group">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-medium text-xs">
                    {t.date}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-700 font-semibold group-hover:text-slate-900 transition-colors">
                      {t.description}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getCategoryColor(t.category)}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`inline-flex items-center gap-1 font-bold px-3 py-1 rounded-full text-xs ${
                        t.type === 'INCOME' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                      {t.type === 'INCOME' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <Search size={32} className="opacity-20" />
                    <p>No transactions found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;