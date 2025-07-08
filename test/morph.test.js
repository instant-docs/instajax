// @vitest-environment jsdom

import { describe, test, expect } from "vitest";
import morphDOM from "../src/morph-dom.js";
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import { join } from "path";

describe("Morph html", () => {

    const normalize = (s) => s.replace(/<!DOCTYPE html>/gi, '').replace(/>\s+</g, '><').replace(/(\s*)\/>/g, '>').replace(/\s+/g, " ").trim();

    test("should morph a simple html string", () => {
        const htmlString = "<div id=\"test\">hello</div>";
        document.body.innerHTML = htmlString;
        
        const newHtmlString = "<div id=\"test\">hello world</div>";
        morphDOM(newHtmlString);

        expect(document.body.innerHTML).toBe(newHtmlString);
    })

    test("morph whole html", async () => {
        const htmlString = "<html><head><title>test</title></head><body><div id=\"test\">hello</div></body></html>";
        const dom = new JSDOM(htmlString);
        document = dom.window.document;
        const newHtmlString = "<html><head><title>new title</title></head><body><div id=\"test\">hello world</div></body></html>";
        morphDOM(newHtmlString);

        expect(normalize(document.documentElement.outerHTML)).toBe(normalize(newHtmlString));
    });

    test("morph complex html", async () => {
        const oldHtmlString = readFileSync(join(__dirname, "html/old.html"), "utf-8");
        const newHtmlString = readFileSync(join(__dirname, "html/new.html"), "utf-8");
        const dom = new JSDOM(oldHtmlString);
        document = dom.window.document;
        morphDOM(newHtmlString);
        // ignore whitespace changes while expecting new html
        expect(normalize(document.documentElement.outerHTML)).toBe(normalize(newHtmlString));
    });

    test("morph complex html 2", async () => {
        const oldHtmlString = readFileSync(join(__dirname, "html/new.html"), "utf-8");
        const newHtmlString = readFileSync(join(__dirname, "html/old.html"), "utf-8");
        const dom = new JSDOM(oldHtmlString);
        document = dom.window.document;
        morphDOM(newHtmlString);
        // ignore whitespace changes while expecting new html
        expect(normalize(document.documentElement.outerHTML)).toBe(normalize(newHtmlString));
    });

})