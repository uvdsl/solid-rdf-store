import { ReactiveQuintStore } from '../src/ReactiveQuintStore';
import { WebReactiveQuintStore } from '../src/WebReactiveQuintStore';
import { Session } from '@uvdsl/solid-oidc-client-browser';
import { getResource, parseToN3 } from '@uvdsl/solid-requests';


// Mock dependencies
jest.mock('@uvdsl/solid-requests');
jest.mock('../src/ReactiveQuintStore');

// Spy on specific methods instead of mocking the whole class
const mockGetQuintReactive = jest.fn();
const mockUpdate = jest.fn();
const mockHas = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();

    // Spy on methods of the parent class
    jest.spyOn(ReactiveQuintStore.prototype, 'getQuintReactive').mockImplementation(mockGetQuintReactive);
    jest.spyOn(ReactiveQuintStore.prototype, 'update').mockImplementation(mockUpdate);
    jest.spyOn(ReactiveQuintStore.prototype, 'has').mockImplementation(mockHas);

    // Mock getResource and parseToN3
    (getResource as jest.Mock).mockResolvedValue({ data: 'mock-data' });
    (parseToN3 as jest.Mock).mockResolvedValue({ store: 'mock-store' });
});

describe('WebReactiveQuintStore', () => {

    describe('setConfig', () => {
        it('should set the configuration and return the instance', () => {
            const store = new WebReactiveQuintStore();
            const mockSession = new Session();
            const result = store.setConfig({ session: mockSession });

            expect((result as any).config.session).toBe(mockSession);
        });
    });

    describe('getQuintReactiveFromWeb', () => {
        it('should call getQuintReactive when dataset is null', async () => {
            const store = new WebReactiveQuintStore();
            mockGetQuintReactive.mockReturnValue('mock-result');

            const result = await store.getQuintReactiveFromWeb('subject', 'predicate', 'object', 'graph', null);

            expect(mockGetQuintReactive).toHaveBeenCalledWith('subject', 'predicate', 'object', 'graph', null);
            expect(result).toBe('mock-result');
        });

        it('should call getQuintReactive when dataset is already loaded', async () => {
            const store = new WebReactiveQuintStore();
            mockHas.mockReturnValue(true);
            mockGetQuintReactive.mockReturnValue('mock-result');

            const result = await store.getQuintReactiveFromWeb('subject', 'predicate', 'object', 'graph', 'dataset-url');

            expect(mockHas).toHaveBeenCalledWith('dataset-url');
            expect(mockGetQuintReactive).toHaveBeenCalledWith('subject', 'predicate', 'object', 'graph', 'dataset-url');
            expect(result).toBe('mock-result');
        });

        it('should update from web when dataset is provided and not loaded', async () => {
            const store = new WebReactiveQuintStore();
            mockHas.mockReturnValue(false);
            mockGetQuintReactive.mockReturnValue('mock-result');

            const updateFromWebSpy = jest.spyOn(store, 'updateFromWeb').mockResolvedValue(store);

            const result = await store.getQuintReactiveFromWeb('subject', 'predicate', 'object', 'graph', 'dataset-url');

            expect(mockHas).toHaveBeenCalledWith('dataset-url');
            expect(updateFromWebSpy).toHaveBeenCalledWith('dataset-url');
            expect(mockGetQuintReactive).toHaveBeenCalledWith('subject', 'predicate', 'object', 'graph', 'dataset-url');
            expect(result).toBe('mock-result');
        });
    });

    describe('updateFromWeb', () => {
        it('should fetch and update the dataset', async () => {
            const store = new WebReactiveQuintStore();
            const mockSession = new Session();
            store.setConfig({ session: mockSession });

            await store.updateFromWeb('dataset-url');

            expect(getResource).toHaveBeenCalledWith('dataset-url', mockSession);
            expect(parseToN3).toHaveBeenCalledWith('mock-data', 'dataset-url');
            expect(mockUpdate).toHaveBeenCalledWith('dataset-url', 'mock-store');
        });

        it('should skip updating if already loading the dataset', async () => {
            const store = new WebReactiveQuintStore();

            // Start loading the dataset
            const firstPromise = store.updateFromWeb('dataset-url');

            // Try to load it again while it's loading
            const secondPromise = store.updateFromWeb('dataset-url');

            await Promise.all([firstPromise, secondPromise]);

            // getResource should only be called once
            expect(getResource).toHaveBeenCalledTimes(1);
        });

        it('should handle errors when fetching data', async () => {
            const store = new WebReactiveQuintStore();
            const mockError = new Error('Network error');
            (getResource as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await store.updateFromWeb('dataset-url');

            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to update dataset:',
                'dataset-url',
                mockError
            );

            consoleSpy.mockRestore();
        });

        it('should clean up datasetsLoading even if an error occurs', async () => {
            const store = new WebReactiveQuintStore();
            (getResource as jest.Mock).mockRejectedValue(new Error('Network error'));
            jest.spyOn(console, 'error').mockImplementation();

            await store.updateFromWeb('dataset-url');

            // Try to update again - if cleanup worked, getResource should be called
            (getResource as jest.Mock).mockResolvedValue({ data: 'mock-data' });
            await store.updateFromWeb('dataset-url');

            expect(getResource).toHaveBeenCalledTimes(2);
        });

        it('should return the store instance for chaining', async () => {
            const store = new WebReactiveQuintStore();
            const result = await store.updateFromWeb('dataset-url');
            expect(result).toBe(store);
        });
    });

    describe('concurrent operations', () => {
        it('should handle multiple dataset updates concurrently', async () => {
            const store = new WebReactiveQuintStore();

            const promises = [
                store.updateFromWeb('dataset-1'),
                store.updateFromWeb('dataset-2'),
                store.updateFromWeb('dataset-3')
            ];

            await Promise.all(promises);
            expect(getResource).toHaveBeenCalledTimes(3);
            expect(getResource).toHaveBeenCalledWith('dataset-1', expect.any(Session));
            expect(getResource).toHaveBeenCalledWith('dataset-2', expect.any(Session));
            expect(getResource).toHaveBeenCalledWith('dataset-3', expect.any(Session));
        });
    });

    describe('integration tests', () => {
        it('should properly chain operations', async () => {
            const store = new WebReactiveQuintStore();
            const mockSession = new Session();

            mockHas.mockReturnValue(false);

            await store
                .setConfig({ session: mockSession })
                .updateFromWeb('dataset-url');

            await store.getQuintReactiveFromWeb('subject', 'predicate', 'object', 'graph', 'dataset-url');

            expect(mockUpdate).toHaveBeenCalledWith('dataset-url', 'mock-store');
            expect(mockGetQuintReactive).toHaveBeenCalledWith('subject', 'predicate', 'object', 'graph', 'dataset-url');
        });

        it('should not reload already loaded datasets unnecessarily', async () => {
            const store = new WebReactiveQuintStore();

            // First load - dataset not present
            mockHas.mockReturnValueOnce(false);
            await store.getQuintReactiveFromWeb('subject', 'predicate', 'object', 'graph', 'dataset-url');

            // Second load - dataset should be present
            mockHas.mockReturnValueOnce(true);
            await store.getQuintReactiveFromWeb('subject', 'predicate', 'object', 'graph', 'dataset-url');

            // getResource should only be called once for the first load
            expect(getResource).toHaveBeenCalledTimes(1);
        });
    });
});