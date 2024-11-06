// @ts-check
import { Idiomorph } from 'idiomorph/dist/idiomorph.esm';

const domParser = new DOMParser();

/**
 * @param {string} html
 */
function getTargetBy(html) {
    const hasHead = html.match(/<head[^>]*>/);
    const hasBody = html.match(/<body[^>]*>/);
    if (hasHead && hasBody) {
        return document.documentElement;
    }
    if (hasHead) {
        // no body
        return document.head;
    }
    if (hasBody) {
        // no head
        return document.body;
    }
    // no head and no body
    const temp = domParser.parseFromString(html, 'text/html');
    if (temp.body.children.length > 1) {
        return document.body;
    }
    /** @type {HTMLElement} */ const firstElement = temp.body.firstChild;
    if (firstElement && firstElement.nodeType === 1) {
        let target = null;
        const tagName = firstElement.tagName.toLowerCase();
        if (firstElement.id) {
            target = document.getElementById(firstElement.id);
        }
        if (!target && firstElement.classList.length) {
            target = document.querySelector(`${tagName}.${firstElement.className.split(' ').join('.')}`);
        }
        if (!target) {
            target = document.querySelector(tagName);
        }
        if (target) {
            return target;
        }
    }
    throw new Error(`Invalid HTML response\n${html}`);
}

export default function morphDom(newDom) {
    const target = getTargetBy(newDom);
    Idiomorph.morph(target, newDom);
}
