import React from 'react';

export interface ReportCardEmailProps {
  clientName: string;
  dogName?: string;
  date: string; // YYYY-MM-DD
  summary: string;
  selectedItemGroups: Array<{
    category: string;
    items: Array<{
      title: string;
      description: string;
      url?: string;
    }>;
  }>;
  productRecommendations?: Array<{
    title: string;
    description: string;
    url?: string;
  }>;
  shortTermGoals?: Array<{
    title: string;
    description: string;
  }>;
  additionalContacts?: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
}

export function ReportCardEmail({
  clientName,
  // dogName intentionally unused in the email body
  date,
  summary,
  selectedItemGroups,
  productRecommendations = [],
  shortTermGoals = [],
  additionalContacts = [],
}: ReportCardEmailProps) {
  // Format date - ensure it's interpreted as Eastern time
  const [year, month, day] = date.split('-').map(Number);
  const easternDate = new Date(year, month - 1, day); // month is 0-indexed
  const formattedDate = easternDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const containerStyle: React.CSSProperties = {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#111111',
    lineHeight: 1.5,
    maxWidth: 680,
    margin: '0 auto',
  };

  const h2Style: React.CSSProperties = {
    margin: '24px 0 8px 0',
    fontSize: 20,
    fontWeight: 700,
  };

  const h3Style: React.CSSProperties = {
    margin: '16px 0 8px 0',
    fontSize: 16,
    fontWeight: 600,
  };

  const liStyle: React.CSSProperties = { marginBottom: 8 };
  const ulStyle: React.CSSProperties = {
    margin: '0 0 0 20px',
    padding: 0,
    listStyleType: 'disc',
  };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={process.env.EMAIL_LOGO_URL || 'https://admin.training.daydreamersnyc.com/images/report-card-training-transp-bg.png'}
          alt="Daydreamers Dog Training"
          style={{ maxWidth: 500, height: 'auto' }}
        />
      </div>

      <p style={{ margin: '0 0 16px 0' }}>
        Hi {clientName}
        {additionalContacts.length > 0 && (
          <>
            {additionalContacts.length === 1 ? ' and ' : ', '}
            {additionalContacts.map((contact, index) => {
              if (index === additionalContacts.length - 1 && additionalContacts.length > 1) {
                return ` and ${contact.name}`;
              }
              return contact.name + (index < additionalContacts.length - 2 ? ', ' : '');
            }).join('')}
          </>
        )}
        ,
      </p>
      <p style={{ margin: '0 0 24px 0' }}>
        Here is the report card for your recent training session on{' '}
        <strong>{formattedDate}</strong>.
      </p>

      <h2 style={h2Style}>Summary</h2>
      <div 
        style={{ margin: '0 0 16px 0' }}
        dangerouslySetInnerHTML={{ 
          __html: summary
            .replace(/<p>/g, '<p style="margin: 0 0 12px 0; padding: 0;">')
            .replace(/<ul>/g, '<ul style="margin: 0 0 12px 0; padding-left: 20px; list-style-type: disc;">')
            .replace(/<ol>/g, '<ol style="margin: 0 0 12px 0; padding-left: 20px; list-style-type: decimal;">')
            .replace(/<a /g, '<a style="color: #3b82f6; text-decoration: underline;" ')
        }}
      />

      {productRecommendations.length > 0 && (
        <div>
          <h3 style={h3Style}>Product Recommendations</h3>
          <ul style={ulStyle}>
            {productRecommendations.map((product, idx) => {
              const hasDesc = (product.description || '').replace(/<[^>]*>/g, '').trim().length > 0;
              return (
                <li key={idx} style={liStyle}>
                  {product.url ? (
                    hasDesc ? (
                      <>
                        <a href={product.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                          <strong>{product.title}</strong>
                        </a>
                        :{' '}
                        <span
                          dangerouslySetInnerHTML={{
                            __html: (product.description || '')
                              .replace(/<p>\s*<\/p>/g, '')
                              .replace(/<p><\/p>/g, '')
                              .replace(/<p>/g, '<p style="margin: 0 0 12px 0; padding: 0;">')
                          }}
                        />
                      </>
                    ) : (
                      <a href={product.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                        <strong>{product.title}</strong>
                      </a>
                    )
                  ) : (
                    <>
                      <strong>{product.title}</strong>
                      {hasDesc && (
                        <>
                          :{' '}
                          <span
                            dangerouslySetInnerHTML={{
                              __html: (product.description || '')
                                .replace(/<p>\s*<\/p>/g, '')
                                .replace(/<p><\/p>/g, '')
                                .replace(/<p>/g, '<p style="margin: 0 0 12px 0; padding: 0;">')
                            }}
                          />
                        </>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {selectedItemGroups.map((group) => (
        <div key={group.category}>
          <h3 style={h3Style}>{group.category}</h3>
          <ul style={ulStyle}>
            {group.items.map((item, idx) => {
              const hasDesc = (item.description || '').replace(/<[^>]*>/g, '').trim().length > 0;
              return (
                <li key={idx} style={liStyle}>
                  {item.url ? (
                    hasDesc ? (
                      <>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                          <strong>{item.title}</strong>
                        </a>
                        :{' '}
                        <span
                          dangerouslySetInnerHTML={{
                            __html: (item.description || '')
                              .replace(/<p>\s*<\/p>/g, '')
                              .replace(/<p><\/p>/g, '')
                              .replace(/<p>/g, '<p style="margin: 0 0 12px 0; padding: 0;">')
                          }}
                        />
                      </>
                    ) : (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                        <strong>{item.title}</strong>
                      </a>
                    )
                  ) : (
                    <>
                      <strong>{item.title}</strong>
                      {hasDesc && (
                        <>
                          :{' '}
                          <span
                            dangerouslySetInnerHTML={{
                              __html: (item.description || '')
                                .replace(/<p>\s*<\/p>/g, '')
                                .replace(/<p><\/p>/g, '')
                                .replace(/<p>/g, '<p style="margin: 0 0 12px 0; padding: 0;">')
                            }}
                          />
                        </>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {shortTermGoals.length > 0 && (
        <>
          <h2 style={h2Style}>Short Term Goals</h2>
          <ul style={ulStyle}>
            {shortTermGoals.map((goal, idx) => (
              <li key={idx} style={liStyle}>
                <strong>{goal.title}</strong>: {goal.description}
              </li>
            ))}
          </ul>
        </>
      )}

      <p style={{ marginTop: 32 }}>
        Thank you!
        <br />
        Madeline
      </p>
    </div>
  );
} 