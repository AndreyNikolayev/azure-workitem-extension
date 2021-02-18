let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    onUrlChange(url);
  }
}).observe(document, {subtree: true, childList: true});

function onUrlChange(url) {
  const baseUrlRegex = /(.+:\/\/dev\.azure\.com\/[a-zA-Z-]+\/[a-zA-Z-]+\/).+$/gm
  const workItemPageRegex = /_workitems\/edit\/(\d+)\/?$/gm
  const workItemPopupRegex = /\?workitem=(\d+)$/gm

  const workItemId = getRegexMatchingGroup(workItemPageRegex, url) || getRegexMatchingGroup(workItemPopupRegex, url);

  if(!workItemId) {
    return;
  }

  const baseUrl = getRegexMatchingGroup(baseUrlRegex, url);

  renderInfo(baseUrl, +workItemId)
}

function getRegexMatchingGroup(regex, value) {
  const result = regex.exec(value);

  if(result && result.length > 1) {
    return result[1];
  }
  return null;
}

function renderInfo(baseUrl, workItemId) {
  chrome.runtime.sendMessage({baseUrl, workItemId}, function(response) {
    checkElement('.info-text-wrapper .caption')
      .then(element =>  {
        const existing = document.querySelectorAll('.workitem-status-extension-block');
        existing.forEach(p => element.parentNode.removeChild(p));

        response.forEach(p => {
          element.parentNode.appendChild(getBoxElement(p.environment, p.isDeployed));
        });
      });
  });
}

const checkElement = async selector => {
  while (document.querySelector(selector) === null) {
    await new Promise(resolve => requestAnimationFrame(resolve) )
  }
  return document.querySelector(selector); 
};

function getBoxElement(environmentName, isDeployed) {
  const outerDiv = document.createElement("div");
  let outerBoxStyles = 'display:flex;font-size:12px;border:1px solid;margin:0 2px 0 2px;'
  if(isDeployed) {
    outerBoxStyles += 'border-color:green;';
  }
  outerDiv.setAttribute('class', 'workitem-status-extension-block');
  outerDiv.setAttribute('style', outerBoxStyles);

  const textDiv = document.createElement("div");
  textDiv.textContent = environmentName;
  textDiv.setAttribute('style', 'display:flex;padding: 0 2px 0 2px;');
  outerDiv.appendChild(textDiv);

  const svgUrl = chrome.runtime.getURL(isDeployed ? 'success.svg': 'blank.svg');
  const svg = document.createElement("embed");
  svg.setAttribute('src', svgUrl);

  const svgDiv = document.createElement("div");
  svgDiv.setAttribute('style', 'display:flex;padding: 0 2px 0 2px;');
  svgDiv.appendChild(svg);
  outerDiv.appendChild(svgDiv);

  return outerDiv;
}
