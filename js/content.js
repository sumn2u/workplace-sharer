var runtime = chrome.runtime;
var BASE_URL = 'https://work.facebook.com/sharer.php?display=popup';
var DEFAULT_WINDOW_OPTIONS='resizable,location=yes,resizable=yes'

runtime.onMessage.addListener(function (message) {
  if (message.event === 'workplace.share' && message.url) {
    createSharePopup(message.url, message.quote);
  }
});

function createSharePopup (link, quote) {
  var url = BASE_URL + '&u=' + link + (quote ? '&quote=' + quote : '');
  var sharePopup = window.open(url, 'WorkplaceSharePopup' + url, DEFAULT_WINDOW_OPTIONS);
}

