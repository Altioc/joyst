import { Joyst } from "../joyst";
import { ShowIf } from "../show-if";
import { Subject } from "../subject";

describe("ShowIf", () => {
    const mockInitialize = jest.fn();
    const mockConnect = jest.fn();
    const mockDisconnect = jest.fn();
    class ConditionalElement extends Joyst {
        onInitialize = mockInitialize;
        onConnect = mockConnect;
        onDisconnect = mockDisconnect;
    }
    customElements.define("conditional-element", ConditionalElement);
    customElements.define("show-if", ShowIf);
    const condition = new Subject(false, "testCondition");

    afterEach(() => {
        condition.set(false);
        document.body.innerHTML = "";
        mockInitialize.mockClear();
        mockConnect.mockClear();
        mockDisconnect.mockClear();
    });

    it("should toggle display based on the truthiness of condition", () => {
        const showIf = document.createElement("show-if");
        showIf.appendChild(document.createElement("conditional-element"));
        showIf.setAttribute("condition", "testCondition");
        document.body.appendChild(showIf);

        expect(mockInitialize).toHaveBeenCalledTimes(1);
        expect(mockConnect).toHaveBeenCalledTimes(1);
        expect(mockDisconnect).toHaveBeenCalledTimes(0);
        expect(showIf.style.getPropertyValue("display")).toBe("none");

        condition.set(true);
        expect(mockDisconnect).toHaveBeenCalledTimes(0);
        expect(showIf.style.getPropertyValue("display")).toBe("contents");
    });

    it("should add/remove component based on the truthiness of condition", () => {
        const showIf = document.createElement("show-if");
        showIf.setAttribute("condition", "testCondition");
        showIf.setAttribute("component", "conditional-element");
        document.body.appendChild(showIf);

        expect(mockInitialize).toHaveBeenCalledTimes(0);
        expect(mockConnect).toHaveBeenCalledTimes(0);
        expect(mockDisconnect).toHaveBeenCalledTimes(0);

        condition.set(true);

        expect(mockInitialize).toHaveBeenCalledTimes(1);
        expect(mockConnect).toHaveBeenCalledTimes(1);
        expect(mockDisconnect).toHaveBeenCalledTimes(0);

        condition.set(false);

        expect(mockInitialize).toHaveBeenCalledTimes(1);
        expect(mockConnect).toHaveBeenCalledTimes(1);
        expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it("should let you change condition", () => {
        new Subject(true, "condition2");
        const showIf = document.createElement("show-if");
        showIf.setAttribute("component", "conditional-element");
        showIf.setAttribute("condition", "testCondition");
        document.body.appendChild(showIf);

        expect(mockInitialize).toHaveBeenCalledTimes(0);
        expect(mockConnect).toHaveBeenCalledTimes(0);
        expect(mockDisconnect).toHaveBeenCalledTimes(0);
        expect(showIf.style.getPropertyValue("display")).toBe("none");

        condition.set(true);

        expect(mockInitialize).toHaveBeenCalledTimes(1);
        expect(mockConnect).toHaveBeenCalledTimes(1);
        expect(mockDisconnect).toHaveBeenCalledTimes(0);
        expect(showIf.style.getPropertyValue("display")).toBe("contents");

        showIf.setAttribute("condition", "condition2");

        expect(mockInitialize).toHaveBeenCalledTimes(1);
        expect(mockConnect).toHaveBeenCalledTimes(1);
        expect(mockDisconnect).toHaveBeenCalledTimes(0);
        expect(showIf.style.getPropertyValue("display")).toBe("contents");
    });

    it("should swap component if condition is true", () => {
        const otherMockInitialize = jest.fn();
        const otherMockConnect = jest.fn();
        const otherMockDisconnect = jest.fn();
        class OtherConditionalElement extends Joyst {
            onInitialize = otherMockInitialize;
            onConnect = otherMockConnect;
            onDisconnect = otherMockDisconnect;
        }
        customElements.define(
            "other-conditional-element",
            OtherConditionalElement
        );

        const showIf = document.createElement("show-if");
        showIf.setAttribute("condition", "testCondition");
        showIf.setAttribute("component", "conditional-element");
        condition.set(true);
        document.body.appendChild(showIf);

        expect(mockInitialize).toHaveBeenCalledTimes(1);
        expect(mockConnect).toHaveBeenCalledTimes(1);
        expect(mockDisconnect).toHaveBeenCalledTimes(0);

        expect(otherMockInitialize).toHaveBeenCalledTimes(0);
        expect(otherMockConnect).toHaveBeenCalledTimes(0);
        expect(otherMockDisconnect).toHaveBeenCalledTimes(0);

        showIf.setAttribute("component", "other-conditional-element");

        expect(mockInitialize).toHaveBeenCalledTimes(1);
        expect(mockConnect).toHaveBeenCalledTimes(1);
        expect(mockDisconnect).toHaveBeenCalledTimes(1);

        expect(otherMockInitialize).toHaveBeenCalledTimes(1);
        expect(otherMockConnect).toHaveBeenCalledTimes(1);
        expect(otherMockDisconnect).toHaveBeenCalledTimes(0);

        condition.set(false);

        expect(otherMockInitialize).toHaveBeenCalledTimes(1);
        expect(otherMockConnect).toHaveBeenCalledTimes(1);
        expect(otherMockDisconnect).toHaveBeenCalledTimes(1);

        showIf.setAttribute("component", "conditional-element");

        expect(mockInitialize).toHaveBeenCalledTimes(1);
        expect(mockConnect).toHaveBeenCalledTimes(1);
        expect(mockDisconnect).toHaveBeenCalledTimes(1);

        expect(otherMockInitialize).toHaveBeenCalledTimes(1);
        expect(otherMockConnect).toHaveBeenCalledTimes(1);
        expect(otherMockDisconnect).toHaveBeenCalledTimes(1);
    });

    it("should add component if condition is true and there wasn't a pervious component to swap with", () => {
        const showIf = document.createElement("show-if");
        showIf.setAttribute("condition", "testCondition");
        condition.set(true);
        document.body.appendChild(showIf);

        expect(mockInitialize).toHaveBeenCalledTimes(0);
        expect(mockConnect).toHaveBeenCalledTimes(0);
        expect(mockDisconnect).toHaveBeenCalledTimes(0);

        showIf.setAttribute("component", "conditional-element");

        expect(mockInitialize).toHaveBeenCalledTimes(1);
        expect(mockConnect).toHaveBeenCalledTimes(1);
        expect(mockDisconnect).toHaveBeenCalledTimes(0);

        condition.set(false);

        expect(mockInitialize).toHaveBeenCalledTimes(1);
        expect(mockConnect).toHaveBeenCalledTimes(1);
        expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
});
