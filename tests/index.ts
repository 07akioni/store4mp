import { createStoreManager } from "../src";

const { getStore, getDefaultData, allocateStore, freeStore } =
  createStoreManager<
    {
      comment: string;
      attachments: string[];
      images: string[];
      secondaryPageTitle: string;
    },
    {
      submit: undefined;
    }
  >(() => ({
    comment: "",
    attachments: [],
    images: [],
    secondaryPageTitle: "",
  }));

const componentThis: any = {};
const request: any = {};

// attached, main
const store = allocateStore();
store.on("submit", () => {
  componentThis.setData({ loading: true });
});

// navigate
function navigateTo(url: string) {}
navigateTo(`url?store1Id=${store.id}`);

// secondary page
function getCurrentPages(): any {}
componentThis.methods.attached = () => {
  const currentPages = getCurrentPages()
  const currentPage = currentPages[currentPages.length - 1]
  const store = getStore(currentPage.options.store1Id)
  componentThis.setData({
    title: store.data.secondaryPageTitle
  })
};

componentThis.method.handleInput = (e: any) => {
  store.data.attachments = [];
  store.data.images = [];
  store.data.comment = e.detail.value;
};

componentThis.method.handleSubmit = (e: any) => {
  store.dispatch("submit", undefined);
};

// detached
freeStore(componentThis.data.store.id);
