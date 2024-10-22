import { Collection } from "../collection";

describe("Collection", () => {
    it("should add a value to the collection and dispatch a change event of type Add", () => {
        const collection = new Collection<number>();

        const mockChangeCallback = jest.fn();
        collection.addEventListener("change", mockChangeCallback);

        expect(collection.get()).toStrictEqual([]);

        collection.add(1);

        expect(collection.get()).toStrictEqual([1]);

        expect(mockChangeCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: {
                    type: Collection.Add,
                    value: 1,
                    collection
                }
            })
        );
    });

    it("should remova a value from the collection and dispatch a change event of type Remove", () => {
        const collection = new Collection<number>([1, 2, 3]);

        const mockChangeCallback = jest.fn();
        collection.addEventListener("change", mockChangeCallback);

        expect(collection.get()).toStrictEqual([1, 2, 3]);

        collection.remove(2);

        expect(collection.get()).toStrictEqual([1, 3]);

        expect(mockChangeCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: {
                    type: Collection.Remove,
                    value: 1,
                    collection
                }
            })
        );
    });

    it("should fail silently if the value to remove does not exist in the collection", () => {
        const collection = new Collection<number>([1, 2, 3]);

        const mockChangeCallback = jest.fn();
        collection.addEventListener("change", mockChangeCallback);

        expect(collection.get()).toStrictEqual([1, 2, 3]);

        collection.remove(4);

        expect(collection.get()).toStrictEqual([1, 2, 3]);

        expect(mockChangeCallback).not.toHaveBeenCalled();
    });

    it("should update the entire collection and dispatch a change event of type Set", () => {
        const collection = new Collection<number>([1, 2, 3]);

        const mockChangeCallback = jest.fn();
        collection.addEventListener("change", mockChangeCallback);

        expect(collection.get()).toStrictEqual([1, 2, 3]);

        collection.set([3, 2, 1]);

        expect(collection.get()).toStrictEqual([3, 2, 1]);

        expect(mockChangeCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: {
                    type: Collection.Set,
                    value: collection,
                    collection
                }
            })
        );
    });

    it("should fail silently if set is called with the current collection's value", () => {
        const collectionValue = [1, 2, 3];

        const collection = new Collection<number>(collectionValue);

        const mockChangeCallback = jest.fn();
        collection.addEventListener("change", mockChangeCallback);

        expect(collection.get()).toBe(collectionValue);

        collection.set(collectionValue);

        expect(collection.get()).toBe(collectionValue);

        expect(mockChangeCallback).not.toHaveBeenCalled();
    });

    it("returns a previously named collection", () => {
        const collection = new Collection([], "test");

        expect(Collection.for("test")).toBe(collection);
    });

    it("returns undefined if no name is provided to the 'for' static method or there are no collections with the given name", () => {
        new Collection([], "test");

        expect(Collection.for(undefined)).toBeUndefined();

        expect(Collection.for("some other name")).toBeUndefined();
    });

    it("should clear previously named collections when calling 'clearNamedCollections'", () => {
        const collection1 = new Collection([], "test1");
        const collection2 = new Collection([], "test2");

        expect(Collection.for("test1")).toBe(collection1);
        expect(Collection.for("test2")).toBe(collection2);

        Collection.clearNamedCollections();

        expect(Collection.for("test1")).toBeUndefined();
        expect(Collection.for("test2")).toBeUndefined();
    });
});
