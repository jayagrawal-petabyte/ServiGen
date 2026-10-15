import { useState, useEffect } from "react";
import dashboardService from "../../services/dashboardService";

type Mood = {
  label: string;
  emoji: string;
  className: string;
};

const MOODS: Mood[] = [
  {
    label: "Happy",
    emoji: "😊",
    className: "mood-happy",
  },
  {
    label: "Excited",
    emoji: "🤩",
    className: "mood-excited",
  },
  {
    label: "Positive",
    emoji: "😃",
    className: "mood-positive",
  },
  {
    label: "Fine",
    emoji: "🙂",
    className: "mood-fine",
  },
  {
    label: "Nervous",
    emoji: "😰",
    className: "mood-nervous",
  },
  {
    label: "Sad",
    emoji: "😔",
    className: "mood-sad",
  },
];

export default function MoodCheckIn() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    dashboardService.getMood().then((mood) => {
      if (mounted && mood) {
        setSelectedMood(mood);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleMoodSelect = async (moodLabel: string) => {
    setSelectedMood(moodLabel);
    await dashboardService.submitMood(moodLabel);
  };

  return (
    <section className="dashboard-mood">
      <h1>How are you today?</h1>

      <div className="dashboard-mood-options">
        {MOODS.map((mood) => (
          <button
            key={mood.label}
            type="button"
            className={`dashboard-mood-button ${mood.className} ${
              selectedMood === mood.label
                ? "dashboard-mood-selected"
                : ""
            }`}
            onClick={() => handleMoodSelect(mood.label)}
          >
            <span>{mood.label}</span>
            <span>{mood.emoji}</span>
          </button>
        ))}
      </div>
    </section>
  );
}