import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, ArrowUpRight, Sparkles, Target, Zap, Activity, Eye, Info, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

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
    return { brandName: 'Kreavia', vibe: 'Premium', colors: { primary: '#1A1A1A', accent: '#C6A96B' } };

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

  const accentColor = brandData?.colors?.accent || '#C6A96B';
  const secondaryColor = brandData?.colors?.primary || '#1A1A1A';
  const highlightColor = brandData?.colors?.highlight || '#F5F5F7';

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
             <div className="p-2 rounded-xl bg-accent/10 text-accent">
               <Activity size={24} />
             </div>
             <h2 className="text-4xl font-headline text-primary font-bold">Demo Insights</h2>
           </div>
          <p className="text-muted font-medium flex items-center gap-2">
             Sophisticated insights for your <span className="text-accent font-bold">"{brandData?.brandArchetype || 'Premium'}"</span> brand.
             <span className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-highlight rounded-full text-[10px] font-bold uppercase tracking-widest border border-light/50">
               <Info size={12} /> Sample Data
             </span>
          </p>
        </div>
        <div className="relative group">
          <select className="appearance-none bg-surface border border-light rounded-xl pl-4 pr-10 py-3 text-sm text-primary font-bold font-ui outline-none cursor-pointer focus:border-accent transition-all shadow-sm w-48">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
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
          <motion.div key={idx} variants={itemVariants} className="glass-card p-8 flex flex-col gap-4 bg-surface border border-light shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
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
        
        <motion.div variants={itemVariants} className="glass-card p-8 flex flex-col gap-4 border-none shadow-lg relative overflow-hidden group bg-primary">
           <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-accent/30 transition-colors"></div>
           <div className="relative z-10 flex justify-between items-center">
             <span className="font-ui text-[10px] uppercase tracking-widest font-black text-accent/80">Brand Score</span>
             <div className="p-2.5 bg-accent/20 rounded-xl text-accent border border-accent/20"><Sparkles size={16} /></div>
           </div>
           <div className="relative z-10 text-5xl font-headline text-primary group-hover:scale-105 transition-transform origin-left font-bold">92<span className="text-xl text-accent/60 font-ui ml-1 font-black">/100</span></div>
           <div className="relative z-10 text-xs font-bold font-ui mt-1 text-primary/60">
             Elite standing in <span className="text-accent">{brandData?.vibe || 'Premium'}</span>.
           </div>
        </motion.div>
      </div>

      <div className="bg-highlight/50 border border-light/50 p-4 rounded-2xl flex items-center justify-center gap-4 text-xs font-bold text-muted mb-4">
          <Info size={16} className="text-accent" />
          <span>Note: This page currently displays sample data for preview purposes. Digital insights are simulated based on your brand archetype.</span>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
         
         {/* Main Activity Chart */}
         <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-6 md:p-8 flex flex-col gap-6 bg-surface border border-light">
            <div className="flex justify-between items-center">
               <h3 className="text-lg font-headline font-bold text-primary">
                 Performance Analytics
               </h3>
               <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveSeries(prev => ({ ...prev, views: !prev.views }))}
                    className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-opacity ${activeSeries.views ? 'opacity-100' : 'opacity-30'}`}
                  >
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: secondaryColor }}></div>
                     <span className="text-primary">Views</span>
                  </button>
                  <button 
                    onClick={() => setActiveSeries(prev => ({ ...prev, engagement: !prev.engagement }))}
                    className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-opacity ${activeSeries.engagement ? 'opacity-100' : 'opacity-30'}`}
                  >
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }}></div>
                     <span className="text-primary">Engagement</span>
                  </button>
               </div>
            </div>
            
            <div className="h-[300px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.05}/>
                           <stop offset="95%" stopColor={secondaryColor} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor={accentColor} stopOpacity={0.1}/>
                           <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000008" />
                     <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#888', fontSize: 11, fontFamily: 'Satoshi' }} 
                        dy={10} 
                     />
                     <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#888', fontSize: 11, fontFamily: 'Satoshi' }} 
                     />
                     <Tooltip content={<CustomTooltip />} />
                     <Area 
                        type="monotone" 
                        dataKey="views" 
                        stroke={secondaryColor} 
                        strokeWidth={activeSeries.views ? 2 : 0} 
                        fillOpacity={1} 
                        fill="url(#colorViews)" 
                        name="Total Views"
                        hide={!activeSeries.views}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="engagement" 
                        stroke={accentColor} 
                        strokeWidth={activeSeries.engagement ? 2 : 0} 
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
         <motion.div variants={itemVariants} className="glass-card p-10 flex flex-col gap-8 bg-surface border border-light">
            <h3 className="text-2xl font-headline font-bold text-primary">
               Content Strategy
            </h3>
            
            <div className="flex-1 flex flex-col justify-center items-center relative gap-8">
               <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={contentTypeData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={8}
                           dataKey="value"
                           stroke="none"
                        >
                           {contentTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               
               {/* Custom Legend */}
               <div className="flex flex-col gap-3 w-full mt-2">
                  {contentTypeData.map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                           <span className="font-ui text-primary/70 text-xs font-bold">{item.name}</span>
                        </div>
                        <span className="font-ui font-black text-primary text-xs">{item.value}%</span>
                     </div>
                  ))}
               </div>
            </div>
         </motion.div>
      </div>

    </motion.div>
  );
};

export default AnalyticsPage;
