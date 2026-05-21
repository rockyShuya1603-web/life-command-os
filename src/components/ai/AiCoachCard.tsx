"use client";

export type AiCoachMood =
  | "normal"
  | "happy"
  | "tired"
  | "warning"
  | "rankup"
  | "praise"
  | "recovery"
  | "fire";

type Props = {
  title?: string;
  mood: AiCoachMood;
  message: string;
  comment?: string;
  buttonLabel?: string;
  onAction?: () => void | Promise<void>;
};

const moodColor: Record<AiCoachMood, string> = {
  normal: "#94a3b8",
  happy: "#f9a8d4",
  tired: "#c4b5fd",
  warning: "#fbbf24",
  rankup: "#fde047",
  praise: "#6ee7b7",
  recovery: "#7dd3fc",
  fire: "#fb923c",
};

const moodLabel: Record<AiCoachMood, string> = {
  normal: "STANDBY",
  happy: "HAPPY",
  tired: "TIRED",
  warning: "WARNING",
  rankup: "RANK UP",
  praise: "PRAISE",
  recovery: "RECOVERY",
  fire: "FIRE",
};

export function AiCoachCard({
  title = "AIコーチ",
  mood,
  message,
  comment,
  buttonLabel,
  onAction,
}: Props) {
  const accent = moodColor[mood];

  return (
    <section
      className="aiCoachCard"
      style={{
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${accent}`,
        borderRadius: 28,
        padding: 20,
        background:
          "radial-gradient(circle at top left, rgba(255,255,255,.12), transparent 30%), rgba(15,23,42,0.9)",
        boxShadow: `0 0 48px ${accent}44`,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${accent}18, transparent 45%)`,
          pointerEvents: "none",
        }}
      />


      <style>{`
        .aiCoachGrid {
          position: relative;
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 18px;
          align-items: center;
        }
        @media (max-width: 820px) {
          /* AI COACH MOBILE COMPACT FIX */
          .aiCoachCard {
            border-radius: 24px !important;
            padding: 14px !important;
            margin-bottom: 12px !important;
            min-height: 0 !important;
          }
          .aiCoachGrid {
            grid-template-columns: 1fr !important;
            gap: 9px !important;
            align-items: center !important;
            justify-items: center !important;
            max-width: 100% !important;
            overflow: hidden !important;
            text-align: center !important;
          }
          .aiCoachImage {
            width: 78px !important;
            height: 78px !important;
            border-radius: 22px !important;
            justify-self: center !important;
          }
          .aiCoachGrid > div {
            width: 100% !important;
            min-width: 0 !important;
          }
          .aiCoachGrid > div > div:first-child {
            justify-content: center !important;
            gap: 6px !important;
            margin-bottom: 6px !important;
          }
          .aiCoachGrid > div > div:first-child span:first-child {
            font-size: 15px !important;
            line-height: 1.25 !important;
            letter-spacing: 0 !important;
          }
          .aiCoachGrid > div > div:first-child span:last-child {
            font-size: 10px !important;
            padding: 3px 9px !important;
          }
          .aiCoachMessage {
            font-size: clamp(17px, 5.2vw, 22px) !important;
            line-height: 1.42 !important;
            word-break: normal !important;
            overflow-wrap: anywhere !important;
            text-align: left !important;
            margin-top: 4px !important;
          }
          .aiCoachCard p {
            line-height: 1.55 !important;
            font-size: 13px !important;
            text-align: left !important;
          }
          .aiCoachCard button {
            width: 100% !important;
            min-height: 48px !important;
            border-radius: 16px !important;
            font-size: 15px !important;
          }
          .aiCoachCard * { max-width: 100%; box-sizing: border-box; }
        }
        @media (max-width: 390px) {
          .aiCoachImage {
            width: 82px !important;
            height: 82px !important;
          }
          .aiCoachMessage {
            font-size: 16px !important;
            line-height: 1.42 !important;
          }
        }
      `}</style>
      <div className="aiCoachGrid">
        <img
          className="aiCoachImage"
          src="/ai-coach.png"
          alt="AI Coach"
          style={{
            width: 120,
            height: 120,
            objectFit: "cover",
            borderRadius: 28,
            border: `2px solid ${accent}`,
            boxShadow: `0 0 28px ${accent}66`,
          }}
        />

        <div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                color: accent,
                fontWeight: 900,
                letterSpacing: ".04em",
              }}
            >
              {title}
            </span>

            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${accent}`,
                color: accent,
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              {moodLabel[mood]}
            </span>
          </div>

          <h2
            className="aiCoachMessage"
            style={{
              color: "white",
              fontSize: "clamp(20px, 4vw, 28px)",
              lineHeight: 1.35,
              margin: 0,
            }}
          >
            {message}
          </h2>

          {comment && (
            <p
              style={{
                color: "#cbd5e1",
                marginTop: 10,
                marginBottom: 0,
                lineHeight: 1.75,
              }}
            >
              {comment}
            </p>
          )}

          {buttonLabel && onAction && (
            <button
              onClick={() => void onAction()}
              style={{
                marginTop: 16,
                padding: "10px 16px",
                borderRadius: 14,
                border: `1px solid ${accent}`,
                background: accent,
                color: "#020617",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {buttonLabel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default AiCoachCard;
