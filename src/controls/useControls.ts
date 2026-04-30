import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";
import type { ControlSchema, ControlValues } from "./types";

export function useControls<T extends ControlSchema>(
  schema: T
): [ControlValues<T>, (key: keyof T, value: number | string | boolean) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => {
    const result = {} as Record<string, number | string | boolean>;

    for (const [key, control] of Object.entries(schema)) {
      const raw = searchParams.get(key);

      if (raw === null) {
        result[key] = control.default;
      } else {
        switch (control.type) {
          case "slider":
            result[key] = Number(raw);
            break;
          case "segmented":
            result[key] = control.options.includes(raw) ? raw : control.default;
            break;
          case "toggle":
            result[key] = raw === "true";
            break;
          case "pills": {
            const n = Number(raw);
            result[key] = control.options.includes(n) ? n : control.default;
            break;
          }
        }
      }
    }

    return result as ControlValues<T>;
  }, [schema, searchParams]);

  const setValue = useCallback(
    (key: keyof T, value: number | string | boolean) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const control = schema[key as string];

        if (value === control.default) {
          next.delete(key as string);
        } else {
          next.set(key as string, String(value));
        }

        return next;
      });
    },
    [schema, setSearchParams]
  );

  return [values, setValue];
}
