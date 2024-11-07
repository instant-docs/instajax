export default `
<body>
    <style>
    .error-icon {
        width: 64px;
        height: 64px;
        background-color: #ff4d4d;
        border-radius: 50%;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 1rem;
    }
    .error-icon::after {
        content: "!";
        font-size: 48px;
        font-weight: bold;
        color: white;
    } 
    .error-description {
        font-size: 16px;
    }
    .instajax-reload{
        cursor: pointer;
        padding: 0.5rem 1rem;
        background: none;
        outline-color: currentColor;
        border-radius: 4px;
        color: inherit;
    }
    </style>
    <center>
        <div class="error-icon"></div>
        <p class="error-description">%error%</p>
        <button class="instajax-reload" onClick="window.location.reload()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M13.5 2c-5.621 0-10.211 4.443-10.475 10h-3.025l5 6.625 5-6.625h-2.975c.257-3.351 3.06-6 6.475-6 3.584 0 6.5 2.916 6.5 6.5s-2.916 6.5-6.5 6.5c-1.863 0-3.542-.793-4.728-2.053l-2.427 3.216c1.877 1.754 4.389 2.837 7.155 2.837 5.79 0 10.5-4.71 10.5-10.5s-4.71-10.5-10.5-10.5z"/>
            </svg>
        </button>
    </center>
</body>
`.trim();
