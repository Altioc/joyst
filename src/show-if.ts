import { Joyst } from "./joyst";
import { Subject } from "./subject";

/**
 * A component that only shows its content or its component attribute if the condition subject is true
 *
 * condition - The name of a subject that evaluates to a boolean
 * component - (optional) The tag name of the element to create when the condition is true
 */
export class ShowIf extends Joyst {
    static props = ["condition", "component"];

    #active = false;

    #component?: HTMLElement;

    #conditionSubject!: Subject;

    onInitialize(): void {
        this.style.setProperty("display", "none");
    }

    onChange(type: string | Subject, newValue: any): void {
        switch (type) {
            case "condition":
                this.#updateCondition(newValue);
                break;
            case "component":
                this.#updateComponent(newValue);
                break;
            case this.#conditionSubject:
                this.#updateActiveStatus(newValue);
                break;
        }
    }

    #updateCondition(newCondition: string) {
        if (this.#conditionSubject) {
            this.removeSubject(this.#conditionSubject);
        }

        const newSubject = Subject.for(newCondition);

        if (!newSubject) {
            throw new Error(
                `Subject described by: condition="${newCondition}" could not be found`
            );
        }

        this.addSubject(newSubject);
        this.#conditionSubject = newSubject;
    }

    #updateComponent(tag: string): void {
        if (!this.#active) {
            return;
        }

        const newComponent = document.createElement(tag);

        if (this.#component) {
            this.#component.replaceWith(newComponent);
        } else {
            this.appendChild(newComponent);
        }

        this.#component = newComponent;
    }

    #updateActiveStatus(newActive: boolean) {
        this.#active = newActive;

        if (this.#active) {
            this.#show();
        } else {
            this.#hide();
        }
    }

    #show(): void {
        this.style.setProperty("display", "contents");

        if (this.hasAttribute("component")) {
            const tag = this.getAttribute("component")!;
            const component = document.createElement(tag);
            this.#component = component;
            this.appendChild(component);
        }
    }

    #hide(): void {
        this.style.setProperty("display", "none");

        if (this.#component) {
            this.#component.remove();
        }
    }
}
