import {
  Dispatch,
  SetStateAction,
  useMemo,
  useSyncExternalStore,
} from "react";

const NotExists = Symbol("notExists");
type TNotExists = typeof NotExists;

export function createPersistantStateStore() {
  type Listener = () => void;
  /**
   * object for storing persistant states by id
   *
   * @example
   * // This is how inside looks like
   * store = {
   *   state1: {
   *     value1: "value",
   *     form: {
   *       input1: "value",
   *       input2: 2,
   *       input3: false,
   *     },
   *   },
   *   state2: {
   *     // ...
   *   }
   * }
   */
  const store: Record<string, unknown> = {};
  
  const listeners: Record<string, Listener[]> = {};
  let storeListeners: Listener[] = [];

  /**
   * Register a listener to detect change of store
   *
   * @internal
   * @param listener
   */
  function subscribeStore(listener: Listener) {
    storeListeners.push(listener);
    return () => {
      storeListeners = storeListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Register a listener to detect change of state
   *
   * @internal
   * @param stateId
   * @param listener
   */
  function subscribeState(stateId: string, listener: Listener) {
    if (!(stateId in listeners)) listeners[stateId] = [];
    listeners[stateId].push(listener);
    return () => {
      listeners[stateId] = listeners[stateId].filter((l) => l !== listener);
    };
  }

  /**
   * Get snapshot of state
   *
   * @internal
   * @param stateId
   */
  function getStateSnapshot(
    stateId: string,
  ): (typeof store)[string] | TNotExists {
    /** Reason why it returns `NotExists` symbol instead of undefined
     * There's two possibility of `store[stateId]` is undefined:
     * 1. store does not have item with key `stateId` (in this case we have to set default value)
     * 2. intentionally set `store[stateId]` as undefined, to represent empty value
     * To separate this two case, it returns NotExists symbol when there's no `stateId` key in `store`
     */
    if (!(stateId in store)) return NotExists;
    return store[stateId];
  }

  /**
   * Notify listeners when state changed
   *
   * Should be called on state change
   *
   * @internal
   * @param stateId
   */
  function notifyState(stateId: string) {
    (listeners[stateId] ?? []).forEach((l) => l());
  }

  /**
   * Build and returns setState for `stateId`.
   *
   * Returned setState should act like normal setState on useState.
   *
   * @param stateId
   */
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

  /**
   * useState simulator for `store[stateId]`
   *
   * @internal
   * @param stateId
   * @param defaultValue
   */
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

    return [afterSnapshot, setStateBuilder(stateId)];
  }

  /**
   * Completely delete stateId from store and listeners
   *
   * @param stateId
   */
  function deleteState(stateId: string) {
    delete store[stateId];
    delete listeners[stateId];
  }

  /**
   * Use entire store instead of single state.
   *
   * You **SHOULD** use setStateBuilder to change value of state
   * to notify subscribers that state changed and you should rerender.
   */
  function useStore(): [typeof store, typeof setStateBuilder, typeof deleteState] {
    return [useSyncExternalStore(subscribeStore, () => store), setStateBuilder, deleteState]
  }

  return [useState, deleteState, useStore] as const;
}
