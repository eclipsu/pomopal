import React from "react";

export default function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex flex-col items-center justify-center aspect-square w-28 border border-slate-700">
      <Icon className="text-slate-400 mb-1" size={24} strokeWidth={1.5} />
      <div className="text-white text-3xl font-bold mb-0.5">{value}</div>
      <div className="text-slate-400 text-xs">{label}</div>
    </div>
  );
}
