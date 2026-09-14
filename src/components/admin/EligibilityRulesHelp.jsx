export default function EligibilityRulesHelp() {
  return (
    <aside className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400 space-y-3 h-fit">
      <h3 className="font-medium text-gray-200">When is this sent?</h3>
      <ul className="space-y-1.5 text-xs list-disc list-inside marker:text-gray-500">
        <li>
          <span className="text-gray-300">Streak update</span> — replaces at-risk
          for now: <strong className="text-gray-200">9pm</strong> /{" "}
          <strong className="text-gray-200">11pm</strong> last-chance while on
          grace with no focus today. Also Sundays at{" "}
          <strong className="text-gray-200">10am</strong> for active streaks.
          Edit title/body on a <span className="text-gray-300">streak_update</span>{" "}
          template.
        </li>
        <li>
          <span className="text-gray-300">Streak milestone</span> — right after a
          pomodoro hits 3 / 7 / 14 / 30 / 50 / 100 days
        </li>
        <li>
          <span className="text-gray-300">Daily nudge</span> — around their usual
          focus hour (fallback 5pm)
        </li>
        <li>
          <span className="text-gray-300">Comeback</span> — 10am local after
          grace has ended and they&apos;ve been away
        </li>
        <li>
          <span className="text-gray-300">Focus complete</span> — after today&apos;s
          1st / 3rd / 5th / 8th pomodoro (all users)
        </li>
        <li>
          <span className="text-gray-300">Daily goal</span> — when they cross their
          daily minute goal (default 25)
        </li>
        <li>
          <span className="text-gray-300">Focus milestone</span> — lifetime minutes
          hit 100 / 500 / 1k / 2.5k / 5k / 10k
        </li>
        <li>
          <span className="text-gray-300">Weekly rank</span> — Monday 10am local
          summary of last 7 days + global rank
        </li>
        <li>
          <span className="text-gray-300">Rank passed</span> — you passed someone (or
          they passed you) on the global week board
        </li>
        <li>
          <span className="text-gray-300">Global top</span> — entered top 5 on the
          global week leaderboard
        </li>
      </ul>

      <h3 className="font-medium text-gray-200 pt-1">Who gets this template?</h3>
      <p>
        Optional filters. Use empty <code className="text-gray-300">{"{}"}</code> to allow anyone
        who receives this notification type.
      </p>

      <ul className="space-y-1.5 text-xs list-disc list-inside marker:text-gray-500">
        <li>
          <code className="text-gray-300">minStreak</code> /{" "}
          <code className="text-gray-300">maxStreak</code> — streak range
        </li>
        <li>
          <code className="text-gray-300">minDaysAway</code> /{" "}
          <code className="text-gray-300">maxDaysAway</code> — comeback timing
        </li>
        <li>
          <code className="text-gray-300">minCompletedSessions</code> — daily nudge experience
        </li>
        <li>
          <code className="text-gray-300">requiresEarlyNudge</code> — 9pm streak nudge
          (any day in the 2-day grace)
        </li>
        <li>
          <code className="text-gray-300">requiresLastChance</code> — 11pm on the{" "}
          <em>last</em> grace day only
        </li>
        <li>
          <code className="text-gray-300">showProgress</code> — set by the
          &quot;Include weekly progress&quot; checkbox (streak templates)
        </li>
        <li>
          <code className="text-gray-300">showLeaderboard</code> — set by the
          &quot;Include leaderboard graphic&quot; checkbox (weekly rank / rank
          passed / global top)
        </li>
      </ul>

      <div className="text-xs space-y-2">
        <p className="text-gray-300 font-medium">Examples</p>
        <pre className="bg-black/30 rounded p-2 overflow-x-auto text-gray-400 whitespace-pre-wrap">
          {`{ "minStreak": 3, "requiresEarlyNudge": true }`}
        </pre>
        <pre className="bg-black/30 rounded p-2 overflow-x-auto text-gray-400 whitespace-pre-wrap">
          {`{ "minDaysAway": 7 }`}
        </pre>
      </div>

      <p className="text-xs">
        Title/body variables:{" "}
        <code className="text-gray-300">{"{{username}}"}</code>,{" "}
        <code className="text-gray-300">{"{{streak}}"}</code>,{" "}
        <code className="text-gray-300">{"{{daysAway}}"}</code>,{" "}
        <code className="text-gray-300">{"{{graceDaysRemaining}}"}</code>,{" "}
        <code className="text-gray-300">{"{{today}}"}</code>,{" "}
        <code className="text-gray-300">{"{{minutes}}"}</code>,{" "}
        <code className="text-gray-300">{"{{goal}}"}</code>,{" "}
        <code className="text-gray-300">{"{{totalMinutes}}"}</code>,{" "}
        <code className="text-gray-300">{"{{weekMinutes}}"}</code>,{" "}
        <code className="text-gray-300">{"{{weekSessions}}"}</code>,{" "}
        <code className="text-gray-300">{"{{rank}}"}</code>,{" "}
        <code className="text-gray-300">{"{{rankLabel}}"}</code>{" "}
        <span className="text-gray-500">(includes #)</span>,{" "}
        <code className="text-gray-300">{"{{otherName}}"}</code>
      </p>

      <p className="text-xs text-gray-300 font-medium pt-1">If / else</p>
      <pre className="bg-black/30 rounded p-2 overflow-x-auto text-gray-400 whitespace-pre-wrap text-xs">
        {`{{#if streak > 7}}You're on a roll, {{username}}!{{else}}One day at a time.{{/if}}`}
      </pre>
      <pre className="bg-black/30 rounded p-2 overflow-x-auto text-gray-400 whitespace-pre-wrap text-xs">
        {`{{#if streak > 30}}Legend{{else if streak > 7}}Solid{{else}}Starting out{{/if}}`}
      </pre>
      <p className="text-xs text-gray-300 font-medium pt-1">Randomize</p>
      <pre className="bg-black/30 rounded p-2 overflow-x-auto text-gray-400 whitespace-pre-wrap text-xs">
        {`{{randomize{You're crushing it!|Keep going!|One more!}}}`}
      </pre>
      <p className="text-xs text-gray-500">
        Ops: <code className="text-gray-400">&gt; &gt;= &lt; &lt;= == !=</code>.
        Also bare flags like{" "}
        <code className="text-gray-400">{"{{#if isLastChance}}…{{/if}}"}</code>.
      </p>

      <p className="text-xs text-gray-500">
        Streak update / at risk / milestone emails use the weekly-progress layout.
        If templates exist for a type but none match the user, no notification is sent.
      </p>
    </aside>
  );
}
