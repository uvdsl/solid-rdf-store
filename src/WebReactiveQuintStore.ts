import { Session } from "@uvdsl/solid-oidc-client-browser";
import { getResource, parseToN3 } from "@uvdsl/solid-requests";
import { ReactiveQuintStore } from "./ReactiveQuintStore";

interface IQuintStoreWebConfig { session: Session }

/**
 * A QuintStore is a set of quints (s,p,o,g,d). It thus keeps track of where datasets where retrieved from.
 * 
 * This is the web version (manual edition), call {@link getQuintReactiveFromWeb} to fetch a dataset from the web if it is not already loaded into the store.
 * Datasets are lazy loaded, and not updated automatically: Call {@link updateFromWeb} to trigger a re-load of a dataset.
 * 
 * Then, whenever the data in the store is updated, all reactive query results (obtainer via {@link getQuintReactiveFromWeb} or {@link getQuintReactive}) are updated as well.
 * 
 */
export class WebReactiveQuintStore extends ReactiveQuintStore {
    private config: IQuintStoreWebConfig = { session: new Session() };
    private datasetsLoading: Set<string> = new Set();
  
    setConfig(config: IQuintStoreWebConfig) {
      this.config = config;
      return this;
    }
  
    async getQuintReactiveFromWeb(subject: string | null, predicate: string | null, object: string | null, graph: string | null, dataset: string | null) {
      if (dataset && !this.has(dataset)) {
        await this.updateFromWeb(dataset)
      }
      return this.getQuintReactive(subject, predicate, object, graph, dataset);
    }
  
    async updateFromWeb(dataset: string) {
      if (this.datasetsLoading.has(dataset)) { // Skip if already fetching from web
        return this;
      }
      this.datasetsLoading.add(dataset);
      try {
        const data = (await getResource(dataset, this.config.session)).data;
        const { store } = await parseToN3(data, dataset);
        this.update(dataset, store);
      } catch (error) {
        console.error("Failed to update dataset:", dataset, error);
      } finally {
        this.datasetsLoading.delete(dataset); // Ensure clean-up
      }
      return this;
    }
  }