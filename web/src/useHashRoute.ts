import { useEffect, useState } from "react";

export type Route = { page: "list" } | { page: "lesson"; slug: string };

const parse = (hash: string): Route => {
  const match = hash.match(/^#\/lesson\/([a-z0-9-]+)$/);
  return match?.[1] ? { page: "lesson", slug: match[1] } : { page: "list" };
};

export const lessonHref = (slug: string): string => `#/lesson/${slug}`;

/** Tiny hash router: #/ is the list, #/lesson/<slug> is the player. */
export const useHashRoute = (): Route => {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = (): void => {
      setRoute(parse(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
};
