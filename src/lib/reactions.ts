import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

export const REACTION_SLOTS = [
  { key: 'r_like', emoji: '👍' },
  { key: 'r_fire', emoji: '🔥' },
  { key: 'r_zap', emoji: '⚡' },
  { key: 'r_tada', emoji: '🎉' },
] as const;

export type ReactionKey = (typeof REACTION_SLOTS)[number]['key'];

function applyPillState(btn: HTMLButtonElement, active: boolean) {
  if (active) {
    btn.classList.add(
      'bg-[#2481cc]/15',
      'border-[#2481cc]',
      'text-[#2481cc]',
      'dark:bg-[#3ea6ff]/15',
      'dark:border-[#3ea6ff]',
      'dark:text-[#3ea6ff]'
    );
    btn.classList.remove('border-transparent', 'bg-slate-100', 'dark:bg-white/8');
  } else {
    btn.classList.remove(
      'bg-[#2481cc]/15',
      'border-[#2481cc]',
      'text-[#2481cc]',
      'dark:bg-[#3ea6ff]/15',
      'dark:border-[#3ea6ff]',
      'dark:text-[#3ea6ff]'
    );
    btn.classList.add('border-transparent', 'bg-slate-100', 'dark:bg-white/8');
  }
}

export async function hydrateReactionContainer(container: HTMLElement) {
  const statId = container.getAttribute('data-stat-id');
  if (!statId) return;

  const buttons = container.querySelectorAll<HTMLButtonElement>('[data-reaction-key]');
  buttons.forEach((btn) => {
    const key = btn.getAttribute('data-reaction-key') as ReactionKey;
    const isActive = localStorage.getItem(`react:${statId}:${key}`) === '1';
    applyPillState(btn, isActive);

    if (!btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        if (!isFirebaseConfigured || !db) return;
        const storageKey = `react:${statId}:${key}`;
        const wasActive = localStorage.getItem(storageKey) === '1';
        const delta = wasActive ? -1 : 1;

        const emojiEl = btn.querySelector<HTMLElement>('.rx-emoji');
        const countEl = btn.querySelector<HTMLElement>('.rx-count');
        const current = Number(countEl?.textContent || '0');
        const nextVal = Math.max(0, current + delta);

        // Toggle local state & UI cleanly
        if (wasActive) {
          localStorage.removeItem(storageKey);
        } else {
          localStorage.setItem(storageKey, '1');
        }
        applyPillState(btn, !wasActive);

        if (emojiEl && !wasActive) {
          emojiEl.classList.remove('animate-tg-emoji');
          void emojiEl.offsetWidth;
          emojiEl.classList.add('animate-tg-emoji');
        }
        if (countEl) {
          countEl.textContent = String(nextVal);
          countEl.classList.remove('animate-tg-odometer');
          void countEl.offsetWidth;
          countEl.classList.add('animate-tg-odometer');
        }

        try {
          const statsRef = doc(db, 'posts_stats', statId);
          const snap = await getDoc(statsRef);
          if (!snap.exists()) {
            if (delta === 1) {
              await setDoc(statsRef, {
                [key]: 1,
                updatedAt: serverTimestamp(),
              });
            }
          } else {
            await updateDoc(statsRef, {
              [key]: increment(delta),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.warn('[Reactions] Toggle failed:', err);
        }
      });
    }
  });

  if (!isFirebaseConfigured || !db) return;

  try {
    const snap = await getDoc(doc(db, 'posts_stats', statId));
    if (!snap.exists()) return;
    const data = snap.data();
    buttons.forEach((btn) => {
      const key = btn.getAttribute('data-reaction-key') as ReactionKey;
      const countEl = btn.querySelector<HTMLElement>('.rx-count');
      if (countEl && typeof data[key] === 'number') {
        countEl.textContent = String(Math.max(0, data[key]));
      }
    });
  } catch {
    // Silent fallback
  }
}

export function renderReactionPillsHtml(statId: string): string {
  return `
    <div class="tg-reactions flex flex-wrap items-center gap-1.5" data-stat-id="${statId}">
      ${REACTION_SLOTS.map(
        (slot) => `
          <button
            type="button"
            data-reaction-key="${slot.key}"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-slate-200 hover:bg-[#2481cc]/10 dark:hover:bg-[#3ea6ff]/15 transition-colors cursor-pointer select-none"
          >
            <span class="rx-emoji leading-none">${slot.emoji}</span>
            <span class="rx-count tabular-nums text-[11px]">0</span>
          </button>
        `
      ).join('')}
    </div>
  `;
}
