import { Store } from "n3";
import { Quint } from "./Quint";



/**
 * A QuintStore is a set of Quints (s,p,o,g,d). It thus keeps track of where datasets (i.e. Quads) were retrieved from.
 */
export class QuintStore {
  private datasets: { [dataset: string]: Store } = {};

  has(dataset: string) {
    return this._stripFragment(dataset) in this.datasets;
  }

  update(dataset: string, store: Store) {
    this.datasets[this._stripFragment(dataset)] = store;
  }

  getQuint(subject: string | null, predicate: string | null, object: string | null, graph: string | null, dataset: string | null) {
    if (dataset) { // if a specific dataset was queried
      dataset = this._stripFragment(dataset);
      if (!this.datasets[dataset]) { // if the store does contain the dataset?
        console.warn(`Dataset not found: ${dataset}`);
        return [];
      }
      // if the store contains the dataset, execute the query
      return this.datasets[dataset].getQuads(subject, predicate, object, graph).map(quad => new Quint(quad.subject.value, quad.predicate.value, quad.object.value, quad.graph.value, dataset!));
    }
    // if dataset is unspecified, query all datasets
    const results = [];
    for (const [dataset, store] of Object.entries(this.datasets)) {
      results.push(store.getQuads(subject, predicate, object, graph).map(quad => new Quint(quad.subject.value, quad.predicate.value, quad.object.value, quad.graph.value, dataset)));
    }
    return results.flat();
  }

  clear() {
    this.datasets = {};
  }

  /**
 *
 * @param uri: the URI to strip from its fragment #
 * @return substring of the uri prior to fragment #
 */
  protected _stripFragment(uri: string): string {
    const indexOfFragment = uri.indexOf("#");
    if (indexOfFragment !== -1) {
      uri = uri.substring(0, indexOfFragment);
    }
    return uri;
  }

}



