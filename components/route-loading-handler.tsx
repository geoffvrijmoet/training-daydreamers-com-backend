'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Removes the `.cursor-loading` class once the route has changed
 * (i.e., navigation finished). We add the class on click handlers.
 */
export default function RouteLoadingHandler() {
  const pathname = usePathname();

  useEffect(() => {
    // Whenever the pathname updates (navigation complete), clear the cursor.
    document.body.classList.remove('cursor-loading');
  }, [pathname]);

  return null;
}