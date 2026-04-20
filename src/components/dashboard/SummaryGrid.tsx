"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, IndianRupee } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useData } from "@/lib/DataContext";

export default function SummaryGrid() {
  const { currentMonthStats: stats } = useData();

  const { income, expense } = stats;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-3 md:gap-6"
    >
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-5">
        {/* Income Analysis Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/analytics" className="group/card block">
            <motion.div 
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              variants={{
                initial: { scale: 1, y: 0 },
                hover: { scale: 1.02, y: -2 },
                tap: { scale: 0.98 }
              }}
              className="glass-card glass-interactive p-2.5 md:p-4 h-[90px] md:h-[150px] flex flex-col relative overflow-hidden border-secondary/10 group-hover/card:border-secondary/30 transition-colors duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
              <div className="absolute right-2 top-2 p-1 md:p-2 bg-secondary/10 rounded-xl border border-secondary/20 md:block hidden group-hover/card:bg-secondary/20 transition-colors shadow-glow-secondary/20">
                <ArrowDownRight className="h-4 w-4 text-secondary group-hover/card:scale-110 transition-transform duration-500" />
              </div>
              <motion.div 
                className="absolute right-[10%] bottom-[8%] pointer-events-none"
                variants={{
                  initial: { opacity: 0.03, scale: 1, rotate: 0 },
                  hover: { opacity: 0.08, scale: 1.25, rotate: 15 }
                }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                <IndianRupee className="h-24 w-24 text-secondary" />
              </motion.div>
              <p className="text-[10px] md:text-xs font-black text-secondary uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 opacity-80 group-hover/card:opacity-100 transition-opacity">Inflow</p>
              <h2 className="text-xl md:text-4xl font-bold tracking-tight text-on-surface font-display truncate">
                <span className="opacity-20 mr-0.5 font-normal text-sm md:text-lg">₹</span>{formatINR(income).replace('₹', '')}
              </h2>
              <div className="mt-auto hidden md:block">
                <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${income > 0 ? (income / (income + expense || 1)) * 100 : 0}%` }}
                     transition={{ duration: 1.5, delay: 0.5, ease: "circOut" }}
                     className="h-full bg-secondary shadow-glow-secondary transition-all" 
                  />
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
 
        {/* Expense Analysis Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/analytics" className="group/card block">
            <motion.div 
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              variants={{
                initial: { scale: 1, y: 0 },
                hover: { scale: 1.02, y: -2 },
                tap: { scale: 0.98 }
              }}
              className="glass-card glass-interactive p-2.5 md:p-4 h-[90px] md:h-[150px] flex flex-col relative overflow-hidden border-tertiary/10 group-hover/card:border-tertiary/30 transition-colors duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-tertiary/5 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
              <div className="absolute right-2 top-2 p-1 md:p-2 bg-tertiary/10 rounded-xl border border-tertiary/20 md:block hidden group-hover/card:bg-tertiary/20 transition-colors shadow-glow-tertiary/20">
                <ArrowUpRight className="h-4 w-4 text-tertiary group-hover/card:scale-110 transition-transform duration-500" />
              </div>
              <motion.div 
                className="absolute right-[10%] bottom-[8%] pointer-events-none"
                variants={{
                  initial: { opacity: 0.03, scale: 1, rotate: 0 },
                  hover: { opacity: 0.08, scale: 1.25, rotate: -15 }
                }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                <IndianRupee className="h-24 w-24 text-tertiary" />
              </motion.div>
              <p className="text-[10px] md:text-xs font-black text-tertiary uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 opacity-80 group-hover/card:opacity-100 transition-opacity">Expense</p>
              <h2 className="text-xl md:text-4xl font-bold tracking-tight text-on-surface font-display truncate">
                <span className="opacity-20 mr-0.5 font-normal text-sm md:text-lg">₹</span>{formatINR(expense).replace('₹', '')}
              </h2>
              <div className="mt-auto hidden md:block">
                <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${expense > 0 ? (expense / (income + expense || 1)) * 100 : 0}%` }}
                     transition={{ duration: 1.5, delay: 0.6, ease: "circOut" }}
                     className="h-full bg-tertiary shadow-glow-tertiary transition-all" 
                  />
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
