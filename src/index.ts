type Store<T, U extends Record<string, unknown>> = {
  id: string;
  data: T;
  on<V extends keyof U & string>(
    action: V,
    callback: (arg: { payload: U[V]; data: T }) => void
  ): void;
  off<V extends keyof U & string>(
    action: V,
    callback: (arg: { payload: U[V]; data: T }) => void
  ): void;
  dispatch<V extends keyof U & string>(action: V, payload: U[V]): void;
};

export type StoreManager<
  T extends Record<string, unknown>,
  U extends Record<string, unknown>
> = {
  allocateStore(): Store<T, U>;
  getDefaultData(): T;
  getStore(id: string | undefined | null): Store<T, U>;
  freeStore(id: string | undefined | null): void;
};

export function createStoreManager<
  T extends Record<string, unknown>,
  U extends Record<string, unknown> = Record<string, unknown>
>(defaultDataFactory: () => T): StoreManager<T, U> {
  let storeId = 1;
  const stores = new Map<string, Store<T, U>>();
  return {
    getDefaultData: defaultDataFactory,
    allocateStore(): Store<T, U> {
      let _storeId = `${storeId++}`;
      const store = createStore<U, T>(_storeId, defaultDataFactory);
      stores.set(_storeId, store);
      return store;
    },
    // We allow id with type undefined & null to make user easier to pass params in
    getStore(id: string | undefined | null): Store<T, U> {
      if (id === null || id === undefined)
        throw new Error(`id should be a string in freeStore, not ${id}`);
      const store = stores.get(id);
      if (!store)
        throw new Error(`No store is found with id=${id} in getStore`);
      return store;
    },
    freeStore(id: string | undefined | null) {
      if (id === null || id === undefined)
        throw new Error(`id should be a string in freeStore, not ${id}`);
      if (!stores.has(id))
        throw new Error(`No store is found with id=${id} in freeStore`);
      stores.delete(id);
    },
  };
}

function createStore<U extends Record<string, unknown>, T = any>(
  id: string,
  defaultDataFactory: () => T
): Store<T, U> {
  const callbacks: Record<
    keyof U,
    Set<(arg: { payload: U[keyof U]; data: T }) => void>
  > = {} as any;
  const data = defaultDataFactory();
  return {
    id,
    data,
    on: (action, callback) => {
      let actionCallbacks: Set<
        (arg: { payload: U[typeof action]; data: T }) => void
      >;
      if (action in callbacks) {
        actionCallbacks = callbacks[action];
      } else {
        actionCallbacks = new Set();
      }
      actionCallbacks.add(callback);
    },
    off: (action, callback) => {
      if (action in callbacks) {
        const actionCallbacks: Set<
          (arg: { payload: U[typeof action]; data: T }) => void
        > = callbacks[action];
        actionCallbacks.delete(callback);
      }
    },
    dispatch: (action, payload) => {
      callbacks[action].forEach((actionCallback) => {
        actionCallback({
          payload,
          data,
        });
      });
    },
  };
}
