import { useEffect, useRef } from "react";
import Typed from "typed.js";

const useTyped = (strings, options = {}) => {
  const el = useRef(null);
  const typed = useRef(null);

  useEffect(() => {
    const opts = {
      strings,
      typeSpeed: 50,
      backSpeed: 30,
      loop: true,
      showCursor: true,
      cursorChar: "|",
      ...options,
    };

    typed.current = new Typed(el.current, opts);

    return () => {
      typed.current.destroy();
    };
  }, [strings, options]);

  return el;
};

export default useTyped;
