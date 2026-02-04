import React, { useEffect, useState } from 'react';
import { getActivityStats } from '../lib/api';
import { motion } from 'framer-motion';

export default function ActivityHeatmap() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getActivityStats();
                setActivities(data);
            } catch (error) {
                console.error('Failed to fetch activity stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Generate the last 112 days (16 weeks) to display
    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 111; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    };

    const dates = generateDates();

    const getIntensity = (date) => {
        const activity = activities.find((a) => a.date === date);
        if (!activity) return 0;

        const minutes = activity.totalSeconds / 60;
        if (minutes === 0) return 0;
        if (minutes < 15) return 1;
        if (minutes < 30) return 2;
        if (minutes < 60) return 3;
        return 4;
    };

    const colors = [
        'bg-slate-800/50', // Level 0
        'bg-emerald-900/50', // Level 1
        'bg-emerald-700/70', // Level 2
        'bg-emerald-500',    // Level 3
        'bg-emerald-400',    // Level 4
    ];

    if (loading) {
        return <div className="h-32 w-full animate-pulse bg-slate-800/50 rounded-xl" />;
    }

    return (
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl w-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Study Consistency
                </h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span>Less</span>
                    {colors.map((c, i) => (
                        <div key={i} className={`w-2 h-2 rounded-sm ${c}`} />
                    ))}
                    <span>More</span>
                </div>
            </div>

            <div className="overflow-x-auto pb-2 scrollbar-hide">
                <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-max">
                    {dates.map((date, idx) => {
                        const intensity = getIntensity(date);
                        return (
                            <motion.div
                                key={date}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.002 }}
                                className={`w-3.5 h-3.5 rounded-sm ${colors[intensity]} transition-colors duration-500 hover:ring-1 hover:ring-white/30 cursor-crosshair`}
                                title={`${date}: ${Math.round((activities.find(a => a.date === date)?.totalSeconds || 0) / 60)} minutes`}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="mt-4 flex justify-between items-end">
                <div>
                    <p className="text-2xl font-bold text-slate-100">
                        {activities.length > 0
                            ? Math.max(...activities.map(a => Math.round(a.totalSeconds / 60)))
                            : 0}
                        <span className="text-sm font-normal text-slate-500 ml-1">min peak</span>
                    </p>
                    <p className="text-xs text-slate-500">Daily study streak: {activities.length} days</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400 italic">"Consistency is the key to mastery"</p>
                </div>
            </div>
        </div>
    );
}
