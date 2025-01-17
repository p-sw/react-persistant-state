import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

const NotExists = Symbol("notExists");
type TNotExists = typeof NotExists;

export function createPersistantStateStore() {
  type Listener = () => void;
  const store: Record<string, unknown> = {};
  const listeners: Record<string, Listener[]> = {};

  function subscribeState(stateId: string, listener: Listener) {
    if (!(stateId in listeners)) listeners[stateId] = [];
    listeners[stateId].push(listener);
    return () => {
      listeners[stateId] = listeners[stateId].filter((l) => l !== listener);
    };
  }

  function getStateSnapshot(
    stateId: string,
  ): (typeof store)[string] | TNotExists {
    if (!(stateId in store)) return NotExists;
    return store[stateId];
  }

  function notifyState(stateId: string) {
    (listeners[stateId] ?? []).forEach((l) => l());
  }

  function setStateBuilder<T>(stateId: string): Dispatch<SetStateAction<T>> {
    return (valueOrUpdator) => {
      if (typeof valueOrUpdator === "function") {
        store[stateId] = (valueOrUpdator as (prevState: T) => T)(
          store[stateId] as T,
        );
      } else {
        store[stateId] = valueOrUpdator;
      }
      notifyState(stateId);
    };
  }

  function useState<T = undefined>(
    stateId: string,
    defaultValue?: T | (() => T),
  ): [T, Dispatch<SetStateAction<T>>] {
    const snapshot = useSyncExternalStore<T | TNotExists>(
      (l) => subscribeState(stateId, l),
      () => getStateSnapshot(stateId) as T | TNotExists,
    );

    const afterSnapshot = useMemo(() => {
      if (snapshot === NotExists && defaultValue !== undefined) {
        const finalDefaultValue =
          typeof defaultValue === "function"
            ? (defaultValue as () => T)()
            : defaultValue;
        store[stateId] = finalDefaultValue;
        notifyState(stateId);
        return finalDefaultValue;
      } else if (snapshot === NotExists) return undefined as T;
      return snapshot;
    }, [snapshot, defaultValue, stateId]);

    useEffect(() => {}, [snapshot, defaultValue, stateId]);
    return [afterSnapshot, setStateBuilder(stateId)];
  }

  function deleteState(stateId: string) {
    delete store[stateId];
    delete listeners[stateId];
  }

  return [useState, deleteState];
}
