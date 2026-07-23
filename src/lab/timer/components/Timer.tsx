import { useState, useRef, useEffect } from "react";
import * as polyfill from '@js-temporal/polyfill';
import "./Timer.scss";

if (!globalThis.Temporal) {
  (globalThis as any).Temporal = polyfill.Temporal;
}

if (!globalThis.Intl) {
  (globalThis as any).Intl = polyfill.Intl;
}

export type TimerProps = {
  Hz: number;
};

export default function Timer({ Hz = 200 }: TimerProps) {
  const expected = Temporal.Duration.from({
    microseconds: Math.trunc(1000_000 / Hz),
  });
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<Temporal.Instant | undefined>(
    undefined,
  );
  const [endTime, setEndTime] = useState<Temporal.Instant | undefined>(
    undefined,
  );
  const [totalDuration, setTotalDuration] = useState(new Temporal.Duration());
  const [pausedDuration, setPausedDuration] = useState(new Temporal.Duration());
  const [elapsedDuration, setElapsedDuration] = useState(
    new Temporal.Duration(),
  );

  const intervalRef = useRef(-1);

  const format = (duration: Temporal.Duration) => {
    return new Intl.DurationFormat("en-NZ", {
      style: "digital",
      hours: "2-digit",
    }).formatToParts(
      duration.round({ largestUnit: "hours", smallestUnit: "milliseconds" }),
    );
  };

  const onStart = () => {
    const initial = Temporal.Now.instant();
    setEndTime(initial);
    if (!startTime) {
      setStartTime(initial);
    }
    if (endTime) {
      setPausedDuration((paused) => paused.add(initial.since(endTime)));
    }

    setRunning(true);

    intervalRef.current = setInterval(() => {
      const instant = Temporal.Now.instant();
      setEndTime(instant);
    }, expected.total("milliseconds"));
  };

  const onStop = () => {
    setEndTime(Temporal.Now.instant());
    clearInterval(intervalRef.current);
    intervalRef.current = -1;
    setRunning(false);
  };

  const onReset = () => {
    setStartTime(!running ? undefined : Temporal.Now.instant());
    setEndTime(undefined);
    setTotalDuration(new Temporal.Duration());
    setPausedDuration(new Temporal.Duration());
  };

  useEffect(() => {
    setTotalDuration(
      endTime?.since(startTime ?? endTime, {
        largestUnit: "hours",
        smallestUnit: "millisecond",
      }) ?? new Temporal.Duration(),
    );
  }, [endTime, startTime]);

  useEffect(
    () => setElapsedDuration(totalDuration.subtract(pausedDuration)),
    [totalDuration, pausedDuration],
  );

  return (
    <>
      <div className="Timer">
        <time dateTime={elapsedDuration?.toJSON()}>
          {format(elapsedDuration).map((part, i) => (
            <span
              key={i}
              data-unit={part.unit}
              data-type={part.type}
              data-value={part.value}
            >
              {part.type === "integer"
                ? part.value.padStart(2, "0")
                : part.type === "fraction"
                  ? part.value.padStart(3, "0")
                  : part.value}
            </span>
          ))}
          {elapsedDuration.milliseconds ? (
            <></>
          ) : (
            <>
              <span data-unit="second" data-type="decimal" data-value=".">
                .
              </span>
              <span data-unit="second" data-type="fraction" data-value="000">
                000
              </span>
            </>
          )}
        </time>
        {running ? (
          <button title="Stop" onClick={onStop}>
            &#x23F9;
          </button>
        ) : (
          <button title="Start" onClick={onStart}>
            &#x23F5;
          </button>
        )}
        <button title="Reset" onClick={onReset}>
          &#8634;
        </button>
      </div>
    </>
  );
}
