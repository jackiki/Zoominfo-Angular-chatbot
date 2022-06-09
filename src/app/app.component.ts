import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { CONSTANTS } from './shared/helper/constants';
import { DataService } from './shared/services/data-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'angular-bot';
  isWidgetOpen = false;
  initConvoInfo: any;
  initMsgInfo: any;
  projectKey: any;
  chatMessages = [];
  pusherObj: any;
  values: { USER_CREDENTIALS: { EMAIL: string; PASSWORD: string; }; DEFAULT_CONVO_ID: string; FEEDBACK_EMOJIS: { imgFileName: string; altName: string; }[]; MSG_TYPES: { TEXT: string; FEEDBACK: string; PLAIN_INPUT: string; }; FEEDBACK_VALUES: { 1: string; 2: string; 3: string; 4: string; 5: string; }; };
  chatAreaRef: any;
  lastChatMsg: any;
  showInput = false;
  message = '';
  interval: any;
  fieldValue = '';

  constructor(
    private router: Router,
    private dataservice: DataService,
    private spinner: NgxSpinnerService,
  ) {

  }

  ngOnInit() {
    this.values = CONSTANTS;
    this.loginUser();
  }

  loginUser() {
    this.dataservice.loginUser({
      email: CONSTANTS.USER_CREDENTIALS.EMAIL, password: CONSTANTS.USER_CREDENTIALS.PASSWORD
    }).subscribe((res: any) => {
      if (res.token) {
        localStorage.setItem('insent-token', res.token);
        this.getInitConversationInfo();
      }
    });
  }

  toggleWidgetOpenState() {
    this.isWidgetOpen = !this.isWidgetOpen;
  }

  // Get initial convo details and app details to start with.
  async getInitConversationInfo() {
    this.spinner.show();
    this.dataservice.getAppDetails().subscribe((appDetails: any) => {
      if (!appDetails || !appDetails || !appDetails.project || !appDetails.project.projectKey) {
        return;
      }
      this.projectKey = appDetails.project.projectKey;
      this.dataservice.getConversationInfo(CONSTANTS.DEFAULT_CONVO_ID, appDetails.project.projectKey).subscribe((conversationInfoResponse: any) => {
        if (!conversationInfoResponse) {
          return;
        }
        const convoInfo = conversationInfoResponse;
        this.initConvoInfo = convoInfo;
        if (!this.initConvoInfo && !this.projectKey) {
          this.getInitConversationInfo();
          return;
        }
        this.dataservice.getInitMessageInfo(convoInfo.channelId, appDetails.project.projectKey, convoInfo.user.id).subscribe((msgInfoResponse: any) => {
          if (!msgInfoResponse) {
            return;
          }
          this.spinner.hide();
          this.initMsgInfo = msgInfoResponse;
          if (this.initConvoInfo && this.projectKey && this.initMsgInfo) {
            const pusher = this.initPusher();
            this.pusherObj = pusher;
            this.bindPusherEvents(pusher);
            return;
          }
        });
      });
    });
  }

  // Initialize Pusher with the pusher token & cluster
  initPusher() {
    const AUTH_ENDPOINT_BASE_URL = 'https://insentrecruit.api.insent.ai/'
    const PUSHER_TOKEN = '67bb469433cb732caa7a'
    const PUSHER_CLUSTER = 'mt1'
    const userId = this.initConvoInfo.user.id;

    // var Pusher = require("pusher");
    const Pusher = require('pusher-js');
    var pusher = new Pusher(PUSHER_TOKEN, {
      cluster: PUSHER_CLUSTER,
      authEndpoint: AUTH_ENDPOINT_BASE_URL + 'pusher/presence/auth/visitor?userid=' + userId,
      auth: {
        headers: {
          Authorization: 'Bearer ' + this.projectKey,
        },
      },
    });

    return pusher;
  }

  // Bind pusher client/server msg events & its callbacks
  bindPusherEvents(pusher) {
    const channelId = this.initConvoInfo.subscriptionChannel
    const channelName = this.initConvoInfo.channelId
    const userId = this.initConvoInfo.user.id

    const channel = pusher.subscribe(channelId);
    channel.bind("server-message", (data) => {
      console.log("[server-message] :: ", data);
      this.addMessages(data.messages, data.messageTimestamp, data.sender)  // Add to chat
    });

    channel.bind('client-widget-message', (data) => {
      console.log("[client-widget-message] :: ", data);
    });

    channel.bind('pusher:subscription_succeeded', (data) => {
      console.log("[pusher:subscription_succeeded] :: ", data);

      this.addMessages(this.initMsgInfo.messages, data.messageTimestamp, this.initMsgInfo.sender); // Add initial message to chat

      const clientData = {
        channelName: channelName,
        message: { lastMessageTimeStamp: this.initMsgInfo.messageTimestamp },
        senderId: userId
      }

      pusher.channel(channelId).trigger('client-widget-message', clientData); // Send data to server
    });

    channel.bind('pusher:subscription_error', function (status) {
      console.log("[pusher:subscription_error] :: ", status)
    });
  }

  // Send data to server (button click/text response/feedback response)
  sendServerMsg(fieldValue?) {
    this.fieldValue = fieldValue;
    const channelName = this.initConvoInfo?.channelId
    const userId = this.initConvoInfo?.user.id
    const channelId = this.initConvoInfo?.subscriptionChannel
    const lastMsg = this.chatMessages[this.chatMessages.length - 1];

    let clientData = {
      channelName: channelName,
      message: {
        lastMessageTimeStamp: lastMsg && lastMsg.messageTimestamp
      },
      senderId: userId
    }

    if (fieldValue && lastMsg && lastMsg.buttons) { // Button reply
      clientData.message[lastMsg['buttons']['key']] = [fieldValue];
      this.replaceLastMsg({
        type: CONSTANTS.MSG_TYPES.TEXT,
        text: fieldValue,
        sentByMe: true
      })
    } else if (fieldValue && lastMsg && lastMsg.type == CONSTANTS.MSG_TYPES.PLAIN_INPUT) {   // Plain text input reply
      clientData.message[lastMsg.plainInput.key] = fieldValue
      this.addLastMsg({
        type: CONSTANTS.MSG_TYPES.TEXT,
        text: fieldValue,
        sentByMe: true
      })
    } else if (fieldValue && lastMsg && lastMsg.type == CONSTANTS.MSG_TYPES.FEEDBACK) { // Feedback reply
      clientData.message[lastMsg.feedback.key] = {
        submitted: true,
        value: fieldValue
      }
      this.replaceLastMsg({
        type: CONSTANTS.MSG_TYPES.TEXT,
        text: `
          <img src="/assets/images/${CONSTANTS.FEEDBACK_EMOJIS[fieldValue - 1].imgFileName}"/> 
          ${CONSTANTS.FEEDBACK_VALUES[fieldValue]}
        `,
        isFeedbackResponse: true,
        sentByMe: true
      })
    }

    if (this.pusherObj) {
      this.pusherObj.channel(channelId).trigger('client-widget-message', clientData);
    }
    setTimeout(() => {
      if (this.fieldValue != '') {
        this.sendServerMsg(this.fieldValue);
        this.fieldValue = '';
      }
    }, 2000);
  }

  // Replace the last message with new msg
  replaceLastMsg(msg) {
    const msgs = [...this.chatMessages];
    msgs.pop();
    this.chatMessages = [...msgs, msg];
    this.lastChatMsg = (this.chatMessages && this.chatMessages.length && this.chatMessages[this.chatMessages.length - 1]) || null;

    if (this.lastChatMsg.text == CONSTANTS.MSG.NO) {
      this.showInput = true;
      this.chatMessages[this.chatMessages.length - 1].type = CONSTANTS.MSG_TYPES.PLAIN_INPUT
    }
  }

  // Add a new msg
  addLastMsg(msg) {
    this.chatMessages = [...this.chatMessages, msg];
    this.lastChatMsg = (this.chatMessages && this.chatMessages.length && this.chatMessages[this.chatMessages.length - 1]) || null;
  }

  // Add message & auto scroll the widget chat area
  addMessages(msgs, messageTimestamp, sender) {
    for (let i = 0; i < msgs.length; i++) {
      msgs[i]['messageTimestamp'] = messageTimestamp
      msgs[i]['sender'] = sender
    }

    this.chatMessages = [...this.chatMessages, ...msgs];
    this.lastChatMsg = (this.chatMessages && this.chatMessages.length && this.chatMessages[this.chatMessages.length - 1]) || null;

    setTimeout(() => {
      if (this.chatAreaRef && this.chatAreaRef.current) {
        this.chatAreaRef.current.scrollTop = this.chatAreaRef.current.scrollHeight;
      }
    }, 10);
  }

  // Input text area change handler
  handleChatAreaChange(e) {
    this.interval = setInterval(() => {
      this.sendServerMsg(e.target.value);
      this.clear();
    }, 500);
  }

  clear() {
    let data = this.chatMessages.filter(res => res.text == this.message);
    if (data.length > 0) {
      this.message = '';
      this.showInput = false;
      clearInterval(this.interval);
    }
  }

  // Enter key check for text input
  submitTextarea(e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      this.handleChatAreaChange(e);
    }
  }

  getImages(imgFileName) {
    return '/assets/images/' + imgFileName;
  }

}