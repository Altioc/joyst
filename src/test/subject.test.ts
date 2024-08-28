import { Subject } from "../subject";

describe("Subject", () => {
    it("should update current and previous value when a new value is provided", () => {
        const subject = new Subject(0);
        expect(subject.get()).toBe(0);
        expect(subject.getPrevious()).toBeNull();

        subject.set(1);
        expect(subject.get()).toBe(1);
        expect(subject.getPrevious()).toBe(0);
    });

    it("should notify subscribers on value change", () => {
        const subject = new Subject(0);
        const mockCallback = jest.fn();
        subject.addEventListener("change", mockCallback);

        expect(mockCallback).not.toHaveBeenCalled();

        subject.set(1);

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(
            expect.objectContaining({ detail: subject })
        );
    });

    it("should not notify subscribers if new value is not different", () => {
        const subject = new Subject(0);
        const mockCallback = jest.fn();
        subject.addEventListener("change", mockCallback);

        expect(mockCallback).not.toHaveBeenCalled();

        subject.set(0);

        expect(mockCallback).not.toHaveBeenCalled();
    });

    it("returns a previously defined, named, subject", () => {
        const subject = new Subject(0, "test");

        expect(Subject.for("test")).toBe(subject);
    });

    it("returns undefined if no name is provided to for static method", () => {
        new Subject(0, "test");
        expect(Subject.for(undefined)).toBeUndefined();
    });
});
