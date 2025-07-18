// @ts-check
import morphDOM from './src/morph-dom.js';
import defaultErrorTemplate from './src/default-error-html.js';

let context = {
    initialized: false,
    errorTemplate: defaultErrorTemplate,
    previousPathName: typeof window !== 'undefined' ? window.location.pathname : '',
};

function updateState(mode, url) {
    switch (mode) {
        case 'push':
            history.pushState(null, '', url);
            window.dispatchEvent(new Event('pushstate'));
            break;
        case 'replace':
            history.replaceState(null, '', url);
            window.dispatchEvent(new Event('replacestate'));
            break;
        case 'pop':
            break;
        default:
            console.error('Invalid history mode');
            break;
    }
}

async function loadPage(url, mode = 'push') {
    const progressBar = document.querySelector('.instajax-progress-bar');
    if (progressBar) {
        progressBar.classList.add('loading');
    }
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
    morphDOM(html);
    updateState(mode, url);
    window.dispatchEvent(new Event('load'));
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

async function init() {
    window.addEventListener('load', () => {
        context.previousPathName = location.pathname;
        const progressBar = document.querySelector('.instajax-progress-bar');
        if (progressBar) {
            progressBar.classList.remove('loading');
        }
        if (!context.initialized) {
            handleAnchors();
            window.addEventListener('load', handleAnchors);
            // onDomChange(handleAnchors);
            context.initialized = true;
        }
    });

    // Handle back/forward browser navigation
    window.addEventListener('popstate', async () => {
        const pathname = location.pathname;
        const { previousPathName } = context;
        if (previousPathName !== pathname) {
            await loadPage(location.href, 'pop');
        }
        context.previousPathName = pathname;
    });
}

if (typeof window !== 'undefined') {
    init();
}

export default async function configure({ errorHTML = defaultErrorTemplate, initialPathName = '' } = {}) {
    if (initialPathName) {
        context.previousPathName = initialPathName;
    }
    if (errorHTML.startsWith('url(')) {
        errorHTML = await fetch(errorHTML.slice(5, -2)).then((res) => res.text());
    }
    if (errorHTML) {
        context.errorTemplate = errorHTML;
    }
}

export { configure, morphDOM };