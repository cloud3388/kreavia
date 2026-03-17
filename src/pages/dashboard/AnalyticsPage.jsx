import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, ArrowUpRight, Sparkles, Target, Zap, Activity, Eye, Share2, MessageSquare, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie } from 'recharts';


const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-light p-4 rounded-xl shadow-lg backdrop-blur-md">
        <p className="font-headline text-primary font-bold mb-2">{label}</p>
        {payload.map((entry, index) => (
           <p key={index} className="text-xs font-ui flex items-center justify-between gap-6 mb-1">
              <span className="text-muted">{entry.name}:</span>
              <span className="text-primary font-black">{entry.value.toLocaleString()}</span>
           </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsPage = () => {
  const [activeSeries, setActiveSeries] = useState({ views: true, engagement: true });
  const [brandData] = useState(() => {
    const saved = sessionStorage.getItem('currentBrandKit');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });
  const [isLoaded] = useState(true);

  const performanceData = [
    { name: 'Mon', views: 4000, engagement: 240, shares: 120 },
    { name: 'Tue', views: 3000, engagement: 139, shares: 80 },
    { name: 'Wed', views: 2000, engagement: 980, shares: 450 },
    { name: 'Thu', views: 2780, engagement: 390, shares: 190 },
    { name: 'Fri', views: 1890, engagement: 480, shares: 250 },
    { name: 'Sat', views: 2390, engagement: 380, shares: 170 },
    { name: 'Sun', views: 3490, engagement: 430, shares: 210 },
  ];

  const accentColor = brandData?.colors?.accent || '#8D6E63';
  const secondaryColor = brandData?.colors?.secondary || '#3E2723';
  const highlightColor = brandData?.colors?.highlight || '#D7CCC8';

  const contentTypeData = [
    { name: 'Reels', value: 55, color: accentColor },
    { name: 'Carousels', value: 30, color: secondaryColor },
    { name: 'Stories', value: 15, color: highlightColor },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate={isLoaded ? "visible" : "hidden"}
      variants={containerVariants}
      className="flex flex-col gap-6 max-w-[1200px] w-full pb-24"
    >
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 rounded-lg bg-accent/10 text-accent">
               <Activity size={24} />
             </div>
             <h2 className="text-4xl font-headline text-primary font-bold">Creator Analytics</h2>
           </div>
          <p className="text-muted font-medium">Sophisticated insights for your <span className="text-accent font-bold">"{brandData?.brandArchetype || 'Premium'}"</span> brand.</p>
        </div>
        <div className="relative group">
          <select className="appearance-none bg-surface border border-light rounded-xl pl-4 pr-10 py-3 text-sm text-primary font-bold font-ui outline-none cursor-pointer focus:border-accent transition-all shadow-sm w-48">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Month</option>
            <option>All Time</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none group-hover:text-accent transition-colors" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reach', value: '124.5K', icon: <Users size={16} />, trend: '12%', up: true },
          { label: 'Engagement', value: '4.8%', icon: <TrendingUp size={16} />, trend: '0.5%', up: true },
          { label: 'Profile Views', value: '12.1K', icon: <Eye size={16} />, trend: '2%', up: false }
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants} className="glass-card p-8 flex flex-col gap-4 border-none shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
             <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-3xl rounded-full -mr-8 -mt-8"></div>
             <div className="flex justify-between items-center text-muted relative z-10">
               <span className="font-ui text-[10px] uppercase tracking-widest font-black text-muted">{stat.label}</span>
               <div className="p-2.5 bg-accent/10 rounded-xl text-accent group-hover:bg-primary group-hover:text-secondary transition-all duration-300">{stat.icon}</div>
             </div>
             <div className="text-4xl font-headline text-primary font-bold relative z-10">{stat.value}</div>
             <div className={`flex items-center gap-1.5 text-xs font-bold font-ui relative z-10 ${stat.up ? 'text-green-600' : 'text-red-500'}`}>
               {stat.up ? <ArrowUpRight size={14} /> : <TrendingUp size={14} className="rotate-180" />} 
               <span>{stat.trend} increase</span>
             </div>
          </motion.div>
        ))}
        
        <motion.div variants={itemVariants} className="glass-card p-8 flex flex-col gap-4 border-none shadow-[0_10px_30px_rgba(62,39,35,0.05)] relative overflow-hidden group bg-primary text-secondary">
           <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-accent/30 transition-colors"></div>
           <div className="relative z-10 flex justify-between items-center">
             <span className="font-ui text-[10px] uppercase tracking-widest font-black text-accent/80">Brand Score</span>
             <div className="p-2.5 bg-accent/20 rounded-xl text-accent shadow-glow border border-accent/20"><Sparkles size={16} /></div>
           </div>
           <div className="relative z-10 text-5xl font-headline text-white group-hover:scale-105 transition-transform origin-left font-bold">92<span className="text-xl text-accent/60 font-ui ml-1 font-black">/100</span></div>
           <div className="relative z-10 text-xs font-bold font-ui mt-1 text-secondary/60">
             Elite standing in <span className="text-accent">{brandData?.vibe || 'Premium'}</span>.
           </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
         
         {/* Main Activity Chart */}
         <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-6 md:p-8 flex flex-col gap-6 border-light/50">
            <div className="flex justify-between items-center">
               <h3 className="text-lg font-ui font-bold text-white flex items-center gap-2">
                 Performance Analytics
               </h3>
               <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveSeries(prev => ({ ...prev, views: !prev.views }))}
                    className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-opacity ${activeSeries.views ? 'opacity-100' : 'opacity-30'}`}
                  >
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: secondaryColor }}></div>
                     Views
                  </button>
                  <button 
                    onClick={() => setActiveSeries(prev => ({ ...prev, engagement: !prev.engagement }))}
                    className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-opacity ${activeSeries.engagement ? 'opacity-100' : 'opacity-30'}`}
                  >
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }}></div>
                     Engagement
                  </button>
               </div>
            </div>
            
            <div className="h-[300px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.1}/>
                           <stop offset="95%" stopColor={secondaryColor} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor={accentColor} stopOpacity={0.2}/>
                           <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                     <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#888', fontSize: 11, fontFamily: brandData?.typography?.ui || 'Satoshi' }} 
                        dy={10} 
                     />
                     <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#888', fontSize: 11, fontFamily: brandData?.typography?.ui || 'Satoshi' }} 
                     />
                     <Tooltip content={<CustomTooltip brandData={brandData} />} />
                     <Area 
                        type="monotone" 
                        dataKey="views" 
                        stroke={secondaryColor} 
                        strokeWidth={activeSeries.views ? 3 : 0} 
                        fillOpacity={1} 
                        fill="url(#colorViews)" 
                        name="Total Views"
                        hide={!activeSeries.views}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="engagement" 
                        stroke={accentColor} 
                        strokeWidth={activeSeries.engagement ? 3 : 0} 
                        fillOpacity={1} 
                        fill="url(#colorEngagement)" 
                        name="Engagement"
                        hide={!activeSeries.engagement}
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </motion.div>

         {/* Content Mix Pie Chart */}
         <motion.div variants={itemVariants} className="glass-card p-10 flex flex-col gap-8 border-none shadow-sm hover:shadow-md transition-all">
            <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-3">
               Content Strategy
            </h3>
            
            <div className="flex-1 flex flex-col justify-center items-center relative gap-8">
               <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={contentTypeData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                           stroke="none"
                        >
                           {contentTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip brandData={brandData} />} />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               
               {/* Custom Legend */}
               <div className="flex flex-col gap-3 w-full mt-4">
                  {contentTypeData.map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                           <span className="font-ui text-secondary text-xs">{item.name}</span>
                        </div>
                        <span className="font-ui font-bold text-white text-xs">{item.value}%</span>
                     </div>
                  ))}
               </div>
            </div>
         </motion.div>
      </div>

      {/* AI Personal Brand Coach Widget - Horizontal Banner */}
      <motion.div variants={itemVariants} className="mt-4 relative w-full rounded-2xl overflow-hidden border border-accent/30 bg-card group shadow-[0_0_30px_rgba(198,169,107,0.05)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>
        
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-light/50 h-full">
           
           <div className="p-8 lg:w-[340px] flex flex-col items-center justify-center text-center gap-5 shrink-0 bg-gradient-to-br from-primary to-accent/5">
             <div className="w-20 h-20 rounded-full bg-main border border-accent/50 flex items-center justify-center relative shadow-glow">
                <Sparkles size={28} className="text-accent" />
                <div className="absolute -bottom-1 -right-1 bg-accent text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">AI Coach</div>
             </div>
             <div>
               <h3 className="text-xl font-headline text-white mb-1">Coach Insights</h3>
               <p className="text-muted text-sm px-4">AI optimization for your brand archetype.</p>
             </div>
             <button className="btn btn-primary text-sm w-full font-bold h-10 shadow-glow">Ask AI Advisor</button>
           </div>
           
           <div className="p-6 lg:p-8 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                 <div className="p-2 bg-accent/10 rounded-lg text-accent shrink-0"><TrendingUp size={20} /></div>
                 <div>
                    <h4 className="font-ui font-bold text-sm text-white mb-1">Double down on Reels</h4>
                    <p className="text-muted text-xs leading-relaxed">As a <span className="text-accent font-bold">{brandData?.brandArchetype?.split(' ')[0] || 'Premium'}</span> creator, your Reels reached 2x more non-followers. Post similar format this week.</p>
                 </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                 <div className="p-2 bg-highlight/10 rounded-lg text-highlight shrink-0"><Target size={20} /></div>
                 <div>
                    <h4 className="font-ui font-bold text-sm text-white mb-1">Shift posting time</h4>
                    <p className="text-muted text-xs leading-relaxed">Engagement peaks at <span className="text-white">6:00 PM EST</span> for your audience. Your 10 AM posts are underperforming by 15%.</p>
                 </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                 <div className="p-2 bg-secondary/10 rounded-lg text-secondary shrink-0"><MessageSquare size={20} /></div>
                 <div>
                    <h4 className="font-ui font-bold text-sm text-white mb-1">Caption length optimal</h4>
                    <p className="text-muted text-xs leading-relaxed">Short captions (under 50 words) aligned with your <span className="text-white">{brandData?.vibe || 'minimalist'}</span> vibe are driving 30% more saves.</p>
                 </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                 <div className="p-2 bg-green-500/10 rounded-lg text-green-400 shrink-0"><Zap size={20} /></div>
                 <div>
                    <h4 className="font-ui font-bold text-sm text-white mb-1">Conversion is high</h4>
                    <p className="text-muted text-xs leading-relaxed">Profile visits for <span className="text-accent font-bold">{brandData?.brandArchetype || 'your brand'}</span> converted to followers at an impressive 8% rate.</p>
                 </div>
              </div>

           </div>
           
        </div>
      </motion.div>

    </motion.div>
  );
};

export default AnalyticsPage;
