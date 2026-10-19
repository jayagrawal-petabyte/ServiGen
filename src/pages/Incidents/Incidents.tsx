import React, { useState } from "react";
import TeamIncidentTable from "../TeamIncidents/TeamIncidentTable";
import IncidentsDashboard from "./IncidentsDashboard";
import { GlobalNavbarActions } from "../../components/shared/GlobalNavbarActions";

export default function Incidents() {
  const [viewMode, setViewMode] = useState<"console" | "analytics">("console");

  if (viewMode === "analytics") {
    return (
      <div className="relative w-full h-full flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Incidents / SLA Metrics View
            </span>
            <button
              type="button"
              onClick={() => setViewMode("console")}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 transition-colors cursor-pointer"
            >
              ← Back to Live Console
            </button>
          </div>
          <GlobalNavbarActions />
        </div>
        <IncidentsDashboard />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      <TeamIncidentTable
        initialViewKind="breaching-sla"
        team="1st Line Support"
        mode="Live"
      />
    </div>
  );
}