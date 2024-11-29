import Image from "next/image";

interface KeyConcept {
  title: string;
  description: string;
}

interface PreviewProps {
  date: string;
  clientName?: string;
  dogName?: string;
  summary: string;
  keyConcepts: KeyConcept[];
  productRecommendations: string[];
}

// Helper function to safely render HTML content
function formatHtmlContent(html: string) {
  // First, create a temporary div to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get clean text
  const text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Get all links
  const links = Array.from(tempDiv.getElementsByTagName('a')).map(a => ({
    text: a.textContent || '',
    href: a.href
  }));
  
  return { text, links };
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
    <div className="border rounded-lg p-6 bg-white space-y-4 w-full max-w-2xl font-fredoka font-light">
      <div className="flex justify-center mb-6">
        <div className="relative h-[100px] w-[400px]">
          <Image
            src="/images/report-card-training-transp-bg.png"
            alt="Daydreamers Dog Training"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <p>
          <span className="font-medium">Dog's Name:</span> {dogName}
        </p>
        <p>
          <span className="font-medium">Date:</span> {date}
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-medium">Summary:</p>
        <p className="whitespace-pre-wrap">{summary}</p>
      </div>

      {keyConcepts.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Key Concepts:</p>
          <ul className="list-disc pl-5 space-y-1">
            {keyConcepts.map((concept, index) => {
              const { text, links } = formatHtmlContent(concept.description);
              return (
                <li key={index}>
                  <span className="font-medium">{concept.title}</span>:{' '}
                  <span>
                    {links.length > 0 ? (
                      text.split('').map((char, i) => {
                        const link = links.find(l => 
                          l.text.includes(char) && 
                          text.indexOf(l.text) <= i && 
                          text.indexOf(l.text) + l.text.length > i
                        );
                        
                        if (link) {
                          return (
                            <a 
                              key={i}
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {char}
                            </a>
                          );
                        }
                        return char;
                      })
                    ) : (
                      text
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {productRecommendations.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Product Recommendations:</p>
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