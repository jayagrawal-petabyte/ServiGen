
import { useEffect, useState } from "react";
import dashboardService from "../../services/dashboardService";

type Mood = {
  label: string;
  emoji: string;
  className: string;
};

const MOODS: Mood[] = [
  { label: "Happy", emoji: "😊", className: "mood-happy" },
  { label: "Excited", emoji: "🤩", className: "mood-excited" },
  { label: "Positive", emoji: "😃", className: "mood-positive" },
  { label: "Fine", emoji: "🙂", className: "mood-fine" },
  { label: "Nervous", emoji: "😰", className: "mood-nervous" },
  { label: "Sad", emoji: "😔", className: "mood-sad" },
];

export default function MoodCheckIn() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadMood() {
      try {
        const mood = await dashboardService.getMood();

        if (mounted && mood) {
          setSelectedMood(mood);
        }
      } catch (err) {
        console.error("Failed to load mood:", err);

        if (mounted) {
          setError("Couldn't load your saved mood. You can still select one.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMood();

    return () => {
      mounted = false;
    };
  }, []);

  const handleMoodSelect = async (moodLabel: string) => {
    if (isSubmitting || selectedMood === moodLabel) {
      return;
    }

    const previousMood = selectedMood;

    setSelectedMood(moodLabel);
    setIsSubmitting(true);
    setError(null);

    try {
      await dashboardService.submitMood(moodLabel);
    } catch (err) {
      console.error("Failed to submit mood:", err);

      setSelectedMood(previousMood);
      setError("Couldn't save your mood. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="dashboard-mood" aria-labelledby="mood-heading">
      <h1 id="mood-heading">How are you today?</h1>

      <div
        className="dashboard-mood-options"
        aria-label="Select your current mood"
        aria-busy={isLoading || isSubmitting}
      >
        {MOODS.map((mood) => (
          <button
            key={mood.label}
            type="button"
            className={`dashboard-mood-button ${mood.className} ${
              selectedMood === mood.label
                ? "dashboard-mood-selected"
                : ""
            }`}
            onClick={() => void handleMoodSelect(mood.label)}
            disabled={isLoading || isSubmitting}
            aria-pressed={selectedMood === mood.label}
            aria-label={`${mood.label} mood`}
          >
            <span>{mood.label}</span>
            <span aria-hidden="true">{mood.emoji}</span>
          </button>
        ))}
      </div>

      {isLoading && (
        <p role="status" className="dashboard-mood-message">
          Loading your mood...
        </p>
      )}

      {isSubmitting && (
        <p role="status" className="dashboard-mood-message">
          Saving your mood...
        </p>
      )}

      {error && (
        <p role="alert" className="dashboard-mood-message">
          {error}
        </p>
      )}
    </section>
  );
}
