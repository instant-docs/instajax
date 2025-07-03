export default function morphDOM(htmlString) {
  // Use DOMParser to parse the HTML string
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Determine the root elements for morphing
  let newContentRoot;
  let currentDomRoot;

  const hasHtmlTag = /<html[^>]*>/i.test(htmlString);
  const hasHeadTag = /<head[^>]*>/i.test(htmlString);
  const hasBodyTag = /<body[^>]*>/i.test(htmlString);

  let shouldMorphNode = false; // Flag to determine if morphNode or morphChildren should be called

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
    // It's a fragment that might be a single element or multiple elements/text nodes.
    // The DOMParser puts these inside doc.body.
    // We need to check if the fragment represents a single top-level element
    // We need to check if the fragment represents a single top-level element
    // that we can try to match by ID, attributes, or tag name in the current DOM.

    const newElement = doc.body.firstElementChild;
    const isSingleElementFragment = doc.body.children.length === 1 && doc.body.childNodes.length === 1;

    if (isSingleElementFragment && newElement.nodeType === Node.ELEMENT_NODE) {
      let existingElement = null;

      // 1. Try to find by ID
      if (newElement.id) {
        existingElement = document.getElementById(newElement.id);
      }

      // 2. If no ID match, try to find by attributes
      if (!existingElement) {
        // Query all elements with the same tag name in the document
        const potentialMatches = document.querySelectorAll(newElement.tagName);
        for (const el of potentialMatches) {
          if (areAttributesEqual(el, newElement)) {
            existingElement = el;
            break;
          }
        }
      }

      // 3. If no attribute match, try to find by the first element with the same tag name
      if (!existingElement) {
        existingElement = document.querySelector(newElement.tagName);
      }

      if (existingElement) {
        newContentRoot = newElement;
        currentDomRoot = existingElement;
        shouldMorphNode = true;
      } else {
        // Single element fragment, but no specific match found in current DOM.
        // Treat as a general fragment to be appended to body.
        const tempContainer = document.createElement('div');
        Array.from(doc.body.childNodes).forEach(node => tempContainer.appendChild(node.cloneNode(true)));
        newContentRoot = tempContainer;
        currentDomRoot = document.body;
        shouldMorphNode = false; // Will call morphChildren
      }
    } else {
      // It's a general fragment (multiple elements, text nodes, or single element without ID/not an element).
      // Morph children of document.body.
      const tempContainer = document.createElement('div');
      Array.from(doc.body.childNodes).forEach(node => tempContainer.appendChild(node.cloneNode(true)));
      newContentRoot = tempContainer;
      currentDomRoot = document.body;
      shouldMorphNode = false; // Will call morphChildren
    }
  }

  // Helper function to compare attributes of two elements
  function areAttributesEqual(el1, el2) {
    if (el1.attributes.length !== el2.attributes.length) {
      return false;
    }
    for (let i = 0; i < el1.attributes.length; i++) {
      const attr1 = el1.attributes[i];
      const attr2Value = el2.getAttribute(attr1.name);
      if (attr1.value !== attr2Value) {
        return false;
      }
    }
    return true;
  }

  // Recursive function to morph individual nodes
  function morphNode(oldNode, newNode) {
    // If new node is null, remove old node
    if (!newNode) {
      oldNode.remove();
      return;
    }

    if (newNode.nodeName === 'SCRIPT') {
      const script = document.createElement("script");
      script.textContent = newNode.textContent;
      for (const attr of newNode.attributes) {
        script.setAttribute(attr.name, attr.value);
      }
      /**@type {Node} */ const parent = oldNode.parentNode;
      parent.replaceChild(script, oldNode);
      return;
    }

    // If nodes are different types or names, replace old node with new node
    // This is a destructive change, but necessary if types/names don't match.
    if (oldNode.nodeType !== newNode.nodeType || oldNode.nodeName !== newNode.nodeName) {
      oldNode.replaceWith(newNode.cloneNode(true));
      return;
    }

    // If it's a text node, update content
    if (oldNode.nodeType === Node.TEXT_NODE) {
      if (oldNode.textContent !== newNode.textContent) {
        oldNode.textContent = newNode.textContent;
      }
      return;
    }

    // If it's an element node, update attributes and children
    if (oldNode.nodeType === Node.ELEMENT_NODE) {
      // Update attributes
      const oldAttributes = oldNode.attributes;
      const newAttributes = newNode.attributes;

      // Remove old attributes not present in new node
      for (let i = oldAttributes.length - 1; i >= 0; i--) {
        const attr = oldAttributes[i];
        if (!newNode.hasAttribute(attr.name)) {
          oldNode.removeAttribute(attr.name);
        }
      }

      // Add/update new attributes
      for (let i = 0; i < newAttributes.length; i++) {
        const attr = newAttributes[i];
        if (oldNode.getAttribute(attr.name) !== attr.value) {
          oldNode.setAttribute(attr.name, attr.value);
        }
      }

      // Recursively morph children
      morphChildren(oldNode, newNode);
    }
  }

  // Function to morph children of a parent node
  function morphChildren(oldParent, newParent) {
    const newChildren = Array.from(newParent.childNodes);
    const oldChildren = Array.from(oldParent.childNodes);

    const newChildrenMap = new Map();
    newChildren.forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE && child.id) {
        newChildrenMap.set(child.id, child);
      }
    });

    let oldChildIndex = 0;
    let newChildIndex = 0;

    while (oldChildIndex < oldChildren.length || newChildIndex < newChildren.length) {
      const oldChild = oldChildren[oldChildIndex];
      const newChild = newChildren[newChildIndex];

      if (!oldChild && newChild) {
        // No more old children, append remaining new children
        oldParent.appendChild(newChild.cloneNode(true));
        newChildIndex++;
        continue;
      }

      if (oldChild && !newChild) {
        // No more new children, remove remaining old children
        oldChild.remove();
        oldChildIndex++;
        continue;
      }

      if (!oldChild && !newChild) {
        // Both exhausted
        break;
      }

      let matchedNewChild = null;

      // 1. Try to find a match by ID
      if (oldChild.nodeType === Node.ELEMENT_NODE && oldChild.id && newChildrenMap.has(oldChild.id)) {
        matchedNewChild = newChildrenMap.get(oldChild.id);
      }

      // 2. If no ID match, try to find a match by type and name at the current newChildIndex
      if (!matchedNewChild && newChild.nodeType === oldChild.nodeType && newChild.nodeName === oldChild.nodeName) {
        matchedNewChild = newChild;
      }

      if (matchedNewChild) {
        if (matchedNewChild === newChild) {
          // Nodes match and are in the correct position, morph them
          morphNode(oldChild, newChild);
          oldChildIndex++;
          newChildIndex++;
        } else {
          // Matched newChild is out of order, insert it before current oldChild
          oldParent.insertBefore(newChild.cloneNode(true), oldChild);
          newChildIndex++;
        }
      } else {
        // No match for oldChild, remove it
        oldChild.remove();
        oldChildIndex++;
      }
    }
  }

  // Start the morphing process based on the determined roots and the 'shouldMorphNode' flag
  if (shouldMorphNode) {
    morphNode(currentDomRoot, newContentRoot);
  } else {
    morphChildren(currentDomRoot, newContentRoot);
  }
}