import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Search, Pin, PinOff, Play, RefreshCw } from 'lucide-react';
import { AppShortcut } from '../../types/launcher';
import { renderDefaultAppIcon } from '../BottomDock';

interface AppDrawerModalProps {
  allApps: AppShortcut[];
  onClose: () => void;
  onLaunchApp: (app: AppShortcut) => void;
  onToggleDockPin: (appId: string) => void;
  onRefreshInstalledApps?: () => void;
}

/**
 * Checks whether the target element (or its enclosing app card) is completely within
 * the visible viewport area of the scrollable list container by comparing its
 * boundingClientRect against the container's boundingClientRect and dimensions.
 * If partially hidden or out of view, triggers container.scrollTo({ behavior: 'smooth' })
 * before focus is applied.
 */
export function ensureElementVisibleInContainer(
  container: HTMLElement | null,
  targetElement: HTMLElement | null
): boolean {
  if (!container || !targetElement || !container.contains(targetElement)) {
    return false;
  }

  const cardElement =
    (targetElement.closest('[data-app-card="true"]') as HTMLElement | null) ||
    targetElement;

  const containerRect = container.getBoundingClientRect();
  const cardRect = cardElement.getBoundingClientRect();

  const containerHeight = container.clientHeight || containerRect.height;
  const containerWidth = container.clientWidth || containerRect.width;

  const padY = 20;
  const padX = 16;

  // Relative coordinates of the card inside the container's visible viewport
  const relativeTop = cardRect.top - containerRect.top;
  const relativeBottom = cardRect.bottom - containerRect.top;
  const relativeLeft = cardRect.left - containerRect.left;
  const relativeRight = cardRect.right - containerRect.left;

  const isPartiallyHiddenTop = relativeTop < padY;
  const isPartiallyHiddenBottom = relativeBottom > containerHeight - padY;
  const isPartiallyHiddenLeft = relativeLeft < padX;
  const isPartiallyHiddenRight = relativeRight > containerWidth - padX;

  if (
    !isPartiallyHiddenTop &&
    !isPartiallyHiddenBottom &&
    !isPartiallyHiddenLeft &&
    !isPartiallyHiddenRight
  ) {
    return false;
  }

  let nextScrollTop = container.scrollTop;
  let nextScrollLeft = container.scrollLeft;

  if (isPartiallyHiddenTop) {
    nextScrollTop = container.scrollTop + (relativeTop - padY);
  } else if (isPartiallyHiddenBottom) {
    nextScrollTop = container.scrollTop + (relativeBottom - (containerHeight - padY));
  }

  if (isPartiallyHiddenLeft) {
    nextScrollLeft = container.scrollLeft + (relativeLeft - padX);
  } else if (isPartiallyHiddenRight) {
    nextScrollLeft = container.scrollLeft + (relativeRight - (containerWidth - padX));
  }

  const maxScrollTop = Math.max(0, container.scrollHeight - containerHeight);
  const maxScrollLeft = Math.max(0, container.scrollWidth - containerWidth);

  const clampedTop = Math.max(0, Math.min(maxScrollTop, nextScrollTop));
  const clampedLeft = Math.max(0, Math.min(maxScrollLeft, nextScrollLeft));

  if (typeof container.scrollTo === 'function') {
    container.scrollTo({
      top: clampedTop,
      left: clampedLeft,
      behavior: 'smooth',
    });
  } else {
    container.scrollTop = clampedTop;
    container.scrollLeft = clampedLeft;
  }

  return true;
}

export const AppDrawerModal: React.FC<AppDrawerModalProps> = ({
  allApps,
  onClose,
  onLaunchApp,
  onToggleDockPin,
  onRefreshInstalledApps,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'alpha' | 'default'>('default');

  const modalRef = useRef<HTMLDivElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  const installedApps = allApps.filter(app => app.isInstalled !== false);

  let filtered = installedApps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sortBy === 'alpha') {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }

  // Scroll container to reveal element before applying focus
  const focusItemWithSmoothScroll = useCallback((nextEl: HTMLElement | null) => {
    if (!nextEl) return;
    ensureElementVisibleInContainer(gridContainerRef.current, nextEl);
    nextEl.focus({ preventScroll: true });
  }, []);

  // Focus first app card on open
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const firstBtn = gridContainerRef.current?.querySelector<HTMLElement>(
        'button[data-app-primary-btn="true"]'
      );
      if (firstBtn) {
        focusItemWithSmoothScroll(firstBtn);
      }
    }, 30);
    return () => window.clearTimeout(timer);
  }, [focusItemWithSmoothScroll]);

  // D-Pad 2D Grid Navigation: checks viewport visibility and calls scrollTo BEFORE applying focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key !== 'ArrowUp' &&
        e.key !== 'ArrowDown' &&
        e.key !== 'ArrowLeft' &&
        e.key !== 'ArrowRight'
      ) {
        return;
      }

      const modalEl = modalRef.current;
      if (!modalEl) return;

      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && activeEl.tagName === 'INPUT') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          return;
        }
      }

      const focusables = Array.from(
        modalEl.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex="0"]'
        )
      ).filter(el => el.offsetParent !== null);

      if (focusables.length === 0) return;

      e.preventDefault();
      e.stopPropagation();

      const currentIndex = activeEl ? focusables.indexOf(activeEl) : -1;
      if (currentIndex === -1) {
        focusItemWithSmoothScroll(focusables[0]);
        return;
      }

      const currentRect = activeEl!.getBoundingClientRect();
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      let nextCandidate: HTMLElement | null = null;
      let bestScore = Number.POSITIVE_INFINITY;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const isDown = e.key === 'ArrowDown';
        for (const candidate of focusables) {
          if (candidate === activeEl) continue;
          const rect = candidate.getBoundingClientRect();
          const centerY = rect.top + rect.height / 2;
          const centerX = rect.left + rect.width / 2;
          const dy = centerY - currentCenterY;

          if (isDown && dy <= 16) continue;
          if (!isDown && dy >= -16) continue;

          const score = Math.abs(dy) * 2.5 + Math.abs(centerX - currentCenterX);
          if (score < bestScore) {
            bestScore = score;
            nextCandidate = candidate;
          }
        }
      } else {
        const isRight = e.key === 'ArrowRight';
        for (const candidate of focusables) {
          if (candidate === activeEl) continue;
          const rect = candidate.getBoundingClientRect();
          const centerY = rect.top + rect.height / 2;
          const centerX = rect.left + rect.width / 2;
          const dx = centerX - currentCenterX;
          const absDy = Math.abs(centerY - currentCenterY);

          if (absDy > 36) continue;
          if (isRight && dx <= 4) continue;
          if (!isRight && dx >= -4) continue;

          const score = Math.abs(dx) + absDy * 3;
          if (score < bestScore) {
            bestScore = score;
            nextCandidate = candidate;
          }
        }
      }

      if (!nextCandidate) {
        const fallbackIdx =
          e.key === 'ArrowDown' || e.key === 'ArrowRight'
            ? (currentIndex + 1) % focusables.length
            : (currentIndex - 1 + focusables.length) % focusables.length;
        nextCandidate = focusables[fallbackIdx];
      }

      // Check viewport bounds and trigger scrollTo BEFORE applying focus to the next item
      focusItemWithSmoothScroll(nextCandidate);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [focusItemWithSmoothScroll]);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6 select-none"
    >
      <div className="relative w-full max-w-5xl h-[84vh] rounded-3xl bg-slate-900/95 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-black text-white tracking-tight">Apps</h2>
            <span className="text-xs bg-slate-800 text-cyan-300 font-bold px-2.5 py-0.5 rounded-full border border-white/10">
              {filtered.length}
            </span>
          </div>

          <div className="flex items-center space-x-3 flex-1 max-w-xs mx-4">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onRefreshInstalledApps && (
              <button
                onClick={onRefreshInstalledApps}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 focus:ring-2 focus:ring-cyan-400 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
                title="Refresh Installed Apps"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setSortBy(sortBy === 'alpha' ? 'default' : 'alpha')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold focus:ring-2 focus:ring-cyan-400 transition-colors cursor-pointer ${
                sortBy === 'alpha'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {sortBy === 'alpha' ? 'A–Z' : 'Default'}
            </button>

            <button
              onClick={onClose}
              aria-label="Close Apps"
              className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 focus:ring-2 focus:ring-cyan-400 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Apps Grid Container */}
        <div
          ref={gridContainerRef}
          onFocusCapture={e => {
            ensureElementVisibleInContainer(
              gridContainerRef.current,
              e.target as HTMLElement
            );
          }}
          className="flex-1 overflow-y-auto scroll-smooth pt-4 pb-4 px-1"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {filtered.map((app, index) => (
              <div
                key={app.id}
                data-app-card="true"
                className="p-3.5 rounded-2xl bg-slate-950/85 border border-white/10 hover:border-cyan-400/60 focus-within:border-cyan-400 focus-within:bg-slate-900/95 focus-within:scale-[1.02] focus-within:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-200 ease-out flex flex-col justify-between"
              >
                <div className="flex items-center space-x-3 mb-3">
                  {renderDefaultAppIcon(app, 'drawer')}
                  <h3 className="text-sm font-bold text-white truncate flex-1">{app.name}</h3>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-white/5">
                  <button
                    data-app-primary-btn={index === 0 ? 'true' : undefined}
                    onClick={() => onLaunchApp(app)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-300 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Open</span>
                  </button>

                  <button
                    onClick={() => onToggleDockPin(app.id)}
                    title={app.inDock ? 'Unpin from Dock' : 'Pin to Dock'}
                    className={`p-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-colors cursor-pointer ${
                      app.inDock
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 hover:bg-red-950 hover:text-red-400'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {app.inDock ? (
                      <PinOff className="w-3.5 h-3.5" />
                    ) : (
                      <Pin className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
