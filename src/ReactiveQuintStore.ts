import { Store } from "n3";
import { QuintQuery } from "./QuintQuery";
import { QuintStore } from "./QuintStore";


/**
 * A QuintStore is a set of quints (s,p,o,g,d). It thus keeps track of where datasets (i.e. Quads) were retrieved from.
 * 
 * This is the reactive version, where query results (obtained via {@link getQuintReactive}) are updated when the underlying data changes.
 */
export class ReactiveQuintStore extends QuintStore {

  private static WILDCARD_DATASET: string = "*";
  private queries: { [dataset: string]: QuintQuery[] } = { [ReactiveQuintStore.WILDCARD_DATASET]: [] };

  getQuintReactive(subject: string | null, predicate: string | null, object: string | null, graph: string | null, dataset: string | null) {
    dataset = dataset ? this._stripFragment(dataset) : null;
    const datasetQueryKey = dataset === null ? ReactiveQuintStore.WILDCARD_DATASET : dataset;
    const query = new QuintQuery(subject, predicate, object, graph, dataset, []);
    // if the dataset has not been queried before, make sure a query list exists
    if (!this.queries[datasetQueryKey]) {
      this.queries[datasetQueryKey] = [];
    }
    // check if query is known
    const i = this.queries[datasetQueryKey].findIndex(q => q.equals(query));
    if (i >= 0) { // query result already exists
      return this.queries[datasetQueryKey][i].result // if you want an update, manually call store.update(dataset:string, store:Store)! 
    }
    // query result does not yet exists, query not yet known
    query.result.push(...this.getQuint(subject, predicate, object, graph, dataset));
    // remember query and result
    this.queries[datasetQueryKey].push(query);
    // return reactive query result
    return query.result;
  }

  update(dataset: string, store: Store) {
    dataset = this._stripFragment(dataset);
    // put new store 
    super.update(dataset, store);
    // if the dataset has not been queried before, make sure a query list exists
    if (!this.queries[dataset]) {
      this.queries[dataset] = [];
    }
    // re-run all queries for the dataset to update reactivly
    for (const query of this.queries[dataset]) {
      // run query
      const newResult = this.getQuint(query.subject, query.predicate, query.object, query.graph, query.dataset);
      // update result
      query.result.length = 0;
      query.result.push(...newResult);
    }
    // re-run wildcard queries
    for (const query of this.queries[ReactiveQuintStore.WILDCARD_DATASET]) {
      // run query
      const newResult = this.getQuint(query.subject, query.predicate, query.object, query.graph, query.dataset);
      // update result
      query.result.length = 0;
      query.result.push(...newResult);
    }
    return this;
  }

  clear() {
    super.clear();
    Object.values(this.queries).map(qr => qr.map(v => v.result)).flat().map(arr => arr.length = 0); // forget all query results, such that the UI also updates. forgetting queries does not suffice (UI wont update)!
    return this;
  }
}