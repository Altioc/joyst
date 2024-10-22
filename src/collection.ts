export type CollectionChangeDetail = {
    type:
        | typeof Collection.Add
        | typeof Collection.Remove
        | typeof Collection.Set;
    value: any;
    collection: Collection;
};

/**
 * Subjects represent values that will change over time and that will
 * notify any subscribed entities when they do
 */
export class Collection<ElementType = any> extends EventTarget {
    static #allCollections = new Map<string, WeakRef<Collection>>();

    static Add = Symbol("collection add");
    static Remove = Symbol("collection remove");
    static Set = Symbol("collection set");

    name?: string;

    #values: ElementType[];

    constructor(initialValues: ElementType[] = [], name?: string) {
        super();
        this.#values = initialValues;

        if (name) {
            this.name = name;
            Collection.#allCollections.set(name, new WeakRef(this));
        }
    }

    static for(name: string | null | undefined): Collection | undefined {
        if (!name) {
            return;
        }

        return Collection.#allCollections.get(name)?.deref();
    }

    static clearNamedCollections(): void {
        Collection.#allCollections.clear();
    }

    /**
     * Get the collection values
     */
    get(): ElementType[] {
        return this.#values;
    }

    /**
     * Update the collection with a new set of values
     */
    set(newValues: ElementType[]): void {
        if (newValues === this.#values) {
            return;
        }

        this.#values = newValues;

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    type: Collection.Set,
                    value: this,
                    collection: this
                }
            })
        );
    }

    /**
     * Add a value to the collection
     */
    add(newElement: ElementType): void {
        this.#values.push(newElement);

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    type: Collection.Add,
                    value: newElement,
                    collection: this
                }
            })
        );
    }

    /**
     * Remove the given element, if found, from the collection
     */
    remove(elementToRemove: ElementType): void {
        const removalIndex = this.#getIndexOfElement(elementToRemove);

        if (removalIndex === null) {
            return;
        }

        this.#values.splice(removalIndex, 1);

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    type: Collection.Remove,
                    value: removalIndex,
                    collection: this
                }
            })
        );
    }

    #getIndexOfElement(element: ElementType): number | null {
        for (let i = 0; i < this.#values.length; i++) {
            if (this.#values[i] === element) {
                return i;
            }
        }

        return null;
    }
}
