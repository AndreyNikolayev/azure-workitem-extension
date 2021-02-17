
const checkElement = async selector => {
  while (document.querySelector(selector) === null) {
    await new Promise(resolve => requestAnimationFrame(resolve) )
  }
  return document.querySelector(selector); 
};

const baseUrl = window.location.href
  .substring(0, window.location.href.lastIndexOf('_workitems'))

const workItemId = +window.location.href
  .substring(window.location.href.lastIndexOf('edit/') + 5)
  .replace(/\D/g,' ')
  .split(' ')
  .filter(p => p.length > 0)[0];

  chrome.runtime.sendMessage({baseUrl, workItemId}, function(response) {
    console.log(response);
    checkElement('.info-text-wrapper .caption')
      .then(element =>  {
        response.forEach(p => {
          element.parentNode.appendChild(getBoxElement(p.environment, p.isDeployed));
        });
      });
  });

  function getBoxElement(environmentName, isDeployed) {
    const outerDiv = document.createElement("div");
    let outerBoxStyles = 'display:flex;font-size:12px;border:1px solid;margin:0 2px 0 2px;'
    if(isDeployed) {
      outerBoxStyles += 'border-color:green;';
    }
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


