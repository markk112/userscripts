(() => {
    'use strict';

    function injectToolkitArea() {
        const toolkitNode = document.createElement('div');
        toolkitNode.classList.add('fifh-base');
        toolkitNode.innerHTML = `
            <p style="text-align: center; font-size: 28px;">In Progress</p>
        `.trim();
        document.body.insertAdjacentElement('beforebegin', toolkitNode);
    }

    function injectToolkitToggle() {
        const buttonWrapper = document.createElement('div');
        buttonWrapper.classList.add('fifh-toggle-wrapper');
        buttonWrapper.innerHTML = `
            <button><i class="fas fa-user-shield"></i></button>
        `.trim();
        buttonWrapper.addEventListener('click', event => {
            const base = document.querySelector('.fifh-base');
            if (base.classList.contains('active')) {
                base.classList.remove('active');
            } else {
                base.classList.add('active');
            }
        });
        document.body.appendChild(buttonWrapper);
    }

    function injectStyles() {
        const faLinkNode = document.createElement('link');
        faLinkNode.setAttribute('rel', 'stylesheet');
        faLinkNode.setAttribute('href', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
        const styleNode = document.createElement('style');
        styleNode.setAttribute('type', 'text/css');
        styleNode.innerHTML = `
            .fifh-base.active {
                height: 100px;
            }
            .fifh-base {
                transition: 0.5s;
                background-color: #FFF;
                height: 0;
                width: 100%;
                border-bottom: 1px solid #E0E0E0;
            }
            .fifh-toggle-wrapper {
                position: fixed;
                top: 200px;
                z-index: 1000;
            }
            .fifh-toggle-wrapper button {
                height: 60px;
                width: 60px;
                cursor: pointer;
                line-height: 1;
                text-decoration: none;
                background-color: #FFFFFF;
                border-top: 1px solid #E0E0E0;
                border-bottom: 1px solid #E0E0E0;
                border-right: 1px solid #E0E0E0;
                border-left: none;
                border-radius: 0 6px 6px 0;
            }
            .fifh-toggle-wrapper button i {
                color: #030303;
                font-size: 30px;
            }
            .fifh-toggle-wrapper button:focus {
                outline: none;
            }
        `.trim();
        document.head.appendChild(faLinkNode);
        document.head.appendChild(styleNode);
    }

    function init() {
        injectStyles();
        injectToolkitToggle();
        injectToolkitArea();
    }

    init();

})();