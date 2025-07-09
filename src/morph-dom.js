export default function morphDOM(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  let newContentRoot;
  let currentDomRoot;
  let shouldMorphNode = false;

  const hasHtmlTag = /<html[^>]*>/i.test(htmlString);
  const hasHeadTag = /<head[^>]*>/i.test(htmlString);
  const hasBodyTag = /<body[^>]*>/i.test(htmlString);

  if (hasHtmlTag) {
    newContentRoot = doc.documentElement;
    currentDomRoot = document.documentElement;
    shouldMorphNode = true;
  } else if (hasHeadTag) {
    newContentRoot = doc.head;
    currentDomRoot = document.head;
    shouldMorphNode = true;
  } else if (hasBodyTag) {
    newContentRoot = doc.body;
    currentDomRoot = document.body;
    shouldMorphNode = true;
  } else {
    // It's a fragment. Treat it as content for the document.body.
    // Create a temporary container to hold the new fragment's nodes.
    const tempContainer = document.createElement('div');
    Array.from(doc.body.childNodes).forEach(node => tempContainer.appendChild(node.cloneNode(true)));
    const firstChild = tempContainer;
    const selector = getSelectorForElement(firstChild);
    currentDomRoot = document.body.querySelector(selector);
    newContentRoot = currentDomRoot ? tempContainer.firstChild : tempContainer;
    shouldMorphNode = !!currentDomRoot;
    currentDomRoot = currentDomRoot || document.body;
  }

  function getSelectorForElement(element) {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className}`;
    if (element.getAttributeNames()[0]) return `[${element.getAttributeNames()[0]}="${element.getAttribute(element.getAttributeNames()[0])}"]`;
    return element.tagName;
  }

  // Recursive function to morph individual nodes
  function morphNode(oldNode, newNode) {
    if (!newNode) {
      oldNode.remove();
      return;
    }

    if (newNode.nodeName === 'SCRIPT') {
      let replace = false;
      if (oldNode.textContent !== newNode.textContent) {
        replace = true;
      }
      if (oldNode.attributes.length !== newNode.attributes.length) {
        replace = true;
      }
      for (const attr of newNode.attributes) {
        if (oldNode.getAttribute(attr.name) !== attr.value) {
          replace = true;
        }
      }

      if (replace) {
        const script = document.createElement("script");
        script.textContent = newNode.textContent;
        for (const attr of newNode.attributes) {
          script.setAttribute(attr.name, attr.value);
        }
        /**@type {Node} */ const parent = oldNode.parentNode;
        parent.replaceChild(script, oldNode);
      }
      return;
    }

    if (oldNode.nodeType !== newNode.nodeType || oldNode.nodeName !== newNode.nodeName) {
      oldNode.replaceWith(newNode.cloneNode(true));
      return;
    }

    if (oldNode.nodeType === Node.TEXT_NODE) {
      if (oldNode.textContent !== newNode.textContent) {
        oldNode.textContent = newNode.textContent;
      }
      return;
    }

    if (oldNode.nodeType === Node.ELEMENT_NODE) {
      // Update attributes
      const oldAttributes = Array.from(oldNode.attributes);
      const newAttributes = Array.from(newNode.attributes);

      // Remove old attributes not present in new node
      for (const attr of oldAttributes) {
        if (!newNode.hasAttribute(attr.name)) {
          oldNode.removeAttribute(attr.name);
        }
      }

      // Add/update new attributes
      for (const attr of newAttributes) {
        if (oldNode.getAttribute(attr.name) !== attr.value) {
          oldNode.setAttribute(attr.name, attr.value);
        }
      }

      // Recursively morph children
      morphChildren(oldNode, newNode);
    }
  }

  // Function to morph children of a parent node (simplified)
  function morphChildren(oldParent, newParent) {
    const newChildren = Array.from(newParent.childNodes);
    const oldChildren = Array.from(oldParent.childNodes);

    // Determine the maximum length to iterate through
    const maxLength = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < maxLength; i++) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];

      if (oldChild && newChild) {
        // Both exist, morph them
        morphNode(oldChild, newChild);
      } else if (!oldChild && newChild) {
        // New child exists, but no corresponding old child, append it
        oldParent.appendChild(newChild.cloneNode(true));
      } else if (oldChild && !newChild) {
        // Old child exists, but no corresponding new child, remove it
        oldChild.remove();
      }
    }
  }

  // Start the morphing process
  if (shouldMorphNode) {
    morphNode(currentDomRoot, newContentRoot);
  } else {
    // If it's a fragment, we've set currentDomRoot to document.body and newContentRoot to a temp div.
    // We need to clear the currentDomRoot's children first, then append the newContentRoot's children.
    // This is a full replacement for fragments targeting the body.
    while (currentDomRoot.firstChild) {
      currentDomRoot.removeChild(currentDomRoot.firstChild);
    }
    Array.from(newContentRoot.childNodes).forEach(node => {
      currentDomRoot.appendChild(node.cloneNode(true));
    });
  }
}