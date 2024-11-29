interface PreviewProps {
  date: string;
  clientName?: string;
  dogName?: string;
  summary: string;
  keyConcepts: string[];
  productRecommendations: string[];
}

export function ReportCardPreview({
  date,
  clientName = "",
  dogName = "",
  summary,
  keyConcepts,
  productRecommendations
}: PreviewProps) {
  return (
    <div className="border rounded-lg p-6 bg-white space-y-4 w-full max-w-2xl">
      <div className="flex justify-center mb-6">
        <div className="h-[100px] w-[400px] bg-gray-100 flex items-center justify-center text-gray-400">
          [Logo Placeholder]
        </div>
      </div>
      
      <div className="space-y-2">
        <p><strong>Dog's Name:</strong> {dogName}</p>
        <p><strong>Date:</strong> {date}</p>
      </div>

      <div className="space-y-2">
        <p><strong>Summary:</strong></p>
        <p className="whitespace-pre-wrap">{summary}</p>
      </div>

      {keyConcepts.length > 0 && (
        <div className="space-y-2">
          <p><strong>Key Concepts:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            {keyConcepts.map((concept, index) => (
              <li key={index}>{concept}</li>
            ))}
          </ul>
        </div>
      )}

      {productRecommendations.length > 0 && (
        <div className="space-y-2">
          <p><strong>Product Recommendations:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            {productRecommendations.map((product, index) => (
              <li key={index}>{product}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 