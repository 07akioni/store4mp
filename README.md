# store4mp

A very basic data store manager library for mini program.

Mini program's data share ability is very, very poor. There's not easy way to
share data across pages. When it comes to nested pages, it will become harder.

`store4mp` provides a very basic & reliable way to share data between pages in
component granularity.

## Installation

```
npm install store4mp
```

## Usage

Here's a demo that shows how it works.

### `componentStore.ts`

```ts
import { createStoreManager } from "store4mp";

type Data = {
  value: string;
};

type Actions = {
  action: string; // action name & action payload
};

const { allocateStore, getStore, freeStore, getDefaultData } =
  createStoreManager<Data, Actions>();
export { allocateStore, getStore, freeStore, getDefaultData };
```

### `component/index.ts`

```ts
Component({
  attached() {
    this.store = allocateStore();
    this.store.on("action", ({ payload, data }) => {
      console.log(payload, data); // string, { value: string }
    });
  },
  methods: {
    goToSecondaryPage() {
      this.store.data.value = "foo";
      wx.navigateTo(`url?component-store-id=${this.storeId}`);
    },
  },
  detached() {
    freeStore(this.store.id);
  },
});
```

### Secondary page of component

```ts
Component({
  data: {
    ...getDefaultData(),
  },
  attached() {
    const currentPages = getCurrentPages();
    const currentPage = currentPages[currentPages.length - 1];
    const { options } = currentPage;

    this.store = getStore(options["component-store-id"]);
    this.setData(this.store.data);
    console.log(this.data); // { value: 'foo' }
  },
  methods: {
    handleTap() {
      this.store.dispatch("action", "hello main page");
      // parent page will show "hello main page"
    },
  },
});
```

## About action & data

You may find you can pass data by `dispatch(action)` and `store.data` both, but
which should be use?

There are two principles (which can cover most cases):

- When you want pass data from parent page to child page, you should use
  `store.data` since child page doesn't exist when parent dispatch events.
- Whan you want to pass data from child page to parent page, you should use
  `dispatch(action)`. Since if parent listened to the action, there's no need
  to access `store.data` to acquire essential data.

There is no must be. You can choose proper method for your own scene.

## Deep dive

It's eventbus + state store + resource management.
