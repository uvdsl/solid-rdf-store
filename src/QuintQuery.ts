import { Quint } from "./Quint";

/**
 * A QuintQuery (s,p,o,g,d) where any element may be null (as a placeholder).
 * It has an (empty) result list of Quints.
 */
export class QuintQuery {

    readonly subject: string | null;
    readonly predicate: string | null;
    readonly object: string | null;
    readonly graph: string | null;
    readonly dataset: string | null;

    readonly result: Quint[];

    constructor(subject: string | null, predicate: string | null, object: string | null, graph: string | null, dataset: string | null, result: Quint[]) {
        this.subject = subject
        this.predicate = predicate
        this.object = object
        this.graph = graph
        this.dataset = dataset
        this.result = result
    }

    equals(q: QuintQuery): boolean {
        return this.subject == q.subject
            && this.predicate == q.predicate
            && this.object == q.object
            && this.graph == q.graph
            && this.dataset == q.dataset
    }

}