export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      {/* You can add a portal-specific navbar or header here */}
      <nav>
        {/* Basic Portal Navigation Example */}
        <div className="container mx-auto p-4 bg-gray-100">
          <p className="text-lg font-semibold">Daydreamers Client Portal</p>
          {/* Add links for portal navigation as needed */}
        </div>
      </nav>
      {children}
      {/* You can add a portal-specific footer here */}
    </section>
  );
} 