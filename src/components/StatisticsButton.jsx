"use client";

import { useState } from "react";
import { WeeklyChart } from "./charts/WeeklyChart";
import { MonthlyChart } from "./charts/MonthlyChart";
import { YearlyChart } from "./charts/YearlyChart";

export default function StatisticsDialog({ open, onClose }) {
  const [activeTab, setActiveTab] = useState("week");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-gray-700/50 animate-slideUp">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-700/50 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Work Statistics</h2>
            <p className="text-gray-400 text-sm">Track your focus journey</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 py-4 border-b border-gray-700/50">
          <div className="flex gap-2 bg-gray-800/50 rounded-full p-1.5 inline-flex">
            {[
              { key: "week", label: "Week" },
              { key: "month", label: "Month" },
              { key: "year", label: "Year" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 text-sm ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {activeTab === "week" && <WeeklyChart />}
          {activeTab === "month" && <MonthlyChart />}
          {activeTab === "year" && <YearlyChart />}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
