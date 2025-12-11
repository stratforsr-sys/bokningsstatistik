'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 100,
  minimum: 0.08,
  easing: 'ease',
  speed: 200,
});

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Start progress on mount (route change)
    NProgress.start();

    // Complete progress after a short delay
    const timeout = setTimeout(() => {
      NProgress.done();
    }, 100);

    return () => {
      clearTimeout(timeout);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  return null;
}
