"use client";
import { useEffect, useState } from "react";

/**
 * Opens Messages with everyone already in the To field. iPhones only take a
 * group from the sms://open?addresses= form; Android takes a comma list.
 */
export default function GroupText({ phones }: { phones: string[] }) {
  const list = phones.join(",");
  const [href, setHref] = useState(`sms:${list}`);
  useEffect(() => {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    setHref(ios && list.includes(",") ? `sms://open?addresses=${list}` : `sms:${list}`);
  }, [list]);
  return <a className="btn sm" href={href}>{phones.length > 1 ? "Group text" : "Text"}</a>;
}
