import { useEffect, RefObject } from "react";

type Event = MouseEvent | TouchEvent;

export const useOnClickOutside = (
  ref: RefObject<HTMLElement>,
  handler: (event: Event) => void
) => {
  useEffect(() => {
    const listener = (event: Event) => {
      const el = ref?.current;
      // Không làm gì nếu click vào chính ref's element hoặc các element con của nó
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
};
