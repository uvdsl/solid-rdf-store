![NPM Version](https://img.shields.io/npm/v/%40uvdsl%2Fsolid-rdf-store)

# Solid RDF Store

A small library that provides an RDF store with Web fetching and reactive results.
We use [n3](https://www.npmjs.com/package/n3) as the underlying RDF library.
The store may use the `Session` object of this [Solid-OIDC implementation](https://github.com/uvdsl/solid-oidc-client-browser) to make authenticated requests to fetch RDF data from the Web.

Main idea of this small library is to provide reactive results.
That is, when the data that underlies a query result changes, the query result is updated automatically.
When a dataset on the Web is updated, and that updated dataset is fetched by the store (triggered manually for now), then any query result (obtained via the reactive query method) is updated automatically by the store.
Thus, reactivity frameworks of Vue, React, Angular, ... can update the UI automatically.
Other routines may be triggered with that as well.


## The store - WebReactiveQuintStore

A QuintStore is a set of Quints `(s,p,o,g,d)`. It thus keeps track of where datasets where retrieved from.

This is the web version (manual edition), call `store.getQuintReactiveFromWeb(...)` to fetch a dataset from the web if it is not already loaded into the store.
That is, dataset `d` of the quint is fetched.
Datasets are lazy loaded, and not updated automatically: Call `store.updateFromWeb(...)` to trigger a re-load of a dataset.
 
Then, whenever the data in the store is updated, all reactive query results (obtainer via `store.getQuintReactiveFromWeb(...)` or `store.getQuintReactive(...)`) are updated as well.


## Add via npm

```sh
npm add --save @uvdsl/solid-rdf-store
```


## Vue Example with Reactivity
I use [Vue](https://vuejs.org/) for my apps, so here is a quick usage example. 
It should (TM) work the same with the other frameworks... Let me know.

Define composable `useSolidRdfStore`
```ts
  import { reactive } from "vue";
  import { WebReactiveQuintStore } from "@uvdsl/solid-rdf-store"
  const store = reactive(new WebReactiveQuintStore());

  export const useSolidRdfStore = () => {
    return { store };
  };
```

Use the store in a component ...
```ts
  import { Ref, computed } from "vue";
  import { useSolidRdfStore, Quint } from "useSolidRdfStore";
  
  const { store } = useSolidRdfStore();
  const webId = "https://uvdsl.solid.aifb.kit.edu/profile/card#me";
  
  let nameQueryResult: Ref<Quint[]> = await store.getQuintReactiveFromWeb(webId, "http://www.w3.org/2006/vcard/ns#fn", null, null, webId);
  let photoQueryResult: Ref<Quint[]> = await store.getQuintReactiveFromWeb(webId, "http://www.w3.org/2006/vcard/ns#hasPhoto", null, null, webId);

  const name = computed(() => nameQueryResult.value.map(e => e.object)[0]);
  const vcardPhoto = computed(() => photoQueryResult.value.map(e => e.object)[0]);

  // use data ...
```
Here, we get a reactive reference (`Ref` in Vue) on the query result array.
This array is updated automatically by the store if updates are available.
Therefore, use we also want to automatically re-compute variables; we do that in Vue using `computed`.

Note: Just picking elements from the array breaks reactivity, and even when keeping reactivity, the update will not go through as the array is updated by clearing and filling it.
Therefore, use computed properties!

To re-fetch a dataset (to trigger an update of query results), use 
```ts
  store.updateFromWeb(webId);
```

(Optional) Set a session in the store for Solid-based authentication
```ts
  // have a session (or not, it is optional)
  // after login re-direct in an app
  const { session, restoreSession } = useSolidSession();
  const { store } = useSolidRdfStore();
  restoreSession().then(() => store.setConfig({ session })).then(() => console.log("Logged in:", session.webId));
```

See the [Solid-OIDC implementation](https://github.com/uvdsl/solid-oidc-client-browser) for authenticating a session with your WebID!


