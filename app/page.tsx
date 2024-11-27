import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6">
        <Link href="/clients/new">
          <Button>New Client</Button>
        </Link>
        <Link href="/report-cards/new">
          <Button>New Report Card</Button>
        </Link>
        <Link href="/settings">
          <Button variant="outline">Settings</Button>
        </Link>
      </div>
    </div>
  );
}
