import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  APPOINTMENT_TYPES,
  type CalendarEvent,
  type EventType,
  toDateKey,
} from "./calendar.types";
import { apiClient, api } from "../../services/apiClient";
import { GlobalNavbarActions } from "../../components/shared/GlobalNavbarActions";
import "./calendar.css";

type View = "month" | "week" | "day" | "agenda" | "timeline";

const VIEWS: { id: View; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "agenda", label: "Agenda" },
  { id: "timeline", label: "Timeline" },
];

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const HOUR_HEIGHT = 48;

/* ---------- date helpers ---------- */

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function startOfWeek(d: Date) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function isSameDay(a: Date, b: Date) {
  return toDateKey(a) === toDateKey(b);
}

function monthGrid(month: Date): Date[] {
  const start = startOfWeek(new Date(month.getFullYear(), month.getMonth(), 1));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function formatHour(h: number) {
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:00 ${suffix}`;
}

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

function gmtLabel(d: Date) {
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const h = Math.floor(Math.abs(offset) / 60);
  const m = Math.abs(offset) % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

function typeMeta(id: EventType) {
  return APPOINTMENT_TYPES.find((t) => t.id === id) ?? APPOINTMENT_TYPES[0];
}

function rangeLabel(days: Date[]) {
  const first = days[0];
  const last = days[days.length - 1];
  const month = (d: Date) => d.toLocaleDateString("en-US", { month: "long" });
  if (first.getMonth() === last.getMonth()) {
    return `${month(first)} ${first.getDate()}-${last.getDate()}`;
  }
  const short = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${short(first)} - ${short(last)}`;
}

/* Lays out overlapping events side by side within a single day column. */
function layoutDay(events: CalendarEvent[]) {
  const sorted = [...events].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const laneEnds: number[] = [];
  const lanes = new Map<string, number>();
  for (const ev of sorted) {
    const start = toMinutes(ev.start);
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = toMinutes(ev.end);
    lanes.set(ev.id, lane);
  }
  return { lanes, laneCount: Math.max(laneEnds.length, 1) };
}

type Draft = Omit<CalendarEvent, "id">;

function emptyDraft(date: Date, hour = 9): Draft {
  return {
    title: "",
    date: toDateKey(date),
    start: `${String(hour).padStart(2, "0")}:00`,
    end: `${String(Math.min(hour + 1, 23)).padStart(2, "0")}:00`,
    type: "meeting",
    agent: "",
    description: "",
  };
}

function normalizeEventType(type?: string): EventType {
  if (!type) return "meeting";
  const lower = type.toLowerCase().trim().replace(/[\s_]+/g, "-");
  if (lower.includes("phone") || lower.includes("call")) return "phone-call";
  if (lower.includes("site") || lower.includes("visit")) return "site-visit";
  if (lower.includes("resource") || lower.includes("booking")) return "resource-booking";
  return "meeting";
}

export default function CalendarPage() {
  const [now, setNow] = useState(new Date());
  const [anchor, setAnchor] = useState(new Date());
  const [miniMonth, setMiniMonth] = useState(new Date());
  const [view, setView] = useState<View>("week");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hiddenTypes, setHiddenTypes] = useState<EventType[]>([]);
  const [hiddenAgents, setHiddenAgents] = useState<string[]>([]);
  const [agentList, setAgentList] = useState<string[]>([]);
  const [typesOpen, setTypesOpen] = useState(true);
  const [agentsOpen, setAgentsOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showWeekends, setShowWeekends] = useState(true);
  const [workingHoursOnly, setWorkingHoursOnly] = useState(true);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftError, setDraftError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch calendar events on mount
  useEffect(() => {
    let active = true;
    async function fetchCalendarEvents() {
      setLoading(true);
      setError(null);
      try {
        const res: any = await apiClient.get('/api/calendar');
        if (!active) return;
        const rawEvents = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (rawEvents.length > 0) {
          const mapped: CalendarEvent[] = rawEvents.map((item: any) => {
            if (item.date && item.start && item.end) {
              return {
                id: String(item.id),
                title: item.title || "Untitled Event",
                date: item.date,
                start: item.start,
                end: item.end,
                type: normalizeEventType(item.type || item.appointmentType),
                agent: item.agent || item.agentName || "",
                allDay: Boolean(item.allDay),
                description: item.description || "",
              };
            }
            const startDt = item.startsAt ? new Date(item.startsAt) : new Date();
            const endDt = item.endsAt
              ? new Date(item.endsAt)
              : new Date(startDt.getTime() + 60 * 60 * 1000);
            const pad = (n: number) => String(n).padStart(2, "0");
            return {
              id: String(item.id),
              title: item.title || "Untitled Event",
              date: toDateKey(startDt),
              start: `${pad(startDt.getHours())}:${pad(startDt.getMinutes())}`,
              end: `${pad(endDt.getHours())}:${pad(endDt.getMinutes())}`,
              type: normalizeEventType(item.appointmentType || item.type),
              agent: item.agent || "",
              description: item.description || "",
            };
          });
          setEvents(mapped);
        } else {
          // If database is unseeded, use default mock calendar events so page is not empty
          setEvents([]);
        }
      } catch (err: any) {
        if (!active) return;
        setEvents([]);
        console.warn("[CalendarPage] Backend fetch error, using fallback events:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchCalendarEvents();
    return () => {
      active = false;
    };
  }, []);

  // Load agent list from API
  useEffect(() => {
    async function loadAgents() {
      try {
        const { api: apiAgent } = await import("../../services/apiClient");
        const [r1, r2]: any[] = await Promise.all([
          apiAgent.get('/api/incidents/support/first-line/agents'),
          apiAgent.get('/api/incidents/support/second-line/agents'),
        ]);
        const extract = (res: any): string[] => {
          const arr = Array.isArray(res?.data?.agents) ? res.data.agents
            : Array.isArray(res?.data) ? res.data
            : Array.isArray(res?.agents) ? res.agents : [];
          return arr.map((a: any) => {
            const u = a.user ?? a;
            return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.fullName || u.username || '';
          }).filter(Boolean);
        };
        const combined = [...new Set([...extract(r1), ...extract(r2)])];
        if (combined.length > 0) setAgentList(combined);
      } catch { }
    }
    void loadAgents();
  }, []);

  // Fallback: derive from loaded events
  useEffect(() => {
    if (agentList.length === 0 && events.length > 0) {
      setAgentList([...new Set(events.map((e) => e.agent).filter(Boolean))]);
    }
  }, [events, agentList.length]);

  // Keep the red "now" line moving.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const dayStart = workingHoursOnly ? 8 : 0;
  const dayEnd = workingHoursOnly ? 19 : 24;
  const hours = Array.from({ length: dayEnd - dayStart }, (_, i) => dayStart + i);

  const weekDays = useMemo(() => {
    const start = startOfWeek(anchor);
    const all = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return showWeekends ? all : all.filter((d) => d.getDay() !== 0 && d.getDay() !== 6);
  }, [anchor, showWeekends]);

  const visibleEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter(
      (e) =>
        !hiddenTypes.includes(e.type) &&
        !hiddenAgents.includes(e.agent) &&
        (!q ||
          e.title.toLowerCase().includes(q) ||
          e.agent.toLowerCase().includes(q) ||
          (e.description ?? "").toLowerCase().includes(q))
    );
  }, [events, search, hiddenTypes, hiddenAgents]);

  function eventsOn(date: Date) {
    const key = toDateKey(date);
    return visibleEvents
      .filter((e) => e.date === key)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  }

  /* ---------- navigation ---------- */

  function goTo(date: Date) {
    setAnchor(date);
    setMiniMonth(date);
  }

  function step(dir: 1 | -1) {
    if (view === "month") goTo(addMonths(anchor, dir));
    else if (view === "day") goTo(addDays(anchor, dir));
    else goTo(addDays(anchor, 7 * dir));
  }

  const title =
    view === "month"
      ? anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : view === "day"
      ? anchor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      : rangeLabel(weekDays);

  /* ---------- sidebar toggles ---------- */

  function toggleType(id: EventType) {
    setHiddenTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  function toggleAgent(name: string) {
    setHiddenAgents((prev) => (prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]));
  }

  /* ---------- create / delete ---------- */

  function openDraft(date: Date, hour?: number) {
    setDraftError("");
    setDraft(emptyDraft(date, hour));
  }

  function saveDraft() {
    if (!draft) return;
    if (!draft.title.trim()) return setDraftError("Please enter a title.");
    if (toMinutes(draft.end) <= toMinutes(draft.start)) return setDraftError("End time must be after start time.");
    const newEvent: CalendarEvent = { ...draft, title: draft.title.trim(), id: String(Date.now()) };
    setEvents((prev) => [...prev, newEvent]);
    // Ensure the created event's type is visible
    setHiddenTypes((prev) => prev.filter((t) => t !== draft.type));
    setDraft(null);

    const startsAt = new Date(`${draft.date}T${draft.start}:00`).toISOString();
    const endsAt = new Date(`${draft.date}T${draft.end}:00`).toISOString();
    apiClient.post('/api/calendar', {
      title: draft.title.trim(),
      appointmentType: draft.type,
      startsAt,
      endsAt,
    }).then((res: any) => {
      const createdId = res?.data?.id || res?.id;
      if (createdId) {
        setEvents((prev) => prev.map((ev) => ev.id === newEvent.id ? { ...ev, id: String(createdId) } : ev));
      }
    }).catch((err) => {
      console.warn('[CalendarPage] Failed to persist event:', err);
    });
  }

  function deleteEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelected(null);
  }

  /* ---------- views ---------- */

  function renderTimeGrid(days: Date[]) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const showNow = nowMinutes >= dayStart * 60 && nowMinutes < dayEnd * 60;
    return (
      <div className="cal-grid" style={{ "--cols": days.length } as CSSProperties}>
        <div className="cal-grid-head">
          <div className="cal-gutter-label">{gmtLabel(now)}</div>
          {days.map((d) => {
            const isToday = isSameDay(d, now);
            return (
              <button
                key={toDateKey(d)}
                className={`cal-day-head ${isToday ? "is-today" : ""}`}
                onClick={() => {
                  goTo(d);
                  setView("day");
                }}
              >
                <span className="cal-day-name">{WEEKDAYS[d.getDay()]}</span>
                <span className="cal-day-num">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        <div className="cal-allday-row">
          <div className="cal-gutter-label small">all-day</div>
          {days.map((d) => (
            <div key={toDateKey(d)} className={`cal-allday-cell ${isSameDay(d, now) ? "is-today" : ""}`}>
              {eventsOn(d)
                .filter((e) => e.allDay)
                .map((e) => (
                  <button
                    key={e.id}
                    className="cal-chip"
                    style={{ background: typeMeta(e.type).color }}
                    onClick={() => setSelected(e)}
                  >
                    {e.title}
                  </button>
                ))}
            </div>
          ))}
        </div>

        <div className="cal-grid-body">
          <div className="cal-hours">
            {hours.map((h) => (
              <div key={h} className="cal-hour-label" style={{ height: HOUR_HEIGHT }}>
                {formatHour(h)}
              </div>
            ))}
          </div>

          {days.map((d) => {
            const isToday = isSameDay(d, now);
            const timed = eventsOn(d).filter((e) => !e.allDay);
            const { lanes, laneCount } = layoutDay(timed);
            return (
              <div key={toDateKey(d)} className={`cal-day-col ${isToday ? "is-today" : ""}`}>
                {hours.map((h) => (
                  <button
                    key={h}
                    className="cal-slot"
                    style={{ height: HOUR_HEIGHT }}
                    aria-label={`New appointment ${d.toDateString()} ${formatHour(h)}`}
                    onClick={() => openDraft(d, h)}
                  />
                ))}

                {timed.map((e) => {
                  const start = Math.max(toMinutes(e.start), dayStart * 60);
                  const end = Math.min(toMinutes(e.end), dayEnd * 60);
                  if (end <= start) return null;
                  const lane = lanes.get(e.id) ?? 0;
                  return (
                    <button
                      key={e.id}
                      className={`cal-event ${end - start < 45 ? "short" : ""}`}
                      style={{
                        top: ((start - dayStart * 60) / 60) * HOUR_HEIGHT,
                        height: Math.max(((end - start) / 60) * HOUR_HEIGHT - 2, 20),
                        left: `calc(${(lane / laneCount) * 100}% + 2px)`,
                        width: `calc(${100 / laneCount}% - 4px)`,
                        background: typeMeta(e.type).color,
                      }}
                      onClick={() => setSelected(e)}
                    >
                      <span className="cal-event-title">{e.title}</span>
                      <span className="cal-event-time">
                        {formatTime(e.start)} – {formatTime(e.end)}
                      </span>
                    </button>
                  );
                })}

                {isToday && showNow && (
                  <div
                    className="cal-now-line"
                    style={{ top: ((nowMinutes - dayStart * 60) / 60) * HOUR_HEIGHT }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderMonth() {
    const days = monthGrid(anchor);
    return (
      <div className="cal-month">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-month-head">
            {w}
          </div>
        ))}
        {days.map((d) => {
          const dayEvents = eventsOn(d);
          const outside = d.getMonth() !== anchor.getMonth();
          return (
            <div
              key={toDateKey(d)}
              className={`cal-month-cell ${outside ? "is-outside" : ""} ${isSameDay(d, now) ? "is-today" : ""}`}
              onClick={() => openDraft(d)}
            >
              <button
                className="cal-month-num"
                onClick={(ev) => {
                  ev.stopPropagation();
                  goTo(d);
                  setView("day");
                }}
              >
                {d.getDate()}
              </button>
              {dayEvents.slice(0, 3).map((e) => (
                <button
                  key={e.id}
                  className="cal-chip"
                  style={{ background: typeMeta(e.type).color }}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setSelected(e);
                  }}
                >
                  {!e.allDay && <span className="cal-chip-time">{formatTime(e.start)}</span>}
                  {e.title}
                </button>
              ))}
              {dayEvents.length > 3 && (
                <button
                  className="cal-more"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    goTo(d);
                    setView("day");
                  }}
                >
                  +{dayEvents.length - 3} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderAgenda() {
    const withEvents = weekDays.filter((d) => eventsOn(d).length > 0);
    return (
      <div className="cal-agenda">
        {withEvents.length === 0 && <div className="cal-empty">No appointments this week.</div>}
        {withEvents.map((d) => (
          <div key={toDateKey(d)} className="cal-agenda-day">
            <div className={`cal-agenda-date ${isSameDay(d, now) ? "is-today" : ""}`}>
              <span>{WEEKDAYS[d.getDay()]}</span>
              <strong>{d.getDate()}</strong>
              <span>{d.toLocaleDateString("en-US", { month: "short" })}</span>
            </div>
            <div className="cal-agenda-list">
              {eventsOn(d).map((e) => (
                <button key={e.id} className="cal-agenda-item" onClick={() => setSelected(e)}>
                  <span className="cal-dot" style={{ background: typeMeta(e.type).color }} />
                  <span className="cal-agenda-time">
                    {e.allDay ? "All day" : `${formatTime(e.start)} – ${formatTime(e.end)}`}
                  </span>
                  <span className="cal-agenda-title">{e.title}</span>
                  <span className="cal-agenda-agent">{e.agent}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderTimeline() {
    const agents = agentList.filter((a) => !hiddenAgents.includes(a));
    return (
      <div className="cal-timeline" style={{ "--cols": weekDays.length } as CSSProperties}>
        <div className="cal-timeline-row cal-timeline-head">
          <div className="cal-timeline-agent">Agent</div>
          {weekDays.map((d) => (
            <div key={toDateKey(d)} className={`cal-timeline-cell head ${isSameDay(d, now) ? "is-today" : ""}`}>
              {WEEKDAYS[d.getDay()]} {d.getDate()}
            </div>
          ))}
        </div>
        {agents.map((agent) => (
          <div key={agent} className="cal-timeline-row">
            <div className="cal-timeline-agent">
              <span className="cal-avatar">👤</span>
              {agent}
            </div>
            {weekDays.map((d) => (
              <div
                key={toDateKey(d)}
                className={`cal-timeline-cell ${isSameDay(d, now) ? "is-today" : ""}`}
                onClick={() => setDraft({ ...emptyDraft(d), agent })}
              >
                {eventsOn(d)
                  .filter((e) => e.agent === agent)
                  .map((e) => (
                    <button
                      key={e.id}
                      className="cal-chip"
                      style={{ background: typeMeta(e.type).color }}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setSelected(e);
                      }}
                    >
                      {e.title}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  /* ---------- render ---------- */

  const miniDays = monthGrid(miniMonth);
  const anchorWeek = startOfWeek(anchor);

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#fff7f3] overflow-hidden">
      {/* ── Top Navbar ── */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">Calendar</span>
        </div>
        <GlobalNavbarActions />
      </header>

      <div className="calendar-page flex-1 min-h-0">
        <aside className="cal-side">
        <div className="cal-search">
          <input
            ref={searchRef}
            placeholder="Search Calendar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            aria-label={search ? "Clear search" : "Search"}
            onClick={() => (search ? setSearch("") : searchRef.current?.focus())}
          >
            {search ? "✕" : "⌕"}
          </button>
        </div>

        <div className="cal-mini">
          <div className="cal-mini-head">
            <strong>{miniMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</strong>
            <div>
              <button aria-label="Previous month" onClick={() => setMiniMonth(addMonths(miniMonth, -1))}>‹</button>
              <button aria-label="Next month" onClick={() => setMiniMonth(addMonths(miniMonth, 1))}>›</button>
            </div>
          </div>
          <div className="cal-mini-grid">
            {WEEKDAYS.map((w) => (
              <span key={w} className="cal-mini-dow">
                {w.slice(0, 2)}
              </span>
            ))}
            {miniDays.map((d) => {
              const inWeek = view !== "month" && view !== "day" && isSameDay(startOfWeek(d), anchorWeek);
              const classes = [
                "cal-mini-day",
                d.getMonth() !== miniMonth.getMonth() ? "is-outside" : "",
                inWeek ? "in-week" : "",
                isSameDay(d, anchor) ? "is-selected" : "",
                isSameDay(d, now) ? "is-today" : "",
              ].join(" ");
              return (
                <button key={toDateKey(d)} className={classes} onClick={() => goTo(d)}>
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <section className="cal-side-section">
          <div className="cal-side-title">
            <h3>Appointment Types</h3>
            <button
              className={`cal-caret ${typesOpen ? "" : "closed"}`}
              aria-label="Toggle appointment types"
              onClick={() => setTypesOpen(!typesOpen)}
            >
              ▾
            </button>
            <button
              className="cal-reset-btn"
              title={hiddenTypes.length > 0 ? "Show all appointment types" : "Hide all appointment types"}
              onClick={() => {
                if (hiddenTypes.length > 0) {
                  setHiddenTypes([]);
                } else {
                  setHiddenTypes(APPOINTMENT_TYPES.map((t) => t.id));
                }
              }}
            >
              {hiddenTypes.length > 0 ? "Select All" : "Clear"}
            </button>
          </div>
          {typesOpen &&
            APPOINTMENT_TYPES.map((t) => {
              const off = hiddenTypes.includes(t.id);
              return (
                <button
                  key={t.id}
                  className={`cal-side-item ${off ? "is-off" : "is-active"}`}
                  onClick={() => toggleType(t.id)}
                  title={`${off ? "Show" : "Hide"} ${t.label}`}
                >
                  <span
                    className={`cal-dot big ${off ? "is-off" : ""}`}
                    style={{
                      backgroundColor: off ? "transparent" : t.color,
                      borderColor: t.color,
                    }}
                  >
                    {!off && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="cal-side-item-label">{t.label}</span>
                </button>
              );
            })}
        </section>

        <section className="cal-side-section">
          <div className="cal-side-title">
            <h3>Agent Calendars</h3>
            <button
              className={`cal-caret ${agentsOpen ? "" : "closed"}`}
              aria-label="Toggle agent calendars"
              onClick={() => setAgentsOpen(!agentsOpen)}
            >
              ▾
            </button>
            <button
              className="cal-reset-btn"
              title={hiddenAgents.length > 0 ? "Show all agent calendars" : "Hide all agent calendars"}
              onClick={() => {
                if (hiddenAgents.length > 0) {
                  setHiddenAgents([]);
                } else {
                  setHiddenAgents([...agentList]);
                }
              }}
            >
              {hiddenAgents.length > 0 ? "Select All" : "Clear"}
            </button>
          </div>
          {agentsOpen &&
            agentList.map((a) => {
              const off = hiddenAgents.includes(a);
              return (
                <button
                  key={a}
                  className={`cal-side-item ${off ? "is-off" : "is-active"}`}
                  onClick={() => toggleAgent(a)}
                  title={`${off ? "Show" : "Hide"} calendar for ${a}`}
                >
                  <span
                    className={`cal-dot big agent-dot ${off ? "is-off" : ""}`}
                    style={{
                      backgroundColor: off ? "transparent" : "#263a5e",
                      borderColor: "#263a5e",
                    }}
                  >
                    {!off && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="cal-avatar">👤</span>
                  <span className="cal-side-item-label">{a}</span>
                </button>
              );
            })}
        </section>
      </aside>

      <main className="cal-main">
        <div className="cal-toolbar">
          <div className="cal-nav">
            <button onClick={() => goTo(new Date())}>Today</button>
            <button onClick={() => step(-1)}>‹ Previous</button>
            <button onClick={() => step(1)}>Next ›</button>
          </div>

          <h2 className="cal-title">
            {title}
            {loading && <span style={{ fontSize: "12px", marginLeft: "10px", opacity: 0.6, fontWeight: "normal" }}>Loading...</span>}
          </h2>

          <div className="cal-toolbar-right">
            <div className="cal-views">
              {VIEWS.map((v) => (
                <button key={v.id} className={view === v.id ? "active" : ""} onClick={() => setView(v.id)}>
                  {v.label}
                </button>
              ))}
            </div>
            <div className="cal-filter-wrap">
              <button
                className={`cal-filter-btn ${filterOpen ? "active" : ""}`}
                aria-label="Calendar options"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 4h18l-7 9v6l-4 2v-8z" />
                </svg>
              </button>
              {filterOpen && (
                <div className="cal-popover">
                  <label>
                    <input type="checkbox" checked={showWeekends} onChange={(e) => setShowWeekends(e.target.checked)} />
                    Show weekends
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={workingHoursOnly}
                      onChange={(e) => setWorkingHoursOnly(e.target.checked)}
                    />
                    Working hours only (8 AM – 7 PM)
                  </label>
                  <button className="cal-btn primary" onClick={() => {
                      setFilterOpen(false);
                      openDraft(anchor);
                    }}
                  >
                    + New appointment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {error && <div className="cal-error" style={{ margin: "8px 16px" }}>{error}</div>}

        {view === "week" && renderTimeGrid(weekDays)}
        {view === "day" && renderTimeGrid([anchor])}
        {view === "month" && renderMonth()}
        {view === "agenda" && renderAgenda()}
        {view === "timeline" && renderTimeline()}
      </main>

      {selected && (
        <div className="cal-modal-overlay" onClick={() => setSelected(null)}>
          <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal-head">
              <span className="cal-dot big" style={{ background: typeMeta(selected.type).color }} />
              <h2>{selected.title}</h2>
              <button className="cal-close" aria-label="Close" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>
            <dl className="cal-details">
              <dt>Type</dt>
              <dd>{typeMeta(selected.type).label}</dd>
              <dt>When</dt>
              <dd>
                {new Date(`${selected.date}T00:00`).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
                {selected.allDay ? " · All day" : ` · ${formatTime(selected.start)} – ${formatTime(selected.end)}`}
              </dd>
              <dt>Agent</dt>
              <dd>{selected.agent}</dd>
              {selected.description && (
                <>
                  <dt>Notes</dt>
                  <dd>{selected.description}</dd>
                </>
              )}
            </dl>
            <div className="cal-modal-actions">
              <button className="cal-btn danger" onClick={() => deleteEvent(selected.id)}>
                Delete
              </button>
              <button className="cal-btn" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {draft && (
        <div className="cal-modal-overlay" onClick={() => setDraft(null)}>
          <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal-head">
              <h2>New Appointment</h2>
              <button className="cal-close" aria-label="Close" onClick={() => setDraft(null)}>
                ✕
              </button>
            </div>
            <div className="cal-form">
              <label>
                Title *
                <input
                  autoFocus
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="e.g. Client call"
                />
              </label>
              <div className="cal-form-row">
                <label>
                  Date
                  <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                </label>
                <label>
                  Start
                  <input type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
                </label>
                <label>
                  End
                  <input type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
                </label>
              </div>
              <div className="cal-form-row">
                <label>
                  Type
                  <select
                    value={draft.type}
                    onChange={(e) => setDraft({ ...draft, type: e.target.value as EventType })}
                  >
                    {APPOINTMENT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Agent
                  <select value={draft.agent} onChange={(e) => setDraft({ ...draft, agent: e.target.value })}>
                    {agentList.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Notes
                <textarea
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </label>
              {draftError && <p className="cal-error">{draftError}</p>}
            </div>
            <div className="cal-modal-actions">
              <button className="cal-btn" onClick={() => setDraft(null)}>
                Cancel
              </button>
              <button className="cal-btn primary" onClick={saveDraft}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
