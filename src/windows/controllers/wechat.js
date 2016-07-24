/**
 * Created by Zhongyi on 5/2/16.
 *
 * Modified by zxqdx on July 2016.
 */
"use strict";

const path = require('path');
const {app, shell, BrowserWindow} = require('electron');
const Common = require('../../common');
let Secret;
try {
  Secret = require("../../secret");
} catch (e) {
  Secret = false;
}

const CSSInjector = require('../../inject/css');
const MessageHandler = require('../../handlers/message');
const UpdateHandler = require('../../handlers/update');
class WeChatWindow {
  constructor() {
    this.loginState = {NULL: -2, WAITING: -1, YES: 1, NO: 0};
    this.loginState.current = this.loginState.NULL;
    this.inervals = {};
    this.createWindow();
  }

  resizeWindow(isLogged, splashWindow) {
    const size = isLogged ? Common.WINDOW_SIZE : Common.WINDOW_SIZE_LOGIN;

    this.wechatWindow.setResizable(isLogged);
    this.wechatWindow.setSize(size.width, size.height);
    if (this.loginState.current == 1 - isLogged || this.loginState.current == this.loginState.WAITING) {
      splashWindow.hide();
      this.wechatWindow.show();
      this.wechatWindow.center();
      this.loginState.current = isLogged;
    }
  }

  createWindow() {
    this.wechatWindow = new BrowserWindow({
      title: Common.ELECTRONIC_WECHAT,
      resizable: true,
      center: true,
      show: false,
      frame: true,
      autoHideMenuBar: true,
      icon: path.join(__dirname, '../../../assets/icon.png'),
      titleBarStyle: 'hidden-inset',
      webPreferences: {
        javascript: true,
        plugins: true,
        nodeIntegration: false,
        webSecurity: false,
        preload: path.join(__dirname, '../../inject/preload.js')
      }
    });

    this.wechatWindow.webContents.setUserAgent(Common.USER_AGENT);
    if (Common.DEBUG_MODE) {
      this.wechatWindow.webContents.openDevTools();
    }

    this.connect();

    this.wechatWindow.webContents.on('will-navigate', (ev, url) => {
      if (/(.*wx.*\.qq\.com.*)|(web.*\.wechat\.com.*)/.test(url)) return;
      ev.preventDefault();
    });

    this.wechatWindow.on('close', (e) => {
      if (this.wechatWindow.isVisible()) {
        e.preventDefault();
        this.wechatWindow.hide();
      }
    });

    this.wechatWindow.on('page-title-updated', (ev) => {
      if (this.loginState.current == this.loginState.NULL) {
        this.loginState.current = this.loginState.WAITING;
      }
      ev.preventDefault();
    });

    this.wechatWindow.webContents.on('dom-ready', () => {
      this.wechatWindow.webContents.insertCSS(CSSInjector.commonCSS);
      if (process.platform == "darwin") {
        this.wechatWindow.webContents.insertCSS(CSSInjector.osxCSS);
      }

      new UpdateHandler().checkForUpdate(`v${app.getVersion()}`, true);
    });

    this.wechatWindow.webContents.on('did-finish-load', () => {
      if (Secret) {
        let script = Secret.highlightedUsers.map(user => `
          var tempDiv = $('.chat_item .nickname span:contains("${user.username}")').filter(function() {
            return $(this).text() == "${user.username}";
          });
          if (tempDiv.length > 0) {
            var tempUsername =
              JSON.parse(tempDiv.first().parent().parent().parent().attr("data-cm")).username;
            var tempItem = 'div.chat_item[data-cm*="' + tempUsername + '"]';
            var tempCSS = document.createElement("style");
            tempCSS.type = "text/css";
            tempCSS.innerHTML = tempItem + ' {' +
              'background-image: url("${user.staticImg}");' +
              'background-repeat: no-repeat;' +
              'text-shadow: 0px 0px 3px rgba(0, 0, 0, 1);' +
              'cursor: pointer!important;' +
              'transition: background 200ms;' +
            '}' +
            tempItem + ' .msg, ' + tempItem + ' .ext .attr {' +
              'color: white!important;' +
            '}' +
            tempItem + ' .nickname_text {' +
              'color: white!important;' +
              'font-weight: bold;' +
            '}' +
            tempItem + ':hover, ' + tempItem + '.active {' +
              'background-image: url("${user.animatedImg}");' +
            '}' +
            tempItem + ' .nickname_text {' +
              'font-size: 13px;' +
              'transition: font-size 800ms;' +
            '}' +
            tempItem + '.active .nickname_text {' +
              'font-size: 18px;' +
            '}' +
            tempItem + ' .info {' +
              'position: relative;' +
              'left: 0;' +
              'transition: left 800ms;' +
            '}' +
            tempItem + '.active .info {' +
              'left: -50px;' +
            '}' +
            tempItem + ' .avatar {' +
              'opacity: 1;' +
              'transition: opacity 500ms;' +
            '}' +
            tempItem + '.active .avatar {' +
              'opacity: 0;' +
            '}'
            ;
            document.body.appendChild(tempCSS);
          }
        `).join();
        this.wechatWindow.webContents.executeJavaScript(script);
      }
    });

    this.wechatWindow.webContents.on('new-window', (event, url) => {
      event.preventDefault();
      shell.openExternal(new MessageHandler().handleRedirectMessage(url));
    });
  }

  loadURL(url) {
    this.wechatWindow.loadURL(url);
  }

  show() {
    this.wechatWindow.show();
  }

  connect() {
    Object.keys(this.inervals).forEach((key, index) => {
      clearInterval(key);
      delete this.inervals[key];
    });

    this.loadURL(Common.WEB_WECHAT);
    let int = setInterval(()=> {
      if (this.loginState.current == this.loginState.NULL) {
        this.loadURL(Common.WEB_WECHAT);
        console.log("Reconnect.");
      }
    }, 5000);
    this.inervals[int] = true;
  }
}

module.exports = WeChatWindow;
