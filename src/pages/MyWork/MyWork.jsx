import { useMemo, useState } from "react"; 
 
/** 
 * My Work — Ticket List 
 * Owner: Keerthana M 
 * 
 * Spec reference: "My Work – Ticket List (Collapsed/Expanded Navigation)" 
 *   Fields: ID, Priority, Organisation, Summary, Time Record 
 *   Search/filter controls where available. 
 * 
 * The collapsed vs. expanded nav states are a layout-level concern (handled 
 * by src/layouts), so this component renders the same ticket list either 
 * way — it just gets narrower or wider depending on the surrounding layout. 
 * 
 * NOTE: replace MOCK_TICKETS with a real call into src/services once the 
 * ticket API is ready. Swap the local <PriorityPill>/search input for the 
 * shared versions in src/components/shared as soon as Durgesh's shared 
 * components land, so we're not duplicating base components. 
 */ 
 
const MOCK_TICKETS = [ 
  { 
    id: "TCK-30291", 
    priority: "P1 - Critical", 
    organisation: "Meridian Foods Ltd", 
    summary: "Order sync failing between POS and ERP", 
    timeRecord: "2h 15m", 
  }, 
  { 
    id: "TCK-30288", 
    priority: "P2 - High", 
    organisation: "Northbridge Logistics", 
    summary: "Warehouse scanner firmware update request", 
    timeRecord: "45m", 
  }, 
  { 
    id: "TCK-30271", 
    priority: "P3 - Medium", 
    organisation: "Aurelia Health", 
    summary: "New starter access to imaging system", 
    timeRecord: "1h 05m", 
  }, 
  { 
    id: "TCK-30260", 
    priority: "P2 - High", 
    organisation: "Solace Retail Group", 
    summary: "Checkout page throwing 500 on discount codes", 
    timeRecord: "3h 40m", 
  }, 
  { 
    id: "TCK-30254", 
    priority: "P4 - Low", 
    organisation: "Meridian Foods Ltd", 
    summary: "Update signage on internal knowledge base article", 
    timeRecord: "12m", 
  }, 
]; 
 
const PRIORITY_STYLES = { 
  "P1 - Critical": "bg-rose-50 text-rose-700 border-rose-200", 
  "P2 - High": "bg-amber-50 text-amber-800 border-amber-200", 
  "P3 - Medium": "bg-sky-50 text-sky-700 border-sky-200", 
  "P4 - Low": "bg-slate-100 text-slate-600 border-slate-300", 
}; 
 
function PriorityPill({ priority }) { 
  const cls = PRIORITY_STYLES[priority] ?? "bg-slate-100 text-slate-600 border-slate-300"; 
  return ( 
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}> 
      {priority} 
    </span> 
  ); 
} 
 
const PRIORITY_ORDER = ["P1 - Critical", "P2 - High", "P3 - Medium", "P4 - Low"]; 
 
export default function MyWork() { 
  const [query, setQuery] = useState(""); 
  const [priorityFilter, setPriorityFilter] = useState("All"); 
 
  const filtered = useMemo(() => { 
    return MOCK_TICKETS.filter((t) => { 
      const matchesPriority = priorityFilter === "All" || t.priority === priorityFilter; 
      const q = query.trim().toLowerCase(); 
      const matchesQuery = 
        !q || 
        t.id.toLowerCase().includes(q) || 
        t.organisation.toLowerCase().includes(q) || 
        t.summary.toLowerCase().includes(q); 
      return matchesPriority && matchesQuery; 
    }).sort( 
      (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) 
    ); 
  }, [query, priorityFilter]); 
 
  return ( 
    <div className="min-h-full bg-slate-50 px-6 py-6"> 
      <div className="mx-auto max-w-6xl"> 
        <header className="mb-6 flex items-end justify-between gap-4"> 
          <div> 
            <h1 className="text-xl font-semibold text-slate-900">My Work</h1> 
            <p className="mt-1 text-sm text-slate-500"> 
              Tickets currently assigned to you, sorted by priority. 
            </p> 
          </div> 
          <div className="text-sm text-slate-500"> 
            {filtered.length} of {MOCK_TICKETS.length} tickets 
          </div> 
        </header> 
 
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center"> 
          <div className="relative flex-1"> 
            <input 
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search by ticket ID, organisation, or summary" 
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200" 
            /> 
          </div> 
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)} 
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200" 
          > 
            <option value="All">All priorities</option> 
            {PRIORITY_ORDER.map((p) => ( 
              <option key={p} value={p}> 
                {p} 
              </option> 
            ))} 
          </select> 
        </div> 
 
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"> 
          <table className="min-w-full divide-y divide-slate-200 text-sm"> 
            <thead className="bg-slate-50"> 
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500"> 
                <th className="px-4 py-3">ID</th> 
                <th className="px-4 py-3">Priority</th> 
                <th className="px-4 py-3">Organisation</th> 
                <th className="px-4 py-3">Summary</th> 
                <th className="px-4 py-3">Time Record</th> 
              </tr> 
            </thead> 
            <tbody className="divide-y divide-slate-100"> 
              {filtered.map((t) => ( 
                <tr 
                  key={t.id} 
                  className="cursor-pointer hover:bg-slate-50" 
                  onClick={() => console.log("navigate to ticket", t.id)} 
                > 
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">{t.id}</td> 
                  <td className="whitespace-nowrap px-4 py-3"> 
                    <PriorityPill priority={t.priority} /> 
                  </td> 
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{t.organisation}</td> 
                  <td className="px-4 py-3 text-slate-700">{t.summary}</td> 
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 tabular-nums">{t.timeRecord}</td> 
                </tr> 
              ))} 
              {filtered.length === 0 && ( 
                <tr> 
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400"> 
                    No tickets match your filters. 
                  </td> 
                </tr> 
              )} 
            </tbody> 
          </table> 
        </div> 
      </div> 
    </div> 
  ); 
}