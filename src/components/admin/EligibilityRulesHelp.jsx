export default function EligibilityRulesHelp() {
  return (
    <aside className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400 space-y-3 h-fit">
      <h3 className="font-medium text-gray-200">Who gets this template?</h3>
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
          <code className="text-gray-300">requiresEarlyNudge</code> — 9pm streak nudge only
        </li>
        <li>
          <code className="text-gray-300">requiresLastChance</code> — 11pm streak nudge only
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
        <code className="text-gray-300">{"{{streak}}"}</code>,{" "}
        <code className="text-gray-300">{"{{daysAway}}"}</code>,{" "}
        <code className="text-gray-300">{"{{today}}"}</code>
      </p>

      <p className="text-xs text-gray-500">
        If templates exist for a type but none match the user, no notification is sent.
      </p>
    </aside>
  );
}
