"use client";

import AppShell from "@/components/AppShell";
import styles from "./feedback.module.css";
import { useState } from "react";
import { MessageSquare, Send, Star, CheckCircle, Bug, Lightbulb, Palette, Zap, HelpCircle } from "lucide-react";

const CATEGORIES = [
  { key: "bug", label: "Bug Report", icon: Bug },
  { key: "feature", label: "Feature Request", icon: Lightbulb },
  { key: "ui", label: "UI / Design", icon: Palette },
  { key: "performance", label: "Performance", icon: Zap },
  { key: "other", label: "Other", icon: HelpCircle },
];

export default function FeedbackPage() {
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = category && subject.trim().length >= 3 && message.trim().length >= 10 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
          email: email.trim() || undefined,
          rating: rating || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setCategory("");
    setSubject("");
    setMessage("");
    setEmail("");
    setRating(0);
    setSubmitted(false);
    setError("");
  };

  if (submitted) {
    return (
      <AppShell active="feedback" title="Feedback" subtitle="">
        <div className="stack">
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <CheckCircle size={24} />
            </div>
            <div className={styles.successTitle}>Thanks for your feedback!</div>
            <div className={styles.successBody}>
              We read every submission and use it to make Curly Sports better. You&apos;ll hear back if we need more info.
            </div>
            <button className={styles.successBtn} onClick={reset}>
              Send another
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="feedback" title="Feedback" subtitle="">
      <div className="stack">
        <div className={styles.header}>
          <MessageSquare size={18} className="title-icon" />
          <div>
            <div className={styles.headerTitle}>Send Feedback</div>
            <div className={styles.headerSub}>Help us improve Curly Sports</div>
          </div>
        </div>

        <div className={styles.formCard}>
          {/* Category */}
          <div className={styles.categoryLabel}>Category</div>
          <div className={styles.categoryRow}>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  className={`${styles.categoryChip} ${category === cat.key ? styles.categoryChipActive : ""}`}
                  onClick={() => setCategory(cat.key)}
                >
                  <Icon size={14} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className={styles.fieldGroup}>
            {/* Subject */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Subject</label>
              <input
                className={styles.fieldInput}
                type="text"
                placeholder="Brief summary of your feedback"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
              />
            </div>

            {/* Message */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Message</label>
              <textarea
                className={styles.fieldTextarea}
                placeholder="Tell us more... (min 10 characters)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
              />
              <span className={styles.charCount}>{message.length}/2000</span>
            </div>

            {/* Email */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Email (optional)</label>
              <input
                className={styles.fieldInput}
                type="email"
                placeholder="your@email.com — so we can follow up"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Rating */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Rate your experience</label>
              <div className={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`${styles.starBtn} ${n <= (hoverRating || rating) ? styles.starBtnActive : ""}`}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(n === rating ? 0 : n)}
                  >
                    <Star size={16} fill={n <= (hoverRating || rating) ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className={styles.submitRow}>
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={!canSubmit}>
                <Send size={15} />
                {submitting ? "Sending..." : "Submit Feedback"}
              </button>
              {error && <span className={styles.errorMsg}>{error}</span>}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
