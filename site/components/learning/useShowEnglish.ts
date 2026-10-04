"use client";

import { useEffect, useState } from "react";

const KEY = "stigen:show-english";
const EVENT = "stigen:show-english-change";

function read() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * English support under Swedish questions is hidden by default. One switch,
 * remembered in the browser, shows it everywhere; every open page follows.
 */
export function useShowEnglish(): [boolean, (value: boolean) => void] {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const sync = () => setShow(read());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  const update = (value: boolean) => {
    try {
      window.localStorage.setItem(KEY, value ? "1" : "0");
    } catch {
      /* Without storage the switch still works for this page. */
    }
    setShow(value);
    window.dispatchEvent(new Event(EVENT));
  };
  return [show, update];
}
