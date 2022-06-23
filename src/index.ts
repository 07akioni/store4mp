type Store<
  Data extends Record<string, unknown>,
  Actions extends Record<string, unknown> = Record<string, unknown>
> = {
  id: string;
  data: Data;
  on<Action extends keyof Actions & string>(
    action: Action,
    callback: (arg: { payload: Actions[Action]; data: Data }) => void
  ): void;
  off<Action extends keyof Actions & string>(
    action: Action,
    callback: (arg: { payload: Actions[Action]; data: Data }) => void
  ): void;
  dispatch<Action extends keyof Actions & string>(
    action: Action,
    payload: Actions[Action]
  ): void;
};

export type StoreManager<
  Data extends Record<string, unknown>,
  Actions extends Record<string, unknown> = Record<string, unknown>
> = {
  allocateStore(): Store<Data, Actions>;
  getDefaultData(): Data;
  getStore(id: string | undefined | null): Store<Data, Actions>;
  freeStore(id: string | undefined | null): void;
};

export function createStoreManager<
  Data extends Record<string, unknown>,
  Actions extends Record<string, unknown> = Record<string, unknown>
>(defaultDataFactory: () => Data): StoreManager<Data, Actions> {
  let storeId = 1;
  const stores = new Map<string, Store<Data, Actions>>();
  return {
    getDefaultData: defaultDataFactory,
    allocateStore(): Store<Data, Actions> {
      let _storeId = `${storeId++}`;
      const store = createStore<Data, Actions>(_storeId, defaultDataFactory);
      stores.set(_storeId, store);
      return store;
    },
    // We allow id with type undefined & null to make user easier to pass params in
    getStore(id: string | undefined | null): Store<Data, Actions> {
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

function createStore<
  Data extends Record<string, unknown> = Record<string, unknown>,
  Actions extends Record<string, unknown> = Record<string, unknown>
>(id: string, defaultDataFactory: () => Data): Store<Data, Actions> {
  const callbacks: Record<
    keyof Actions,
    Set<(arg: { payload: Actions[keyof Actions]; data: Data }) => void>
  > = {} as any;
  const data = defaultDataFactory();
  return {
    id,
    data,
    on: (action, callback) => {
      let actionCallbacks: Set<
        (arg: { payload: Actions[typeof action]; data: Data }) => void
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
          (arg: { payload: Actions[typeof action]; data: Data }) => void
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
