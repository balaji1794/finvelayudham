'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function WealthSubNav() {
  const pathname = usePathname();

  const links = [
    { label: 'Assets', href: '/assets' },
    { label: 'Liabilities', href: '/liabilities' },
    { label: 'Snapshots', href: '/snapshots' },
    { label: 'Allocation', href: '/allocation' },
  ];

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm lg:relative lg:z-auto lg:bg-transparent lg:backdrop-blur-none mb-3 sm:mb-4">
      <div className="relative">
        <nav
          className="flex border-b border-border gap-0 lg:gap-6 overflow-x-auto lg:overflow-visible no-scrollbar"
          aria-label="Section navigation"
        >
          {links.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                data-active={isActive}
                className={`relative pb-2.5 text-sm transition-colors whitespace-nowrap text-center flex-1 lg:flex-none px-3 lg:px-0 ${
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

