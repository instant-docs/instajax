import { describe, test, expect, vi } from "vitest";
import { JSDOM } from "jsdom";
import morphDOM from "../src/morph-dom.js";
import { readFileSync } from "fs";
import { join } from "path";

// normalize spaces:
function normalize(str) {
    return str.replace(/\s+/g, ' ').trim();
}

describe("Morph modal", () => {
    test("should morph modal", () => {
        const oldHtmlString = readFileSync(join(__dirname, "html/modal-closed.html"), "utf-8");
        const newHtmlString = readFileSync(join(__dirname, "html/modal-open.html"), "utf-8");
        const dom = new JSDOM(oldHtmlString);
        document = dom.window.document;
        morphDOM(newHtmlString);
        expect(document.getElementById("modal").classList.contains("hidden")).toBe(false);
        expect(window.document.getElementById("open-modal")).not.toBeNull();
    });
});