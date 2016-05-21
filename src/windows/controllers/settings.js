/**
 * Created by lifengshuang on 5/19/16.
 */
'use strict';

const path = require('path');
const {app, shell, BrowserWindow} = require('electron');
const Common = require('../../common');

const CSSInjector = require('../../inject/css');
const MessageHandler = require('../../handlers/message');
const UpdateHandler = require('../../handlers/update');

class SettingsWindow {
  constructor() {
    this.settingsWindow = new BrowserWindow({
      width: Common.SETTINGS_WINDOW_SIZE.width,
      height: Common.SETTINGS_WINDOW_SIZE.height,
      title: Common.ELECTRONIC_WECHAT,
      resizable: false,
      center: true,
      show: false,
      frame: true,
      autoHideMenuBar: true,
      minimizable: false,
      maximizable: false,
      icon: 'assets/icon.png',
      titleBarStyle: 'hidden-inset'
    });
    
    this.settingsWindow.loadURL('file://' + path.join(__dirname, '/../views/settings.html'));

    this.settingsWindow.on('close', (e) => {
      if (this.settingsWindow.isVisible()) {
        e.preventDefault();
        this.settingsWindow.hide();
      }
    });

    if (Common.DEBUG_MODE) {
      this.settingsWindow.webContents.openDevTools();
    }
  }

  show() {
    this.settingsWindow.show();
    this.isShown = true;
  }

  hide() {
    this.settingsWindow.hide();
    this.isShown = false;
  }
  
  reload(){
    this.settingsWindow.loadURL('file://' + path.join(__dirname, '/../views/settings.html'));

  }
  
}

module.exports = SettingsWindow;