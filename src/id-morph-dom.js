export default function morphDOM(htmlString) {
  // 1. Remove <!DOCTYPE html> case-insensitively
  let cleanedHtmlString = htmlString.replace(/<!DOCTYPE html>/gi, '').trim();

  // 2. Use DOMParser to parse the HTML string
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanedHtmlString, 'text/html');

  // Determine the root elements for morphing
  let newContentRoot;
  let currentDomRoot;

  const hasHtmlTag = /<html[^>]*>/i.test(cleanedHtmlString);
  const hasHeadTag = /<head[^>]*>/i.test(cleanedHtmlString);
  const hasBodyTag = /<body[^>]*>/i.test(cleanedHtmlString);

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
    // that we can try to match by ID in the current DOM.

    // Check if doc.body contains exactly one element child and no other nodes (like text nodes)
    const isSingleElementFragment = doc.body.children.length === 1 && doc.body.childNodes.length === 1;

    if (isSingleElementFragment && doc.body.firstElementChild.id) {
      // If it's a single element fragment with an ID, try to find it in the current DOM
      const newElementId = doc.body.firstElementChild.id;
      const existingElement = document.getElementById(newElementId);

      if (existingElement) {
        // Found a matching element by ID in the current DOM, morph that specific element
        newContentRoot = doc.body.firstElementChild;
        currentDomRoot = existingElement;
        shouldMorphNode = true;
      } else {
        // Single element fragment with ID, but no matching ID in current DOM.
        // Treat as a general fragment to be appended to body.
        const tempContainer = document.createElement('div');
        Array.from(doc.body.childNodes).forEach(node => tempContainer.appendChild(node.cloneNode(true)));
        newContentRoot = tempContainer;
        currentDomRoot = document.body;
        shouldMorphNode = false; // Will call morphChildren
      }
    } else {
      // It's a general fragment (multiple elements, text nodes, or single element without ID).
      // Morph children of document.body.
      const tempContainer = document.createElement('div');
      Array.from(doc.body.childNodes).forEach(node => tempContainer.appendChild(node.cloneNode(true)));
      newContentRoot = tempContainer;
      currentDomRoot = document.body;
      shouldMorphNode = false; // Will call morphChildren
    }
  }

  // Recursive function to morph individual nodes
  function morphNode(oldNode, newNode) {
    // If new node is null, remove old node
    if (!newNode) {
      oldNode.remove();
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
    const oldChildren = Array.from(oldParent.childNodes);
    const newChildren = Array.from(newParent.childNodes);

    // Create a map of old children for efficient lookup, prioritizing IDs
    const oldChildrenMap = new Map();
    oldChildren.forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE && child.id) {
        oldChildrenMap.set(child.id, child);
      }
    });

    let currentOldChild = oldParent.firstChild; // Pointer to the current old child being considered
    let newIdx = 0;

    while (newIdx < newChildren.length) {
      const newChild = newChildren[newIdx];
      let matchedOldChild = null;

      // 1. Try to find a match by ID first (if both are elements and have IDs)
      if (newChild.nodeType === Node.ELEMENT_NODE && newChild.id) {
        if (oldChildrenMap.has(newChild.id)) {
          matchedOldChild = oldChildrenMap.get(newChild.id);
          // Remove from map to prevent duplicate matches
          oldChildrenMap.delete(newChild.id);
        }
      }

      // 2. If no ID match, try to find a match by type and name in the remaining old children
      // This is a simple linear scan. For better performance with large lists, more advanced algorithms exist.
      if (!matchedOldChild) {
        let tempOldChild = currentOldChild;
        while (tempOldChild) {
          if (tempOldChild.nodeType === newChild.nodeType && tempOldChild.nodeName === newChild.nodeName) {
            matchedOldChild = tempOldChild;
            break;
          }
          tempOldChild = tempOldChild.nextSibling;
        }
      }

      if (matchedOldChild) {
        // Found a match, morph it
        morphNode(matchedOldChild, newChild);

        // Ensure the matched old child is in the correct position
        // If the matched old child is not at the current `currentOldChild` position,
        // it means it needs to be reordered.
        if (matchedOldChild !== currentOldChild) {
          oldParent.insertBefore(matchedOldChild, currentOldChild);
        }
        // Advance the `currentOldChild` pointer to the next sibling after the one we just processed
        currentOldChild = matchedOldChild.nextSibling;
      } else {
        // No match found, insert the new child at the current position
        oldParent.insertBefore(newChild.cloneNode(true), currentOldChild);
      }
      newIdx++;
    }

    // Remove any remaining old children that were not matched or reused
    while (currentOldChild) {
      const nextSibling = currentOldChild.nextSibling; // Store next sibling before removing
      currentOldChild.remove();
      currentOldChild = nextSibling;
    }
  }

  // Start the morphing process based on the determined roots and the 'shouldMorphNode' flag
  if (shouldMorphNode) {
    morphNode(currentDomRoot, newContentRoot);
  } else {
    morphChildren(currentDomRoot, newContentRoot);
  }
}