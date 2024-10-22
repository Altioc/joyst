/**
 * Subjects represent values that will change over time and that will
 * notify any subscribed entities when they do
 */
export class Subject<SubjectValue = any> extends EventTarget {
    static #allSubjects = new Map<string, WeakRef<Subject>>();

    name?: string;

    #value: SubjectValue;
    #previousValue: SubjectValue | null = null;

    constructor(initialValue: SubjectValue, name?: string) {
        super();
        this.#value = initialValue;

        if (name) {
            this.name = name;
            Subject.#allSubjects.set(name, new WeakRef(this));
        }
    }

    static for(name: string | null | undefined): Subject | undefined {
        if (!name) {
            return;
        }

        return Subject.#allSubjects.get(name)?.deref();
    }

    static clearNamedSubjects(): void {
        Subject.#allSubjects.clear();
    }

    /**
     * Get the current subject value
     */
    get(): SubjectValue {
        return this.#value;
    }

    /**
     * Get the previous subject value
     */
    getPrevious(): SubjectValue | null {
        return this.#previousValue;
    }

    /**
     * Update the current subject value if the provided newValue is different from the current value
     */
    set(newValue: SubjectValue): void {
        if (newValue === this.#value) {
            return;
        }

        this.#previousValue = this.#value;
        this.#value = newValue;
        this.dispatchEvent(new CustomEvent("change", { detail: this }));
    }
}
