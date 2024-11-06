// @ts-check
import morphDom from './src/morph-dom.js';
import defaultErrorTemplate from './src/default-error-html.js';

let context = {
    initialized: false,
    errorTemplate: defaultErrorTemplate,
};

function updateState(mode, url) {
    switch (mode) {
        case 'push':
            history.pushState(null, null, url);
            break;
        case 'replace':
            history.replaceState(null, null, url);
            break;
        case 'pop':
            break;
        default:
            console.error('Invalid history mode');
            break;
    }
}

async function loadPage(url, mode = 'push') {
    let html;
    try {
        const response = await fetch(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
        html = await response.text();
    } catch (fetchError) {
        html = context.errorTemplate.replaceAll('%error%', fetchError.message);
    }
    try {
        morphDom(html);
    } catch (morphError) {
        console.error(morphError);
    }
    updateState(mode, url);
    window.dispatchEvent(new Event('load'));
}

function onDomChange(callback) {
    const observer = new MutationObserver((mutations) => callback(mutations));

    // Observe changes in the entire document
    observer.observe(document.body, {
        childList: true, // Observe direct children
        subtree: true, // Observe all descendants (not just direct children)
        attributes: false, // Observe changes to attributes
        characterData: false, // Observe changes to text content
    });

    // Return the observer so it can be disconnected later if needed
    return observer;
}

const handledAnchors = new Set();

function handleAnchors() {
    document.querySelectorAll('a:not(.skip-instajax)').forEach((anchor) => {
        if (handledAnchors.has(anchor)) return;
        anchor.addEventListener('click', (event) => {
            const url = anchor.getAttribute('href') || '#';
            if (url.lastIndexOf('#') < url.lastIndexOf('/')) {
                event.preventDefault();
                // Check if it’s an internal link
                if (url && (!url.startsWith('http') || new URL(url).origin === location.origin)) {
                    loadPage(url);
                }
            }
        });
        handledAnchors.add(anchor);
    });
}

export async function init({ errorHTML = defaultErrorTemplate } = {}) {
    if (errorHTML.startsWith('url(')) {
        errorHTML = await fetch(errorHTML.slice(5, -2)).then((res) => res.text());
    }
    context.errorTemplate = errorHTML;
    window.addEventListener('load', () => {
        if (!context.initialized) {
            handleAnchors();
            onDomChange(handleAnchors);
            context.initialized = true;
        }
    });

    // Handle back/forward browser navigation
    window.addEventListener('popstate', async () => {
        await loadPage(location.href, 'pop');
    });
}
