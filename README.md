# 🚀 Instajax

Instajax is a lightweight JavaScript library that enhances web app navigation by seamlessly updating 
content via AJAX without reloading the page. It leverages modern browser features like `fetch`, 
`history.pushState`, and `MutationObserver` to provide a smooth user experience.

## 📋 Features
- ⚡ **Lightweight**: Extremely lightweight, perfect for performance-conscious applications.
- 🌍 **Seamless Navigation**: Updates content without reloading the page using AJAX.
- 🖥️ **Modern Browser Support**: Utilizes cutting-edge browser APIs (`fetch`, `history.pushState`, and 
`MutationObserver`).
- 🎨 **Customization Options**: Easily customize error templates with HTML strings or URLs to external 
files.
- 🛠️ **Easy Integration**: Seamlessly integrates into projects via CDN, npm, or yarn for easy adoption.

## 🛠️ Usage
### CDN Method
Put the script tag to head of your template HTML. It will initialize automatically.
```html
<script type="module" src="https://unpkg.com/instajax@1.7.1/dist/min.js"></script>
```

### Package Manager Method
You can install it via npm or yarn and import it in your project:
```bash
npm install instajax
```
Then in your main client-side JavaScript code, just import it:
```javascript
import 'instajax';
```

Within your HTML, Instajax will handle links automatically without reloading the page:
```html
<a href="/new-page">Go to new page via instajax</a>
<a href="/new-page" class="skip-instajax">Go to new page without instajax</a>
```

## 📜 Scroll Behavior
By default, Instajax scrolls to the top of the page after a navigation. To keep the current scroll
position, opt in explicitly with the `data-preserve-scroll` attribute:

```html
<a href="/new-page" data-preserve-scroll>Keep my scroll position</a>
```

For browser back/forward navigation, put the attribute on the page's `<body>` element:

```html
<body data-preserve-scroll>
```

## 🎨 Customization
To customize the error template, you can call the default function with a custom HTML string or URL 
pointing to an HTML file:
```javascript
import instajax from 'instajax';
instajax({ errorHTML: '<div class="error">%error%</div>' });
```
or
```javascript
instajax({ errorHTML: 'url("/error.html")' });
```

## 📡 API Functions
- **default({ errorHTML })**
  
  Customizes the default error template with a provided HTML string or URL pointing to an HTML file.