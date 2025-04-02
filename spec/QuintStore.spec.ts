import { Quad, Store } from "n3";
import { QuintStore } from "../src/QuintStore";

/**
 * @jest-environment node
 * 
 * Unit tests for the QuintStore class
 * 
 * QuintStore is responsible for managing a collection of N3.Store instances,
 * each associated with a specific dataset URI. The class provides methods for
 * querying quints (subject, predicate, object, graph, dataset) across all
 * managed datasets or within a specific dataset.
 */
describe("QuintStore", () => {
    let quintStore: QuintStore;
    let mockStore1: jest.Mocked<Store>;
    let mockStore2: jest.Mocked<Store>;

    beforeEach(() => {
        // Create a fresh QuintStore instance for each test
        quintStore = new QuintStore();

        // Setup mock N3.Store instances
        mockStore1 = {
            getQuads: jest.fn(),
        } as unknown as jest.Mocked<Store>;

        mockStore2 = {
            getQuads: jest.fn(),
        } as unknown as jest.Mocked<Store>;

        // Reset mocks
        jest.clearAllMocks();
    });

    describe("_stripFragment()", () => {
        it("should remove fragment from URI", () => {
            const uri = "http://example.org/dataset#fragment";
            const result = (quintStore as any)._stripFragment(uri);
            expect(result).toBe("http://example.org/dataset");
        });

        it("should return the original URI when no fragment exists", () => {
            const uri = "http://example.org/dataset";
            const result = (quintStore as any)._stripFragment(uri);
            expect(result).toBe("http://example.org/dataset");
        });

        it("should handle empty URI", () => {
            const uri = "";
            const result = (quintStore as any)._stripFragment(uri);
            expect(result).toBe("");
        });
    });

    describe("has()", () => {
        it("should return false for non-existing dataset", () => {
            expect(quintStore.has("http://example.org/dataset1")).toBe(false);
        });

        it("should return true for existing dataset", () => {
            quintStore.update("http://example.org/dataset1", mockStore1);
            expect(quintStore.has("http://example.org/dataset1")).toBe(true);
        });

        it("should strip fragment when checking dataset existence", () => {
            quintStore.update("http://example.org/dataset1", mockStore1);
            expect(quintStore.has("http://example.org/dataset1#fragment")).toBe(true);
        });

    });

    describe("update()", () => {
        it("should add a new dataset", () => {
            quintStore.update("http://example.org/dataset1", mockStore1);
            expect(quintStore.has("http://example.org/dataset1")).toBe(true);
        });

        it("should strip fragment when updating dataset", () => {
            quintStore.update("http://example.org/dataset1#fragment", mockStore1);
            expect(quintStore.has("http://example.org/dataset1")).toBe(true);
        });

        it("should update an existing dataset", () => {
            quintStore.update("http://example.org/dataset1", mockStore1);
            quintStore.update("http://example.org/dataset1", mockStore2);
            mockStore2.getQuads.mockReturnValue([]);
            quintStore.getQuint(null, null, null, null, "http://example.org/dataset1");
            expect(mockStore2.getQuads).toHaveBeenCalled();
        });

    });

    describe("getQuint()", () => {
        beforeEach(() => {
            quintStore.update("http://example.org/dataset1", mockStore1);
            quintStore.update("http://example.org/dataset2", mockStore2);
        });

        it("should strip fragment when querying a specific dataset", () => {
            mockStore1.getQuads.mockReturnValue([]);
            quintStore.getQuint(null, null, null, null, "http://example.org/dataset1#fragment");
            expect(mockStore1.getQuads).toHaveBeenCalled();
        });

        it("should query a specific dataset when dataset parameter is provided", () => {
            const mockQuad = {
                subject: { value: "s1" },
                predicate: { value: "p1" },
                object: { value: "o1" },
                graph: { value: "g1" }
            } as Quad;
            mockStore1.getQuads.mockReturnValue([mockQuad]);
            const result = quintStore.getQuint("s1", "p1", "o1", "g1", "http://example.org/dataset1");
            expect(mockStore1.getQuads).toHaveBeenCalledWith("s1", "p1", "o1", "g1");
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                subject: "s1",
                predicate: "p1",
                object: "o1",
                graph: "g1",
                dataset: "http://example.org/dataset1"
            });
        });

        it("should query all datasets when dataset parameter is null", () => {
            const mockQuad1 = {
                subject: { value: "s1" },
                predicate: { value: "p1" },
                object: { value: "o1" },
                graph: { value: "g1" }
            } as Quad;

            const mockQuad2 = {
                subject: { value: "s2" },
                predicate: { value: "p2" },
                object: { value: "o2" },
                graph: { value: "g2" }
            } as Quad;

            mockStore1.getQuads.mockReturnValue([mockQuad1]);
            mockStore2.getQuads.mockReturnValue([mockQuad2]);

            const result = quintStore.getQuint("s", "p", "o", "g", null);

            expect(mockStore1.getQuads).toHaveBeenCalledWith("s", "p", "o", "g");
            expect(mockStore2.getQuads).toHaveBeenCalledWith("s", "p", "o", "g");
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                subject: "s1",
                predicate: "p1",
                object: "o1",
                graph: "g1",
                dataset: "http://example.org/dataset1"
            });
            expect(result[1]).toEqual({
                subject: "s2",
                predicate: "p2",
                object: "o2",
                graph: "g2",
                dataset: "http://example.org/dataset2"
            });
        });

        it("should return empty array when querying non-existent dataset", () => {
            const result = quintStore.getQuint(null, null, null, null, "http://example.org/nonexistent");
            expect(result).toEqual([]);
        });

        it("should handle empty results from datasets", () => {
            mockStore1.getQuads.mockReturnValue([]);
            mockStore2.getQuads.mockReturnValue([]);
            const result = quintStore.getQuint(null, null, null, null, null);
            expect(result).toEqual([]);
        });
    });

    describe("clear()", () => {
        beforeEach(() => {
            quintStore.update("http://example.org/dataset1", mockStore1);
            quintStore.update("http://example.org/dataset2", mockStore2);
        });

        it("should remove all datasets", () => {
            quintStore.clear();
            expect(quintStore.has("http://example.org/dataset1")).toBe(false);
            expect(quintStore.has("http://example.org/dataset2")).toBe(false);
        });

        it("should result in empty results for queries after clearing", () => {
            quintStore.clear();
            const result = quintStore.getQuint(null, null, null, null, null);
            expect(result).toEqual([]);
        });
    });

});