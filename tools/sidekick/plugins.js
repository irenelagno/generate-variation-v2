const AEM_GENERATE_VARIATIONS_PLUGIN_EVENT_NAME = 'aem-generate-variations-plugin';
const AEM_GENERATE_VARIATIONS_PLUGIN_ID = 'aem-generate-variations';

const createElementFromHTML = (htmlString) => {
    const div = document.createElement('div');
    div.innerHTML = `<div>${htmlString.trim()}</div>`;

    // Change this to div.childNodes to support multiple top-level nodes.
    return div.firstChild;
};

const applyVariation = (variation) => {
    console.log('applyVariation: variation', variation);
    const htmlObject = document.createElement('div');
    htmlObject.innerHTML = variation;

    if (window.getSelection) {
        const selected = window.getSelection();
        console.log('applyVariation: selected', selected);
        if (selected.rangeCount) {
            const range = selected.getRangeAt(0);
            range.deleteContents();
            range.insertNode(createElementFromHTML(variation));
        }
    } else if (document.selection && document.selection.createRange) {
        const range = document.selection.createRange();
        range.text = variation;
    }
};

const handleMessageFromAemGenerateVariationsPlugin = (event, pluginBaseUrl) => {
    if (event.origin === pluginBaseUrl) {
        console.debug('handleMessageFromAemGenerateVariationsPlugin', event);
        applyVariation(event.data.variation);
    }
};

const findAemGenerateVariationsPluginIframe = (aemGenerateVariationsPluginBaseUrl) => {
    const iframe = document.querySelector('helix-sidekick')?.shadowRoot?.querySelector(`iframe[src^="${aemGenerateVariationsPluginBaseUrl}"]`);
    return iframe || null;
};

const postMessageToAemGenerateVariationsPlugin = (event, aemGenerateVariationsPluginBaseUrl) => {
    console.debug('postMessageToAemGenerateVariationsPlugin', event);
    const container = document.createElement('div');
    container.appendChild(window.getSelection().getRangeAt(0).cloneContents());
    const selectedHtml = container.innerHTML;
    if (selectedHtml === '') {
        return;
    }
    const iframe = findAemGenerateVariationsPluginIframe(aemGenerateVariationsPluginBaseUrl);
    if (iframe === null) {
        return;
    }
    console.debug('postMessageToAemGenerateVariationsPlugin', iframe);
    iframe.contentWindow.postMessage(
        selectedHtml,
        aemGenerateVariationsPluginBaseUrl,
    );
};

const handlePluginButtonClick = (event) => {
    console.debug('handlePluginButtonClick', event);

    const findAemGenerateVariationsPluginBaseUrl = (plugins) => {
        for (let i = 0; i < plugins.length; i += 1) {
            if (plugins[i].id === AEM_GENERATE_VARIATIONS_PLUGIN_ID) {
                const url = new URL(plugins[i].url);
                return url.origin;
            }
        }
        return null;
    };

    // https://github.com/adobe/helix-sidekick-extension/blob/main/docs/API.md#SidekickConfig
    const { plugins } = event.detail.data.config;
    const aemGenerateVariationsPluginBaseUrl = findAemGenerateVariationsPluginBaseUrl(plugins);
    if (aemGenerateVariationsPluginBaseUrl) {
        window.addEventListener('message', (messageEvent) => handleMessageFromAemGenerateVariationsPlugin(messageEvent, aemGenerateVariationsPluginBaseUrl));
        window.addEventListener('mouseup', (mouseupEvent) => postMessageToAemGenerateVariationsPlugin(mouseupEvent, aemGenerateVariationsPluginBaseUrl));
    }
};

const sk = document.querySelector('helix-sidekick');
if (sk) {
    // sidekick already loaded
    sk.addEventListener(`custom:${AEM_GENERATE_VARIATIONS_PLUGIN_EVENT_NAME}`, handlePluginButtonClick);
} else {
    // wait for sidekick to be loaded
    document.addEventListener('sidekick-ready', () => {
        document.querySelector('helix-sidekick')
            .addEventListener(`custom:${AEM_GENERATE_VARIATIONS_PLUGIN_EVENT_NAME}`, handlePluginButtonClick);
    }, { once: true });
}