interface ShortTermGoal {
  title: string;
  description: string;
}

interface ReportCardGoalsProps {
  shortTermGoals?: ShortTermGoal[];
}

export function ReportCardGoals({ shortTermGoals }: ReportCardGoalsProps) {
  if (!shortTermGoals || !shortTermGoals.length) return null;

  return (
    <div className="space-y-2">
      <h2>Short Term Goals</h2>
      <div className="space-y-6">
        {shortTermGoals.map((goal, index) => (
          <div
            key={index}
            className="bg-[#F8FCFD] border-2 border-[#80CDDE] rounded-xl p-6"
          >
            <div className="font-medium">{goal.title}</div>
            <div className="text-gray-600 mt-1">{goal.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 