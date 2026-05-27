import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { TrendingUp, Users, DollarSign, Gamepad2 } from 'lucide-react';

const userGrowth = [
  { month: 'Jul', users: 1200 }, { month: 'Aug', users: 2800 }, { month: 'Sep', users: 4500 },
  { month: 'Oct', users: 7200 }, { month: 'Nov', users: 10800 }, { month: 'Dec', users: 14285 },
];

const dailyRevenue = [
  { day: 'Mon', revenue: 48000, bets: 3200 }, { day: 'Tue', revenue: 62000, bets: 4100 },
  { day: 'Wed', revenue: 55000, bets: 3800 }, { day: 'Thu', revenue: 78000, bets: 5200 },
  { day: 'Fri', revenue: 89000, bets: 6100 }, { day: 'Sat', revenue: 105000, bets: 7200 },
  { day: 'Sun', revenue: 92000, bets: 6400 },
];

const gamePerformance = [
  { hour: '6AM', color: 120, ludo: 45 }, { hour: '9AM', color: 340, ludo: 120 },
  { hour: '12PM', color: 680, ludo: 280 }, { hour: '3PM', color: 920, ludo: 380 },
  { hour: '6PM', color: 1240, ludo: 540 }, { hour: '9PM', color: 1580, ludo: 720 },
  { hour: '12AM', color: 890, ludo: 380 },
];

export const AdminAnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-sora text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-cyan-400" /> Analytics
        </h1>
        <p className="text-white/40 text-sm mt-1">Platform performance insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Revenue', value: '₹94,000', change: '+28%', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20' },
          { label: 'New Users (Month)', value: '3,485', change: '+42%', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/20' },
          { label: 'Total Games Played', value: '37,347', change: '+19%', icon: Gamepad2, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
          { label: 'Avg Session Time', value: '24 min', change: '+8%', icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
        ].map((metric, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-4 border border-white/8">
            <div className={`w-9 h-9 rounded-xl ${metric.bg} flex items-center justify-center mb-3`}>
              <metric.icon className={`w-4 h-4 ${metric.color}`} />
            </div>
            <p className={`text-xl font-bold font-sora ${metric.color}`}>{metric.value}</p>
            <p className="text-xs text-white/40 mt-1">{metric.label}</p>
            <p className="text-xs text-green-400 mt-0.5">{metric.change} from last month</p>
          </motion.div>
        ))}
      </div>

      {/* User Growth */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5 border border-white/8">
        <h3 className="font-bold text-white font-sora mb-5 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" /> User Growth
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={userGrowth}>
            <defs>
              <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, color: '#fff' }} />
            <Area type="monotone" dataKey="users" stroke="#a855f7" fill="url(#usersGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Daily Revenue */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5 border border-white/8">
        <h3 className="font-bold text-white font-sora mb-5 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" /> Daily Revenue (This Week)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyRevenue}>
            <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}K`} />
            <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, color: '#fff' }}
              formatter={(v) => [`₹${Number(v).toLocaleString()}`, '']} />
            <Bar dataKey="revenue" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Game Activity */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-5 border border-white/8">
        <h3 className="font-bold text-white font-sora mb-5 flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-cyan-400" /> Hourly Game Activity (Today)
        </h3>
        <div className="flex items-center gap-4 text-xs mb-4">
          <span className="flex items-center gap-1.5 text-purple-400"><span className="w-3 h-0.5 bg-purple-400 block" /> Color Prediction</span>
          <span className="flex items-center gap-1.5 text-cyan-400"><span className="w-3 h-0.5 bg-cyan-400 block" /> Ludo Battle</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={gamePerformance}>
            <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, color: '#fff' }} />
            <Line type="monotone" dataKey="color" stroke="#a855f7" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="ludo" stroke="#06b6d4" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};
