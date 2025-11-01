import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  LogOut,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Droplets,
  Database,
  Info
} from 'lucide-react';
import { seedDashboardData } from '../utils/seedStateStreetData';
import { MetricDetailModal } from './MetricDetailModal';

interface Account {
  id: string;
  name: string;
  account_type: string;
  currency: string;
  current_balance: number;
  institution: string | null;
  is_active: boolean;
}

interface Transaction {
  id: string;
  account_id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: string;
  category: string | null;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showMetricDetail, setShowMetricDetail] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [accountsResult, transactionsResult] = await Promise.all([
      supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(10)
    ]);

    console.log('Dashboard data loaded:', {
      accounts: accountsResult.data?.length || 0,
      transactions: transactionsResult.data?.length || 0
    });

    if (accountsResult.data) setAccounts(accountsResult.data);
    if (transactionsResult.data) setTransactions(transactionsResult.data);
    setLoading(false);
  };

  const handleSeedData = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      const result = await seedDashboardData(user.id);
      if (result.success) {
        await loadData();
        alert('Sample data loaded successfully!');
      } else {
        console.error('Seed error:', result.error);
        alert('Error loading data. Check console for details.');
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Error loading data. Check console for details.');
    }
    setSeeding(false);
  };

  const totalAssets = accounts
    .filter(acc => ['checking', 'savings', 'investment'].includes(acc.account_type))
    .reduce((sum, acc) => sum + acc.current_balance, 0);

  const totalLiabilities = accounts
    .filter(acc => ['credit', 'loan'].includes(acc.account_type))
    .reduce((sum, acc) => sum + Math.abs(acc.current_balance), 0);

  const netLiquidity = totalAssets - totalLiabilities;

  const recentInflow = transactions
    .filter(t => t.amount > 0)
    .slice(0, 5)
    .reduce((sum, t) => sum + t.amount, 0);

  const recentOutflow = transactions
    .filter(t => t.amount < 0)
    .slice(0, 5)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-600">Overview of your liquidity position</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {accounts.length === 0 && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-2">No Data Found</h3>
              <p className="text-sm text-slate-600 mb-4">
                Load sample accounts and transactions to explore the dashboard features.
              </p>
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Database className="w-4 h-4" />
                {seeding ? 'Loading Data...' : 'Load Sample Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => setShowMetricDetail('assets')}
            className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600 mb-1">Total Assets</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalAssets)}</p>
          </button>

          <button
            onClick={() => setShowMetricDetail('liabilities')}
            className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600 mb-1">Total Liabilities</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalLiabilities)}</p>
          </button>

          <button
            onClick={() => setShowMetricDetail('liquidity')}
            className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600 mb-1">Net Liquidity</p>
            <p className={`text-2xl font-bold ${netLiquidity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netLiquidity)}
            </p>
          </button>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Wallet className="w-5 h-5 text-slate-600" />
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">Active Accounts</p>
            <p className="text-2xl font-bold text-slate-900">{accounts.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Accounts</h2>
                <button
                  onClick={() => setShowAccountModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Account
                </button>
              </div>
            </div>
            <div className="p-6">
              {accounts.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No accounts yet. Add your first account to get started.</p>
              ) : (
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{account.name}</p>
                        <p className="text-sm text-slate-600 capitalize">{account.account_type}</p>
                        {account.institution && (
                          <p className="text-xs text-slate-500 mt-1">{account.institution}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${account.current_balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                          {formatCurrency(account.current_balance)}
                        </p>
                        <p className="text-xs text-slate-500">{account.currency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
                <button
                  onClick={() => setShowTransactionModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Transaction
                </button>
              </div>
            </div>
            <div className="p-6">
              {transactions.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No transactions yet. Add a transaction to track your cash flow.</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${transaction.amount >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                          {transaction.amount >= 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{transaction.description}</p>
                          <p className="text-xs text-slate-500">{formatDate(transaction.transaction_date)}</p>
                        </div>
                      </div>
                      <p className={`font-semibold text-sm ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Cash Flow Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowUpRight className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Recent Inflow</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(recentInflow)}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">Last 5 incoming transactions</p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ArrowDownRight className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Recent Outflow</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(recentOutflow)}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">Last 5 outgoing transactions</p>
            </div>
          </div>
        </div>
      </div>

      {showAccountModal && (
        <AccountModal
          onClose={() => setShowAccountModal(false)}
          onSuccess={() => {
            setShowAccountModal(false);
            loadData();
          }}
        />
      )}

      {showTransactionModal && (
        <TransactionModal
          accounts={accounts}
          onClose={() => setShowTransactionModal(false)}
          onSuccess={() => {
            setShowTransactionModal(false);
            loadData();
          }}
        />
      )}

      {showMetricDetail && (
        <MetricDetailModal
          metric={showMetricDetail}
          value={
            showMetricDetail === 'assets' ? totalAssets :
            showMetricDetail === 'liabilities' ? totalLiabilities :
            netLiquidity
          }
          onClose={() => setShowMetricDetail(null)}
        />
      )}
    </div>
  );
}

function AccountModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    account_type: 'checking',
    currency: 'USD',
    current_balance: '',
    institution: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from('accounts').insert({
      user_id: user.id,
      name: formData.name,
      account_type: formData.account_type,
      currency: formData.currency,
      current_balance: parseFloat(formData.current_balance) || 0,
      institution: formData.institution || null,
    });

    setLoading(false);
    if (!error) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Account Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Main Checking"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Account Type</label>
            <select
              value={formData.account_type}
              onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
              <option value="credit">Credit</option>
              <option value="loan">Loan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Current Balance</label>
            <input
              type="number"
              step="0.01"
              value={formData.current_balance}
              onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Institution</label>
            <input
              type="text"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Bank of America"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TransactionModal({
  accounts,
  onClose,
  onSuccess
}: {
  accounts: Account[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    account_id: '',
    description: '',
    amount: '',
    transaction_type: 'deposit',
    transaction_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.account_id) return;

    setLoading(true);
    const amount = parseFloat(formData.amount);
    const adjustedAmount = formData.transaction_type === 'withdrawal' ? -Math.abs(amount) : Math.abs(amount);

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: formData.account_id,
      description: formData.description,
      amount: adjustedAmount,
      transaction_type: formData.transaction_type,
      transaction_date: formData.transaction_date,
    });

    if (!error) {
      const selectedAccount = accounts.find(acc => acc.id === formData.account_id);
      if (selectedAccount) {
        await supabase
          .from('accounts')
          .update({ current_balance: selectedAccount.current_balance + adjustedAmount })
          .eq('id', formData.account_id);
      }
    }

    setLoading(false);
    if (!error) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Add Transaction</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Account</label>
            <select
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.account_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Transaction Type</label>
            <select
              value={formData.transaction_type}
              onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="fee">Fee</option>
              <option value="interest">Interest</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Salary payment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
