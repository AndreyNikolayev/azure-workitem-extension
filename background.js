chrome.runtime.onMessage.addListener(
  function(request, _, sendResponse) {
    getWorkItemInfo(request).then(sendResponse);
    return true;
  }
);

async function getWorkItemInfo(request) {
  const workItem = await getWorkItem(request);
  const type = workItem.fields['System.WorkItemType'];

  if(type !== 'Bug' && type !== 'User Story') {
    return [];
  }

  const lastDeployments = await getAllLastDeployed(request);

  return lastDeployments.map(deployment => {
    const buildUri = deployment.info.release.artifacts
      .find(p => p.isPrimary)
      .definitionReference
      .buildUri
      .id;

    const isWorkItemDeployed = workItem.relations
      .some(p => p.rel === 'ArtifactLink' && p.url === buildUri);

    return {
      environment: deployment.environment,
      isDeployed: isWorkItemDeployed
    };
  });
}

async function getAllLastDeployed(request) {
  const settings = await getSettings();
  if(!settings) {
    return [];
  }

  const settingProject = settings.projects.find(p => p.name === request.baseUrl);

  if(!settingProject) {
    return [];
  }
  
  const asyncRes = await Promise.all(Object.keys(settingProject.trackingPipelines).map(async (key) => {
    var keyResult = await getLastDeployed(request.baseUrl, settingProject.trackingPipelines[key]);
    return {
      environment: key,
      info: keyResult.value[0]
    };
  }));

  return asyncRes;
}

async function getLastDeployed(baseUrl, definitionEnvironmentId) {
  const url = `${baseUrl.replace('dev.azure.com', 'vsrm.dev.azure.com')}_apis/release/deployments?$top=1&deploymentStatus=succeeded&definitionEnvironmentId=${definitionEnvironmentId}`;
  return await makeRequest(url);
}

async function getWorkItem(request) {
  const url = `${request.baseUrl}_apis/wit/workitems/${request.workItemId}?$expand=relations`
  return await makeRequest(url);
}

function makeRequest(url) {
  return new Promise(function (resolve, reject) {
    fetch(url)
    .then(
      function(response) {
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' +
            response.status);
          return;
        }  
        response.json().then(function(data) {
          resolve(data);
        });
      }
    )
    .catch(function(err) {
      console.log('Fetch Error :-S', err);
      reject(err);
    });
  });
}

function getSettings() {
  return new Promise(function (resolve, _) {
    chrome.storage.sync.get(null, storage => {
      if(!storage || !storage.config) {
        return null;
      }
      return resolve(JSON.parse(storage.config));
    });
  });
}