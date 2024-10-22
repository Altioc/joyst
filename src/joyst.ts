import { Subject } from "./subject";

type EventDescriptor = {
    name: string;
    callback: any;
    target: EventTarget;
};

const NoTemplate = Symbol("NoTemplate");

type TemplateResolvable = typeof NoTemplate | HTMLTemplateElement | string;

const PascalCaseRegexp = /([A-Za-z0-9])([A-Z])/g;

/**
 * Extend Joyst to create Joyst-supported custom elements
 */
export class Joyst extends HTMLElement {
    static template: TemplateResolvable = NoTemplate;
    static inputs: string[] = [];
    static get observedAttributes(): string[] {
        return this.inputs;
    }

    static get tag(): string {
        return this.name.replace(PascalCaseRegexp, "$1-$2").toLowerCase();
    }

    #initialized = false;
    #events = new Set<EventDescriptor>();
    #initialAttributeValues: [string, string, string | null][] = [];
    #keyedChildren = new Map<string, WeakRef<HTMLElement>>();

    /**
     * for initialize:
     * - set up template and keyed children
     * - onInitialize
     * - apply initial attribute values
     *
     * for connect:
     * - adds listeners for events
     * - onConnect
     */
    connectedCallback() {
        if (!this.#initialized) {
            this.#initializeTemplateContent();

            this.onInitialize();

            for (const value of this.#initialAttributeValues) {
                this.onChange(...value);
            }

            this.#initialized = true;
        }

        for (const event of this.#events) {
            event.target.addEventListener(event.name, event.callback);

            if (event.target instanceof Subject) {
                this.onChange(
                    event.target,
                    event.target.get(),
                    event.target.getPrevious()
                );
            }
        }

        this.onConnect();
    }

    /**
     * - removes listeners for events
     * - onDisconnect
     */
    disconnectedCallback() {
        for (const event of this.#events) {
            event.target.removeEventListener(event.name, event.callback);
        }

        this.onDisconnect();
    }

    attributeChangedCallback(
        type: string,
        previousValue: string,
        newValue: string
    ) {
        if (!this.#initialized) {
            this.#initialAttributeValues.push([type, newValue, previousValue]);
            return;
        }

        this.onChange(type, newValue, previousValue);
    }

    /**
     * Adding an event will ensure that it's set up on connect and removed on disconnect
     */
    addEvent(
        eventName: string,
        callback: any,
        target: EventTarget = this
    ): void {
        this.#events.add({ name: eventName, callback, target });

        if (this.#initialized) {
            target.addEventListener(eventName, callback);
        }
    }

    removeEvent(
        eventName: string,
        callback: any,
        target: EventTarget = this
    ): void {
        target.removeEventListener(eventName, callback);

        for (const event of this.#events) {
            const isSameEvent = event.name === eventName
                && event.callback === callback
                && event.target === target;

            if (isSameEvent) {
                this.#events.delete(event);
                return;
            }
        }
    }

    /**
     * Convenience wrapper around addEvent that listens to a subject's change event
     */
    addSubject(subjectResolvable: Subject | string | null | undefined): void {
        const subject = typeof subjectResolvable === "string"
            ? Subject.for(subjectResolvable)
            : subjectResolvable;

        if (subject === null || subject === undefined) {
            return;
        }

        this.addEvent("change", this.#onSubjectChange, subject);

        if (this.#initialized) {
            this.onChange(subject, subject.get(), subject.getPrevious());
        }
    }

    #onSubjectChange = (event: CustomEvent<Subject>) => {
        const { detail: subject } = event;
        this.onChange(subject, subject.get(), subject.getPrevious());
    };

    removeSubject(
        subjectResolvable: Subject | string | null | undefined
    ): void {
        const subject = typeof subjectResolvable === "string"
            ? Subject.for(subjectResolvable)
            : subjectResolvable;

        if (subject === null || subject === undefined) {
            return;
        }

        this.removeEvent("change", this.#onSubjectChange, subject);
    }

    /**
     * Returns a reference to a child element that had a "key" attribute
     * when the template was initialized
     *
     * Throws error if the child no longer exists when the method is called
     */
    getChild<ElementType extends HTMLElement = HTMLElement>(
        childName: string
    ): ElementType {
        const child = this.#keyedChildren.get(childName)?.deref();

        if (!child) {
            throw new Error(`Attempted to get nonexistent child: ${childName}`);
        }

        return child as ElementType;
    }

    /**
     * Override this method to add custom logic for handling attribute
     * and/or subject value changes
     */
    onChange(type: string | Subject, newValue: any, previousValue: any) {}

    /**
     * Override this method to add custom logic when the component is
     * connected to the DOM for the first time
     */
    onInitialize() {}

    /**
     * Override this method to add custom logic when the component is
     * connected to the DOM at any time
     *
     * Synonymous with connectedCallback
     */
    onConnect() {}

    /**
     * Override this method to add custom logic when the component is
     * disconnected from the DOM
     *
     * Synonymous with disconnectedCallback
     */
    onDisconnect() {}

    #initializeTemplateContent() {
        // @ts-ignore
        let template: TemplateResolvable | null = this.constructor.template;

        if (template === NoTemplate) {
            return;
        }

        if (!template) {
            throw new Error("Recieved an invalid template");
        }

        if (typeof template === "string") {
            template = document.querySelector<HTMLTemplateElement>(
                `template#${template}`
            );
        }

        if (template === null) {
            throw new Error(
                `Failed to find a template whose id matches: ${template}`
            );
        }

        const content = template.content.cloneNode(true) as DocumentFragment;

        const keyedChildren = content.querySelectorAll<HTMLElement>("[key]");
        keyedChildren.forEach((child) => {
            const key = child.getAttribute("key")!;
            this.#keyedChildren.set(key, new WeakRef(child));
        });

        this.appendChild(content);
    }
}
