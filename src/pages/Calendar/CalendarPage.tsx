import { useState } from "react";
import { mockCalendarEvents, CalendarEvent } from "./mockCalendar";
import "./calendar.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDates(baseDate: Date): Date[] {
  const week = [];
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    week.push(d);
  }
  return week;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  task: "#4f8ef7",
  appointment: "#34c97e",
  meeting: "#f7a94f",
  reminder: "#e05c5c",
};

export default function CalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"week" | "day">("week");
  const [typeFilter, setTypeFilter] = useState("All");

  const weekDates = getWeekDates(currentDate);

  const filteredEvents = mockCalendarEvents.filter((e) =>
    typeFilter === "All" ? true : e.type === typeFilter
  );

  function eventsForDate(date: Date): CalendarEvent[] {
    return filteredEvents.filter((e) => isSameDay(new Date(e.date), date));
  }

  function goToPrevWeek() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  }

  function goToNextWeek() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  }

  function goToPrevDay() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    setCurrentDate(d);
  }

  function goToNextDay() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
    setCurrentDate(d);
  }

  const selectedEvents = eventsForDate(selectedDate);

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <div>
          <h1>Calendar</h1>
          <p>Schedule, tasks and appointments</p>
        </div>
        <div className="calendar-header-actions">
          <div className="view-toggle">
            <button
              className={view === "week" ? "active" : ""}
              onClick={() => setView("week")}
            >
              Week
            </button>
            <button
              className={view === "day" ? "active" : ""}
              onClick={() => setView("day")}
            >
              Day
            </button>
          </div>
          <select
            className="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="task">Task</option>
            <option value="appointment">Appointment</option>
            <option value="meeting">Meeting</option>
            <option value="reminder">Reminder</option>
          </select>
        </div>
      </div>

      <div className="calendar-toolbar">
        {view === "week" ? (
          <>
            <button className="nav-btn" onClick={goToPrevWeek}>&#8249;</button>
            <span className="toolbar-label">
              {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {" — "}
              {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <button className="nav-btn" onClick={goToNextWeek}>&#8250;</button>
          </>
        ) : (
          <>
            <button className="nav-btn" onClick={goToPrevDay}>&#8249;</button>
            <span className="toolbar-label">
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </span>
            <button className="nav-btn" onClick={goToNextDay}>&#8250;</button>
          </>
        )}
        <button
          className="today-btn"
          onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}
        >
          Today
        </button>
      </div>

      {view === "week" && (
        <div className="week-view">
          <div className="week-grid">
            {weekDates.map((date, i) => {
              const isToday = isSameDay(date, today);
              const isSelected = isSameDay(date, selectedDate);
              const dayEvents = eventsForDate(date);
              return (
                <div
                  key={i}
                  className={`week-day-col ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className="week-day-header">
                    <span className="day-name">{DAYS[date.getDay()]}</span>
                    <span className={`day-number ${isToday ? "today-circle" : ""}`}>
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="week-day-events">
                    {dayEvents.length === 0 ? (
                      <span className="no-events">—</span>
                    ) : (
                      dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="event-chip"
                          style={{ background: EVENT_TYPE_COLORS[ev.type] || "#888" }}
                        >
                          <span className="event-time">{ev.time}</span>
                          <span className="event-title">{ev.title}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "day" && (
        <div className="day-view">
          <div className="day-events-list">
            {selectedEvents.length === 0 ? (
              <div className="empty-day">
                <div className="empty-day-icon">📅</div>
                <h3>No events on this day</h3>
                <p>Enjoy your free time or add a new event!</p>
              </div>
            ) : (
              selectedEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="day-event-card"
                  style={{ borderLeft: `4px solid ${EVENT_TYPE_COLORS[ev.type] || "#888"}` }}
                >
                  <div className="day-event-time">{ev.time}</div>
                  <div className="day-event-body">
                    <div className="day-event-title">{ev.title}</div>
                    {ev.description && (
                      <div className="day-event-desc">{ev.description}</div>
                    )}
                    <span
                      className="day-event-type"
                      style={{ background: EVENT_TYPE_COLORS[ev.type] || "#888" }}
                    >
                      {ev.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="selected-date-bar">
        <strong>
          {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </strong>
        <span>{eventsForDate(selectedDate).length} event(s)</span>
      </div>
    </div>
  );
}