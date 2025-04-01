/**
 * A Quint (s,p,o,g,d) is an RDF Quad, extended by the URI where the dataset was retrieved from.
 */
export class Quint {
  readonly subject: string;
  readonly predicate: string;
  readonly object: string;
  readonly graph: string;
  readonly dataset: string;
  constructor(subject: string, predicate: string, object: string, graph: string, dataset: string) {
    this.subject = subject
    this.predicate = predicate
    this.object = object
    this.graph = graph
    this.dataset = dataset
  }
}

