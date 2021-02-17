function save_options() {
  var value = document.getElementById('config').value;
  chrome.storage.sync.set({
    config: value
  }, function() {

    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function restore_options() {
  chrome.storage.sync.get({
    config: ''
  }, function(storage) {
    document.getElementById('config').value = storage.config;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);