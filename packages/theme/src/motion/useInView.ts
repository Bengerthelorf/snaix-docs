import { useEffect, useRef, useState, type RefObject } from 'react';

export interface UseInViewOptions extends IntersectionObserverInit {
  reArm?: boolean;
}

export function useInView<T extends Element = HTMLDivElement>(
  options: UseInViewOptions = {},
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const { reArm, ...ioOpts } = options;

    const check = () => {
      if (done || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh && r.bottom > 0) {
        done = true;
        setInView(true);
        io.disconnect();
        window.removeEventListener('scroll', check, true);
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !done) {
        done = true;
        setInView(true);
        io.disconnect();
        window.removeEventListener('scroll', check, true);
      }
    }, { threshold: 0.2, ...ioOpts });
    io.observe(el);

    const fallback = window.setTimeout(check, 400);
    window.addEventListener('scroll', check, { passive: true, capture: true });

    return () => {
      done = true;
      io.disconnect();
      window.clearTimeout(fallback);
      window.removeEventListener('scroll', check, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}
