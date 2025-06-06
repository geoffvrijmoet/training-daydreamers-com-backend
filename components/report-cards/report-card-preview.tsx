import Image from "next/image";

interface KeyConcept {
  title: string;
  description: string;
  category?: string;
}

interface PreviewProps {
  date: string;
  clientName?: string;
  dogName?: string;
  summary: string;
  selectedItems: {
    category: string;
    items: KeyConcept[];
  }[];
  productRecommendations: string[];
  shortTermGoals?: {
    title: string;
    description: string;
  }[];
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

// Add helper function to get last name
function getLastName(fullName: string): string {
  const nameParts = fullName.trim().split(' ');
  return nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
}

export function ReportCardPreview({
  date,
  clientName = "",
  dogName = "",
  summary,
  selectedItems,
  productRecommendations,
  shortTermGoals = []
}: PreviewProps) {
  const clientLastName = getLastName(clientName);
  
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
          <span className="font-medium">Dog&apos;s Name:</span> {dogName} {clientLastName}
        </p>
        <p>
          <span className="font-medium">Date:</span> {date}
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-medium">Summary:</p>
        <p className="whitespace-pre-wrap">{summary}</p>
      </div>

      {selectedItems.length > 0 && selectedItems.map(group => (
        <div key={group.category} className="space-y-2">
          <p className="font-medium">{group.category}:</p>
          <ul className="list-disc pl-5 space-y-1">
            {group.items.map((item, index) => {
              const { text, links } = formatHtmlContent(item.description);
              return (
                <li key={index}>
                  <span className="font-medium">{item.title}</span>:{' '}
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
      ))}

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

      {shortTermGoals.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Short Term Goals:</p>
          <div className="space-y-4">
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
      )}
    </div>
  );
} 