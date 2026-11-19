import { describe, test, expect, vi } from 'vitest';
import { configure } from '../index.js';
import { JSDOM } from 'jsdom';

describe('init', () => {
    test('should initialize without errors', () => {
        // expect not to throw
        expect(() => configure()).not.toThrow();
    });

    test('should fetch error html', async () => {
        // mock fetch with vitest:
        global.fetch = vi.fn().mockResolvedValue({
            text: () => Promise.resolve('<div id="error">%s%</div>'),
        });
        expect(() => configure({ errorHTML: "url('/error')" })).not.toThrow();
        // verify mock was called
        expect(global.fetch).toHaveBeenCalledWith('/error');
    });

    test('should handle anchors', async () => {
        const dom = await JSDOM.fromFile('./test/html/old.html', {
            url: 'http://localhost:3000',
        });
        document = dom.window.document;
        global.fetch = vi.fn().mockResolvedValue({ text: () => Promise.resolve('') });
        window.scrollTo = vi.fn();
        expect(() => configure()).not.toThrow();
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        window.dispatchEvent(new Event('load'));
        // verify fetch call after anchor click
        const anchor = document.querySelector('a');
        anchor.click();
        await vi.waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/counter', expect.anything()));
        // verify history push
        await vi.waitFor(() => expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/counter'));
        pushStateSpy.mockRestore();
    });

    async function navigate(anchorHtml, pageHtml) {
        const dom = new JSDOM(anchorHtml, { url: 'http://localhost:3000/' });
        document = dom.window.document;
        window.scrollTo = vi.fn();
        global.fetch = vi.fn().mockResolvedValue({ text: () => Promise.resolve(pageHtml) });
        window.dispatchEvent(new Event('load'));
        const loaded = new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
        document.querySelector('a').click();
        await loaded;
        return window.scrollTo;
    }

    test('should scroll to top by default on new page loads', async () => {
        const scrollTo = await navigate('<a href="/next">next</a>', '<div id="page">next</div>');
        expect(scrollTo).toHaveBeenCalledWith(0, 0);
    });

    test('should preserve scroll when the clicked link opts in', async () => {
        const scrollTo = await navigate('<a href="/next" data-preserve-scroll>next</a>', '<div id="page">next</div>');
        expect(scrollTo).not.toHaveBeenCalled();
    });
});
