/**
 * ContextMenu Class
 * Helpful in creating context menus and initializing depending on certain options
 * passed in to the function
 */

var contextMenus = chrome.contextMenus;
var windows = chrome.windows;
var runtime = chrome.runtime;
var tabs = chrome.tabs;
var i18n = chrome.i18n;
var runtime = chrome.runtime;

var ACTION_MENU_TOP_LEVEL_LIMIT = chrome.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT;

// Tracker for the Google analytics we are going to consume
var service = analytics.getService('humanassistai');
var tracker = service.getTracker('UA-105744265-1'); //get tracking id from facebook
 
var contextItems = [
  { id: 'page', contexts: ['page'], title: i18n.getMessage('contextMenuSharePage'), document: true },
  { id: 'media', contexts: ['image', 'audio', 'video'], title: i18n.getMessage('contextMenuShareMedia'), target: true},
  { id: 'link', contexts: ['link'], title: i18n.getMessage('contextMenuShareLink'), target: true},
  { id: 'selection', contexts: ['selection'], title: i18n.getMessage('contextMenuShareQuote'), doucment: true},
];

var url_matcher = ['https://*/*', 'http://*/*'];

function ContextMenu () {
  this.menuItems = 0;
 
  contextItems.forEach(function (item) {
    if (this.menuItems > ACTION_MENU_TOP_LEVEL_LIMIT) {
      console.warn('Further items will not be added ')
      return;
    }

    this.menuItems++;
    this.create(item);
  }.bind(this));

  contextMenus.onClicked.addListener(this.onClicked.bind(this));
}


ContextMenu.prototype.create = function (contextInfo) {
  var contextProps = {id: contextInfo.id, title: contextInfo.title, contexts: contextInfo.contexts}
  
  if (contextInfo.target) {
    contextProps['targetUrlPatterns'] = url_matcher;
  }

  if (contextInfo.document) {
    contextProps['documentUrlPatterns'] = url_matcher;
  }

  contextMenus.create(contextProps);
}

ContextMenu.prototype.parseContext = function (info) {
  var id = info.menuItemId;
  var link,quote;
  
  switch (id) {
    case 'page':
      link = info.pageUrl;
      quote = info.selectionText
      break;
    case 'media':
      link = info.srcUrl;
      break;
    case 'selection':
      link = info.pageUrl;
      quote = info.selectionText;
      break;
    case 'link':
      link = info.linkUrl;
      break;
    default:
      break;
  }

  return {link: link, quote: quote}
}

ContextMenu.prototype.onClicked = function (info, tab) {
  var parsedInfo =  this.parseContext(info);

  if (!parsedInfo.link) {
    console.error('a link is required to be passed for Workplace share dialog')
    return;
  }

  sendShareMessage(tab.id, parsedInfo.link, parsedInfo.quote);
  tracker.sendEvent('contextMenu', 'onClicked', info.menuItemId);
}

function BrowserAction () {
  chrome.browserAction.onClicked.addListener(this.onClicked.bind(this));
}

BrowserAction.prototype.onClicked = function (tab) {
  var tabUrl = tab.url;
  sendShareMessage(tab.id, tabUrl)
  tracker.sendEvent('browserAction', 'onClicked');
}

function sendShareMessage (tabId, url, quote) {
  tabs.sendMessage(tabId, { event: 'workplace.share', url: url, quote: quote });
}

runtime.onInstalled.addListener(function (details) {
  var cm = new ContextMenu();
  var browserAction = new BrowserAction();
  var manifest = runtime.getManifest();
  var installedAt = Date.now();
  // var uninstallURL = '' + manifest.version

  tracker.sendEvent('Installs', details.reason, details.previousVersion || undefined);
  // runtime.setUninstallURL(uninstallURL);
});
