import { describe, test, expect, vi } from "vitest";
import { configure } from "../index.js";
import { JSDOM } from "jsdom";

describe('init', () => {
    test('should initialize without errors', () => {
        // expect not to throw
        expect(() => configure()).not.toThrow();
    });

    test('should fetch error html', async () => {
        // mock fetch with vitest:
        global.fetch = vi.fn().mockResolvedValue({
            text: () => Promise.resolve('<div id="error">%s%</div>')
        });
        expect(() => configure({ errorHTML: "url('/error')" })).not.toThrow();
        // verify mock was called
        expect(global.fetch).toHaveBeenCalledWith('/error');
    });

    test('should handle anchors', async () => {
        const dom = await JSDOM.fromFile('./test/html/old.html', {
            url: 'http://localhost:3000'
        });
        document = dom.window.document;
        global.fetch = vi.fn().mockResolvedValue({text: () => Promise.resolve('')});
        expect(() => configure()).not.toThrow();
        // verify fetch call after anchor click
        const anchor = document.querySelector('a');
        anchor.click();
        vi.waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/counter'));
        // verify history push
        vi.waitFor(() => expect(window.history.pushState).toHaveBeenCalledWith(null, '', '/counter'));
    })
});