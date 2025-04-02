import { Quad, Store } from "n3";
import { ReactiveQuintStore } from "../src/ReactiveQuintStore";
import { QuintQuery } from "../src/QuintQuery";
import { QuintStore } from "../src/QuintStore";

// Mock dependencies
jest.mock("../src/QuintQuery");

/**
 * 
 * Unit tests for the ReactiveQuintStore class
 * 
 * ReactiveQuintStore extends QuintStore to provide reactive query capabilities.
 * It keeps track of executed queries and automatically updates their results
 * when the underlying data changes.
 */
describe("ReactiveQuintStore", () => {
    let reactiveStore: ReactiveQuintStore;
    let mockStore1: jest.Mocked<Store>;
    let mockStore2: jest.Mocked<Store>;
    let mockQuintQuery: any;

    beforeEach(() => {
        // Create a fresh ReactiveQuintStore instance for each test
        reactiveStore = new ReactiveQuintStore();

        // Setup mock N3.Store instances
        mockStore1 = {
            getQuads: jest.fn(),
        } as unknown as jest.Mocked<Store>;

        mockStore2 = {
            getQuads: jest.fn(),
        } as unknown as jest.Mocked<Store>;

        // Setup mock QuintQuery
        mockQuintQuery = {
            subject: null,
            predicate: null,
            object: null,
            graph: null,
            dataset: null,
            result: [],
            equals: jest.fn().mockReturnValue(false)
        };

        // Mock the QuintQuery constructor
        (QuintQuery as jest.Mock).mockImplementation(
            (subject, predicate, object, graph, dataset, result) => {
                return {
                    subject,
                    predicate,
                    object,
                    graph,
                    dataset,
                    result: result || [],
                    equals: jest.fn().mockReturnValue(false)
                };
            }
        );

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe("getQuintReactive()", () => {
        it("should create and return a new and empty query result when query is not known and dataset is not known", () => {
            const result = reactiveStore.getQuintReactive("s1", "p1", "o1", "g1", "http://example.org/dataset1");
            expect(result).toEqual([]);
            expect(QuintQuery).toHaveBeenCalledWith("s1", "p1", "o1", "g1", "http://example.org/dataset1", []);
        });

        it("should create and return a new and empty query result when query is not known and does not have a result", () => {
            const mockQuads = [] as Quad[];
            mockStore1.getQuads.mockReturnValue(mockQuads);
            reactiveStore.update("http://example.org/dataset1", mockStore1);
            const result = reactiveStore.getQuintReactive("s1", "p1", "o1", "g1", "http://example.org/dataset1");
            expect(result).toEqual([]);
            expect(QuintQuery).toHaveBeenCalledWith("s1", "p1", "o1", "g1", "http://example.org/dataset1", []);
        });

        it("should create and return a new query result when query is not known", () => {
            const mockQuads = [
                { subject: { value: "s1" }, predicate: { value: "p1" }, object: { value: "o1" }, graph: { value: "g1" } } as Quad
            ];
            mockStore1.getQuads.mockReturnValue(mockQuads);
            reactiveStore.update("http://example.org/dataset1", mockStore1);

            const result = reactiveStore.getQuintReactive("s1", "p1", "o1", "g1", "http://example.org/dataset1");

            expect(result).toEqual([
                { subject: "s1", predicate: "p1", object: "o1", graph: "g1", dataset: "http://example.org/dataset1" }
            ]);
            expect(QuintQuery).toHaveBeenCalledWith("s1", "p1", "o1", "g1", "http://example.org/dataset1", [{ subject: "s1", predicate: "p1", object: "o1", graph: "g1", dataset: "http://example.org/dataset1" }]);
        });

        it("should return existing query result when query is known", () => {
            const mockQuads = [
                { subject: { value: "s1" }, predicate: { value: "p1" }, object: { value: "o1" }, graph: { value: "g1" } } as Quad
            ];
            mockStore1.getQuads.mockReturnValue(mockQuads);
            reactiveStore.update("http://example.org/dataset1", mockStore1);

            const existingResult = [
                { subject: "s1", predicate: "p1", object: "o1", graph: "g1", dataset: "http://example.org/dataset1" }
            ];
            const mockQuery = {
                subject: "s1",
                predicate: "p1",
                object: "o1",
                graph: "g1",
                dataset: "http://example.org/dataset1",
                result: existingResult,
                equals: jest.fn().mockReturnValue(true)
            };

            (reactiveStore as any).queries["http://example.org/dataset1"] = [mockQuery];

            (QuintQuery as jest.Mock).mockImplementation(
                (subject, predicate, object, graph, dataset, result) => {
                    return {
                        subject,
                        predicate,
                        object,
                        graph,
                        dataset,
                        result: result || [],
                        equals: jest.fn().mockImplementation((otherQuery) => {
                            return subject === otherQuery.subject &&
                                predicate === otherQuery.predicate &&
                                object === otherQuery.object &&
                                graph === otherQuery.graph &&
                                dataset === otherQuery.dataset;
                        })
                    };
                }
            );

            const result = reactiveStore.getQuintReactive("s1", "p1", "o1", "g1", "http://example.org/dataset1");

            expect(result).toBe(existingResult);
            expect(mockQuery.equals).toHaveBeenCalled();
        });

        it("should handle null dataset by using 'null' as key", () => {
            const mockQuads1 = [
                { subject: { value: "s1" }, predicate: { value: "p1" }, object: { value: "o1" }, graph: { value: "g1" } } as Quad
            ];
            const mockQuads2 = [
                { subject: { value: "s2" }, predicate: { value: "p2" }, object: { value: "o2" }, graph: { value: "g2" } } as Quad
            ];

            mockStore1.getQuads.mockReturnValue(mockQuads1);
            mockStore2.getQuads.mockReturnValue(mockQuads2);

            reactiveStore.update("http://example.org/dataset1", mockStore1);
            reactiveStore.update("http://example.org/dataset2", mockStore2);

            jest.spyOn(reactiveStore, 'getQuint').mockImplementation(() => [
                { subject: "s1", predicate: "p1", object: "o1", graph: "g1", dataset: "http://example.org/dataset1" },
                { subject: "s2", predicate: "p2", object: "o2", graph: "g2", dataset: "http://example.org/dataset2" }
            ]);

            const result = reactiveStore.getQuintReactive(null, null, null, null, null);

            expect(result).toEqual([
                { subject: "s1", predicate: "p1", object: "o1", graph: "g1", dataset: "http://example.org/dataset1" },
                { subject: "s2", predicate: "p2", object: "o2", graph: "g2", dataset: "http://example.org/dataset2" }
            ]);
            expect((reactiveStore as any).queries["null"]).toBeDefined();
        });

        it("should strip fragment from dataset URI", () => {
            const mockQuads = [
                { subject: { value: "s1" }, predicate: { value: "p1" }, object: { value: "o1" }, graph: { value: "g1" } } as Quad
            ];
            mockStore1.getQuads.mockReturnValue(mockQuads);
            reactiveStore.update("http://example.org/dataset1", mockStore1);

            reactiveStore.getQuintReactive("s1", "p1", "o1", "g1", "http://example.org/dataset1#fragment");

            expect((reactiveStore as any).queries["http://example.org/dataset1"]).toBeDefined();
        });
    });

    describe("update()", () => {
        it("should update store and refresh all queries for the dataset", () => {
            const mockQuads1 = [
                { subject: { value: "s1" }, predicate: { value: "p1" }, object: { value: "o1" }, graph: { value: "g1" } } as Quad
            ];
            const mockQuads2 = [
                { subject: { value: "s1-updated" }, predicate: { value: "p1" }, object: { value: "o1" }, graph: { value: "g1" } } as Quad
            ];

            mockStore1.getQuads.mockReturnValue(mockQuads1);
            mockStore2.getQuads.mockReturnValue(mockQuads2);

            reactiveStore.update("http://example.org/dataset1", mockStore1);
            const result1 = reactiveStore.getQuintReactive("s1", "p1", "o1", "g1", "http://example.org/dataset1");

            jest.spyOn(reactiveStore, 'getQuint').mockImplementation(() => [
                { subject: "s1-updated", predicate: "p1", object: "o1", graph: "g1", dataset: "http://example.org/dataset1" }
            ]);

            reactiveStore.update("http://example.org/dataset1", mockStore2);

            expect(result1).toEqual([
                { subject: "s1-updated", predicate: "p1", object: "o1", graph: "g1", dataset: "http://example.org/dataset1" }
            ]);
        });

        it("should handle multiple queries on the same dataset", () => {
            const mockQuads1 = [
                { subject: { value: "s1" }, predicate: { value: "p1" }, object: { value: "o1" }, graph: { value: "g1" } } as Quad
            ];
            const mockQuads2 = [
                { subject: { value: "s1-updated" }, predicate: { value: "p1" }, object: { value: "o1" }, graph: { value: "g1" } } as Quad,
                { subject: { value: "s2" }, predicate: { value: "p2" }, object: { value: "o2" }, graph: { value: "g2" } } as Quad
            ];

            mockStore1.getQuads.mockReturnValue(mockQuads1);
            mockStore2.getQuads.mockReturnValue(mockQuads2);

            reactiveStore.update("http://example.org/dataset1", mockStore1);
            const result1 = reactiveStore.getQuintReactive("s1", "p1", "o1", "g1", "http://example.org/dataset1");
            const result2 = reactiveStore.getQuintReactive("s2", "p2", "o2", "g2", "http://example.org/dataset1");

            let callCount = 0;
            jest.spyOn(reactiveStore, 'getQuint').mockImplementation((s, p, o, g, d) => {
                callCount++;
                if (callCount % 2 === 1) {
                    return [{ subject: "s1-updated", predicate: "p1", object: "o1", graph: "g1", dataset: "http://example.org/dataset1" }];
                } else {
                    return [{ subject: "s2", predicate: "p2", object: "o2", graph: "g2", dataset: "http://example.org/dataset1" }];
                }
            });

            reactiveStore.update("http://example.org/dataset1", mockStore2);

            expect(result1).toEqual([
                { subject: "s1-updated", predicate: "p1", object: "o1", graph: "g1", dataset: "http://example.org/dataset1" }
            ]);
            expect(result2).toEqual([
                { subject: "s2", predicate: "p2", object: "o2", graph: "g2", dataset: "http://example.org/dataset1" }
            ]);
        });

        it("should handle new dataset with no existing queries", () => {
            const mockQuads = [
                { subject: { value: "s1" }, predicate: { value: "p1" }, object: { value: "o1" }, graph: { value: "g1" } } as Quad
            ];
            mockStore1.getQuads.mockReturnValue(mockQuads);

            reactiveStore.update("http://example.org/dataset1", mockStore1);

            expect((reactiveStore as any).queries["http://example.org/dataset1"]).toEqual([]);
        });

        it("should strip fragment from dataset URI", () => {
            const mockQuads = [
                { subject: { value: "s1" }, predicate: { value: "p1" }, object: { value: "o1" }, graph: { value: "g1" } } as Quad
            ];
            mockStore1.getQuads.mockReturnValue(mockQuads);

            reactiveStore.update("http://example.org/dataset1#fragment", mockStore1);

            expect((reactiveStore as any).queries["http://example.org/dataset1"]).toEqual([]);
        });

        it("should return the store instance for method chaining", () => {
            const result = reactiveStore.update("http://example.org/dataset1", mockStore1);

            expect(result).toBe(reactiveStore);
        });
    });

    describe("clear()", () => {
        it("should clear all stores and empty all query results", () => {
            const mockQuads = [
                { subject: { value: "s1" }, predicate: { value: "p1" }, object: { value: "o1" }, graph: { value: "g1" } } as Quad
            ];
            mockStore1.getQuads.mockReturnValue(mockQuads);

            reactiveStore.update("http://example.org/dataset1", mockStore1);
            const result1 = reactiveStore.getQuintReactive("s1", "p1", "o1", "g1", "http://example.org/dataset1");

            expect(result1.length).toBe(1);

            const superClearSpy = jest.spyOn(QuintStore.prototype, 'clear').mockImplementation(() => { });

            reactiveStore.clear();

            expect(superClearSpy).toHaveBeenCalled();
            expect(result1.length).toBe(0); // Result array should be emptied
        });

        it("should handle multiple query results across different datasets", () => {
            const mockQuads1 = [
                { subject: { value: "s1" }, predicate: { value: "p1" }, object: { value: "o1" }, graph: { value: "g1" } } as Quad
            ];
            const mockQuads2 = [
                { subject: { value: "s2" }, predicate: { value: "p2" }, object: { value: "o2" }, graph: { value: "g2" } } as Quad
            ];

            mockStore1.getQuads.mockReturnValue(mockQuads1);
            mockStore2.getQuads.mockReturnValue(mockQuads2);

            reactiveStore.update("http://example.org/dataset1", mockStore1);
            reactiveStore.update("http://example.org/dataset2", mockStore2);

            const result1 = reactiveStore.getQuintReactive("s1", "p1", "o1", "g1", "http://example.org/dataset1");
            const result2 = reactiveStore.getQuintReactive("s2", "p2", "o2", "g2", "http://example.org/dataset2");
            const result3 = reactiveStore.getQuintReactive(null, null, null, null, null);

            jest.spyOn(QuintStore.prototype, 'clear').mockImplementation(() => { });

            reactiveStore.clear();

            expect(result1.length).toBe(0);
            expect(result2.length).toBe(0);
            expect(result3.length).toBe(0);
        });

        it("should return the store instance for method chaining", () => {
            const result = reactiveStore.clear();
            expect(result).toBe(reactiveStore);
        });
    });

});