import { useState, useRef, useCallback } from 'react';

const useLongPress = (onLongPress, onClick, { shouldPreventDefault = true, delay = 500 } = {}) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef();
  const target = useRef();
  const startCoord = useRef({ x: 0, y: 0 });
  const isScrolling = useRef(false);

  const start = useCallback(
    (event) => {
      if (shouldPreventDefault && event.target) {
        target.current = event.target;
      }
      
      // Track start position
      const touch = event.touches ? event.touches[0] : event;
      startCoord.current = { x: touch.clientX, y: touch.clientY };
      isScrolling.current = false;

      timeout.current = setTimeout(() => {
        // Only trigger long press if we haven't scrolled
        if (!isScrolling.current) {
            onLongPress(event);
            setLongPressTriggered(true);
        }
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const move = useCallback((event) => {
      // If we already know we are scrolling, ignore
      if (isScrolling.current) return;

      const touch = event.touches ? event.touches[0] : event;
      const dx = Math.abs(touch.clientX - startCoord.current.x);
      const dy = Math.abs(touch.clientY - startCoord.current.y);

      // If moved more than 10 pixels, consider it a scroll/drag
      // 10px is a standard threshold to distinguish tap from scroll
      if (dx > 10 || dy > 10) {
          isScrolling.current = true;
          if (timeout.current) clearTimeout(timeout.current);
      }
  }, []);

  const clear = useCallback(
    (event, shouldTriggerClick = true) => {
      timeout.current && clearTimeout(timeout.current);
      
      // Trigger click ONLY if:
      // 1. Component requests it
      // 2. Long press didn't happen
      // 3. User didn't scroll (isScrolling is false)
      if (shouldTriggerClick && !longPressTriggered && !isScrolling.current && onClick) {
        onClick(event);
      }
      
      setLongPressTriggered(false);
      isScrolling.current = false;
      target.current = undefined;
    },
    [onClick, longPressTriggered]
  );

  return {
    onMouseDown: (e) => start(e),
    onTouchStart: (e) => start(e),
    onMouseMove: (e) => move(e),
    onTouchMove: (e) => move(e),
    onMouseUp: (e) => clear(e),
    onMouseLeave: (e) => clear(e, false),
    onTouchEnd: (e) => clear(e)
  };
};

export default useLongPress;