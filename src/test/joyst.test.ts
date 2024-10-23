import { Collection, CollectionChangeDetail } from "../collection";
import { Joyst } from "../joyst";
import { Subject } from "../subject";

describe("Joyst", () => {
    let tagNumber = 0;

    afterEach(() => {
        Subject.clearNamedSubjects();
        document.body.innerHTML = "";
    });

    it("maps from a static array of string props to a static arry of string observedAttributes", () => {
        class Test extends Joyst {
            static props = ["test1", "test2"];
        }
        expect(Test.observedAttributes).toStrictEqual(["test1", "test2"]);
    });

    it("generates an appropriate static tag value based on the class name", () => {
        class ATestClassName extends Joyst {}
        expect(ATestClassName.tag).toBe("a-test-class-name");
    });

    describe("Events", () => {
        it("listens for events defined in Initialize", () => {
            const tagName = `my-test${tagNumber++}`;
            const mockCallback = jest.fn();
            class Test extends Joyst {
                onInitialize() {
                    this.addEvent("click", mockCallback);
                }
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            element.setAttribute("test", "foobar");
            document.body.appendChild(element);

            expect(mockCallback).toHaveBeenCalledTimes(0);

            element.dispatchEvent(new Event("click"));

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it("listens for events defined anywhere else", () => {
            const tagName = `my-test${tagNumber++}`;
            const mockCallback = jest.fn();
            class Test extends Joyst {
                static props = ["test"];

                onChange(_: string, newValue: string) {
                    if (newValue === "1") {
                        this.addEvent("click", mockCallback);
                    }
                }
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            element.setAttribute("test", "0");
            document.body.appendChild(element);

            expect(mockCallback).toHaveBeenCalledTimes(0);

            element.dispatchEvent(new Event("click"));

            expect(mockCallback).toHaveBeenCalledTimes(0);

            element.setAttribute("test", "1");
            element.dispatchEvent(new Event("click"));

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it("stops listening for events on disconnect", () => {
            const tagName = `my-test${tagNumber++}`;
            const mockCallback = jest.fn();
            class Test extends Joyst {
                onInitialize() {
                    this.addEvent("click", mockCallback);
                }
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            element.setAttribute("test", "foobar");
            document.body.appendChild(element);

            expect(mockCallback).toHaveBeenCalledTimes(0);

            element.dispatchEvent(new Event("click"));

            expect(mockCallback).toHaveBeenCalledTimes(1);

            document.body.innerHTML = "";

            element.dispatchEvent(new Event("click"));

            expect(mockCallback).toHaveBeenCalledTimes(1);

            document.body.appendChild(element);

            element.dispatchEvent(new Event("click"));

            expect(mockCallback).toHaveBeenCalledTimes(2);
        });

        it("removed events will not have listeners added on connect", () => {
            const tagName = `my-test${tagNumber++}`;
            const mockCallback = jest.fn();
            class Test extends Joyst {
                onInitialize() {
                    this.addEvent("click", mockCallback);
                }
                onDisconnect() {
                    this.removeEvent("click", mockCallback);
                }
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            document.body.appendChild(element);

            expect(mockCallback).toHaveBeenCalledTimes(0);

            element.dispatchEvent(new Event("click"));

            expect(mockCallback).toHaveBeenCalledTimes(1);

            document.body.innerHTML = "";

            element.dispatchEvent(new Event("click"));

            expect(mockCallback).toHaveBeenCalledTimes(1);

            document.body.appendChild(element);

            element.dispatchEvent(new Event("click"));

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });
    });

    describe("Subjects", () => {
        it("subscribes to subjects defined in Initialize", () => {
            const tagName = `my-test${tagNumber++}`;
            const subject = new Subject(0);
            const mockChange = jest.fn();
            class Test extends Joyst {
                onInitialize() {
                    this.addSubject(subject);
                }
                onChange = mockChange;
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            document.body.appendChild(element);

            expect(mockChange).toHaveBeenCalledTimes(1);

            subject.set(1);

            expect(mockChange).toHaveBeenCalledTimes(2);
        });

        it("subscribes to subjects defined anywhere else", () => {
            const tagName = `my-test${tagNumber++}`;
            const subject = new Subject(99);
            const mockSubjectChange = jest.fn();
            class Test extends Joyst {
                static props = ["test"];

                onChange(type: Subject, newValue: string) {
                    if (newValue === "1") {
                        this.addSubject(subject);
                    }

                    if (type === subject) {
                        mockSubjectChange();
                    }
                }
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            element.setAttribute("test", "0");
            document.body.appendChild(element);

            expect(mockSubjectChange).toHaveBeenCalledTimes(0);

            element.setAttribute("test", "1");

            expect(mockSubjectChange).toHaveBeenCalledTimes(1);

            subject.set(98);

            expect(mockSubjectChange).toHaveBeenCalledTimes(2);
        });

        it("unsubscribes from subjects on disconnect", () => {
            const tagName = `my-test${tagNumber++}`;
            const subject = new Subject(0);
            const mockChange = jest.fn();
            class Test extends Joyst {
                onInitialize() {
                    this.addSubject(subject);
                }
                onChange = mockChange;
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            document.body.appendChild(element);

            expect(mockChange).toHaveBeenCalledTimes(1);
            expect(mockChange).toHaveBeenCalledWith(subject, 0, null);

            subject.set(1);

            expect(mockChange).toHaveBeenCalledTimes(2);
            expect(mockChange).toHaveBeenCalledWith(subject, 1, 0);

            document.body.innerHTML = "";
            subject.set(2);

            expect(mockChange).toHaveBeenCalledTimes(2);

            document.body.appendChild(element);

            expect(mockChange).toHaveBeenCalledTimes(3);
            expect(mockChange).toHaveBeenCalledWith(subject, 2, 1);

            subject.set(3);

            expect(mockChange).toHaveBeenCalledTimes(4);
            expect(mockChange).toHaveBeenCalledWith(subject, 3, 2);
        });

        it("removed subjects will not be resubscribed to on connect", () => {
            const tagName = `my-test${tagNumber++}`;
            const subject = new Subject(0);
            const mockChange = jest.fn();
            class Test extends Joyst {
                onInitialize() {
                    this.addSubject(subject);
                }
                onChange = mockChange;
                onDisconnect() {
                    this.removeSubject(subject);
                }
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            document.body.appendChild(element);

            expect(mockChange).toHaveBeenCalledTimes(1);
            expect(mockChange).toHaveBeenCalledWith(subject, 0, null);

            subject.set(1);

            expect(mockChange).toHaveBeenCalledTimes(2);
            expect(mockChange).toHaveBeenCalledWith(subject, 1, 0);

            document.body.innerHTML = "";

            subject.set(2);

            expect(mockChange).toHaveBeenCalledTimes(2);

            document.body.appendChild(element);

            expect(mockChange).toHaveBeenCalledTimes(2);

            subject.set(3);

            expect(mockChange).toHaveBeenCalledTimes(2);
        });

        it("can reference subjects by their name", () => {
            const tagName = `my-test${tagNumber++}`;
            const subject = new Subject(0, "test");
            const mockChange = jest.fn();
            class Test extends Joyst {
                onInitialize() {
                    this.addSubject("test");
                }
                onChange = mockChange;
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName) as Test;
            document.body.appendChild(element);

            expect(mockChange).toHaveBeenCalledTimes(1);

            subject.set(1);

            expect(mockChange).toHaveBeenCalledTimes(2);

            element.removeSubject("test");

            subject.set(2);

            expect(mockChange).toHaveBeenCalledTimes(2);
        });

        it("fails silently if given an invalid subject or subject name", () => {
            const tagName = `my-test${tagNumber++}`;
            const subject = new Subject(0, "test");
            const mockChange = jest.fn();
            class Test extends Joyst {
                onInitialize() {
                    this.addSubject(undefined);
                }
                onChange = mockChange;
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName) as Test;
            document.body.appendChild(element);

            expect(mockChange).toHaveBeenCalledTimes(0);

            subject.set(1);

            expect(mockChange).toHaveBeenCalledTimes(0);

            element.removeSubject(undefined);

            subject.set(2);

            expect(mockChange).toHaveBeenCalledTimes(0);
        });
    });

    describe("Collections", () => {
        it("subscribes to collections defined in Initialize", () => {
            const tagName = `my-test${tagNumber++}`;
            const collection = new Collection<number>();
            const mockChange = jest.fn();
            class Test extends Joyst {
                onInitialize() {
                    this.addCollection(collection);
                }
                onChange = mockChange;
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            document.body.appendChild(element);

            expect(mockChange).toHaveBeenCalledTimes(1);

            collection.add(1);

            expect(mockChange).toHaveBeenCalledTimes(2);
        });

        it("subscribes to collections defined anywhere else", () => {
            const tagName = `my-test${tagNumber++}`;
            const collection = new Collection<number>();
            const mockCollectionChange = jest.fn();
            class Test extends Joyst {
                static props = ["test"];

                onChange(
                    type: Collection | string,
                    newValue: CollectionChangeDetail | string
                ) {
                    if (newValue === "1") {
                        this.addCollection(collection);
                    }

                    if (type === collection) {
                        mockCollectionChange();
                    }
                }
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            element.setAttribute("test", "0");
            document.body.appendChild(element);

            expect(mockCollectionChange).toHaveBeenCalledTimes(0);

            element.setAttribute("test", "1");

            expect(mockCollectionChange).toHaveBeenCalledTimes(1);

            collection.add(1);

            expect(mockCollectionChange).toHaveBeenCalledTimes(2);
        });

        it("unsubscribes from collections on disconnect", () => {
            const tagName = `my-test${tagNumber++}`;
            const collection = new Collection<number>();
            const mockChange = jest.fn();
            class Test extends Joyst {
                onInitialize() {
                    this.addCollection(collection);
                }
                onChange = mockChange;
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            document.body.appendChild(element);

            expect(mockChange).toHaveBeenCalledTimes(1);
            expect(mockChange).toHaveBeenCalledWith(collection, {
                type: Collection.Set,
                value: collection.get(),
                collection
            }, undefined);

            collection.add(1);

            expect(mockChange).toHaveBeenCalledTimes(2);
            expect(mockChange).toHaveBeenCalledWith(collection, {
                type: Collection.Add,
                value: 1,
                collection
            }, undefined);

            document.body.innerHTML = "";

            collection.add(2);

            expect(mockChange).toHaveBeenCalledTimes(2);

            document.body.appendChild(element);

            expect(mockChange).toHaveBeenCalledTimes(3);
            expect(mockChange).toHaveBeenCalledWith(collection, {
                type: Collection.Set,
                value: collection.get(),
                collection
            }, undefined);

            collection.add(3);

            expect(mockChange).toHaveBeenCalledTimes(4);
            expect(mockChange).toHaveBeenCalledWith(collection, {
                type: Collection.Add,
                value: 3,
                collection
            }, undefined);
        });

        it("removed collections will not be resubscribed to on connect", () => {
            const tagName = `my-test${tagNumber++}`;
            const collection = new Collection<number>();
            const mockChange = jest.fn();
            class Test extends Joyst {
                onInitialize() {
                    this.addCollection(collection);
                }
                onChange = mockChange;
                onDisconnect() {
                    this.removeCollection(collection);
                }
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            document.body.appendChild(element);

            expect(mockChange).toHaveBeenCalledTimes(1);
            expect(mockChange).toHaveBeenCalledWith(collection, {
                type: Collection.Set,
                value: collection.get(),
                collection
            }, undefined);

            collection.add(1);

            expect(mockChange).toHaveBeenCalledTimes(2);
            expect(mockChange).toHaveBeenCalledWith(collection, {
                type: Collection.Add,
                value: 1,
                collection
            }, undefined);

            document.body.innerHTML = "";

            collection.add(2);

            expect(mockChange).toHaveBeenCalledTimes(2);

            document.body.appendChild(element);

            expect(mockChange).toHaveBeenCalledTimes(2);

            collection.add(3);

            expect(mockChange).toHaveBeenCalledTimes(2);
        });

        it("can reference collections by their name", () => {
            const tagName = `my-test${tagNumber++}`;
            const collection = new Collection<number>([], "test");
            const mockChange = jest.fn();
            class Test extends Joyst {
                onInitialize() {
                    this.addCollection("test");
                }
                onChange = mockChange;
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName) as Test;
            document.body.appendChild(element);

            expect(mockChange).toHaveBeenCalledTimes(1);

            collection.add(1);

            expect(mockChange).toHaveBeenCalledTimes(2);

            element.removeCollection("test");

            collection.add(2);

            expect(mockChange).toHaveBeenCalledTimes(2);
        });

        it("fails silently if given an invalid collection or collection name", () => {
            const tagName = `my-test${tagNumber++}`;
            const collection = new Collection<number>([], "test");
            const mockChange = jest.fn();
            class Test extends Joyst {
                onInitialize() {
                    this.addCollection(undefined);
                }
                onChange = mockChange;
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName) as Test;
            document.body.appendChild(element);

            expect(mockChange).toHaveBeenCalledTimes(0);

            collection.add(1);

            expect(mockChange).toHaveBeenCalledTimes(0);

            element.removeCollection(undefined);

            collection.add(2);

            expect(mockChange).toHaveBeenCalledTimes(0);
        });
    });

    describe("Children", () => {
        it("Sets its content to a clone of a provided template element", () => {
            const tagName = `my-test${tagNumber++}`;
            document.body.innerHTML = `
                <template>
                    <h1>Test</h1>
                </template>
            `;

            const template = document.querySelector<HTMLTemplateElement>(
                "template"
            )!;

            class Test extends Joyst {
                static template = template;
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            document.body.appendChild(element);

            expect(template).not.toBeNull();

            expect(element.shadowRoot!.innerHTML).toBe(template!.innerHTML);
        });

        it("does nothing if no template is provided", () => {
            const tagName = `my-test${tagNumber++}`;
            class Test extends Joyst {}
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            document.body.appendChild(element);

            expect(element.shadowRoot!.innerHTML).toBe("");
        });

        it("Queries for the template if the template property is a string", () => {
            const tagName = `my-test${tagNumber++}`;
            document.body.innerHTML = `
                <template id="my-template">
                    <h1>Test</h1>
                </template>
            `;
            class Test extends Joyst {
                static template = "my-template";
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);
            document.body.appendChild(element);

            const template = document.querySelector("template");
            expect(template).not.toBeNull();

            expect(element.shadowRoot!.innerHTML).toBe(template!.innerHTML);
        });

        it("It caches all keyed elements in the template", () => {
            const tagName = `my-test${tagNumber++}`;
            document.body.innerHTML = `
                <template>
                    <h1 key="testH1">Test H1</h1>
                    <button key="testButton">Test Button</button>
                </template>
            `;

            const template = document.querySelector("template")!;

            class Test extends Joyst {
                static template = template;
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName) as Test;
            document.body.appendChild(element);

            const h1 = element.getChild("testH1");
            expect(h1.tagName).toBe("H1");
            expect(h1.textContent).toBe("Test H1");

            const button = element.getChild("testButton");
            expect(button.tagName).toBe("BUTTON");
            expect(button.textContent).toBe("Test Button");
        });
    });

    describe("Lifecycle", () => {
        it("calls initialize before connect", () => {
            const tagName = `my-test${tagNumber++}`;
            const mockInitialize = jest.fn();
            const mockConnect = jest.fn();
            class Test extends Joyst {
                onInitialize = () => mockInitialize(performance.now());
                onConnect = () => mockConnect(performance.now());
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);

            expect(mockInitialize).toHaveBeenCalledTimes(0);
            expect(mockConnect).toHaveBeenCalledTimes(0);

            document.body.appendChild(element);

            expect(mockInitialize).toHaveBeenCalledTimes(1);
            expect(mockConnect).toHaveBeenCalledTimes(1);

            const initializeTimestamp = mockInitialize.mock.calls[0][0];
            const connectTimestamp = mockConnect.mock.calls[0][0];
            expect(initializeTimestamp).toBeLessThan(connectTimestamp);
        });

        it("does not call change before initialize", () => {
            const tagName = `my-test${tagNumber++}`;
            const mockInitialize = jest.fn();
            const mockChange = jest.fn();
            class Test extends Joyst {
                static props = ["test"];
                onInitialize = () => mockInitialize(performance.now());
                onChange = () => mockChange(performance.now());
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);

            expect(mockInitialize).toHaveBeenCalledTimes(0);
            expect(mockChange).toHaveBeenCalledTimes(0);

            element.setAttribute("test", "test");
            document.body.appendChild(element);

            expect(mockInitialize).toHaveBeenCalledTimes(1);
            expect(mockChange).toHaveBeenCalledTimes(1);

            const initializeTimestamp = mockInitialize.mock.calls[0][0];
            const changeTimestamp = mockChange.mock.calls[0][0];
            expect(initializeTimestamp).toBeLessThan(changeTimestamp);
        });

        it("calls disconnect on an elements removal from the DOM", () => {
            const tagName = `my-test${tagNumber++}`;
            const mockDisconnect = jest.fn();
            class Test extends Joyst {
                onDisconnect = mockDisconnect;
            }
            customElements.define(tagName, Test);
            const element = document.createElement(tagName);

            expect(mockDisconnect).toHaveBeenCalledTimes(0);

            document.body.appendChild(element);

            expect(mockDisconnect).toHaveBeenCalledTimes(0);

            document.body.innerHTML = "";

            expect(mockDisconnect).toHaveBeenCalledTimes(1);
        });
    });
});
