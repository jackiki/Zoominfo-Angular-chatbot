import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
const API_DOMAIN = "https://insentrecruit.api.insent.ai";

@Injectable({
    providedIn: 'root'
})

export class DataService {

    LOGIN_URL = '';
    GET_APP_DETAILS_URL = '';
    GET_CONVO_URL = '';
    GET_INIT_MESSAGE_URL = '';

    constructor(
        private http: HttpClient
    ) {
        this.LOGIN_URL = API_DOMAIN + "/app/login";
        this.GET_APP_DETAILS_URL = API_DOMAIN + "/app/details";
        this.GET_CONVO_URL = API_DOMAIN + "/getuser";
        this.GET_INIT_MESSAGE_URL = API_DOMAIN + "/user/channels/{channel_id}";
    }

    getHeaders(token?, userId?) {
        let authToken = (token && `Bearer ${token}`) || this.getAuthToken();
        let reqHeaders = {
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
        };

        if (authToken) {
            reqHeaders.headers["Authorization"] = authToken;
        }

        if (userId) {
            reqHeaders.headers["userid"] = userId;
        }
        return reqHeaders;
    }

    loginUser(data) {
        return this, this.http.post(
            this.LOGIN_URL,
            data,
            this.getHeaders()
        );
    }

    getAppDetails() {
        const url = `${this.GET_APP_DETAILS_URL}`
        return this.http.get(
            url,
            this.getHeaders()
        );
    }

    getConversationInfo(convoId, token) {
        const url = `${this.GET_CONVO_URL}?url=insentrecruit.insent.ai/conversations/${convoId}/simulator`
        return this.http.get(
            url,
            this.getHeaders(token)
        );
    }

    getInitMessageInfo(channelId, token, userId) {
        const url = this.GET_INIT_MESSAGE_URL.replace("{channel_id}", channelId)
        return this.http.get(
            url,
            this.getHeaders(token, userId)
        );
    }

    getAuthToken() {
        return `Bearer ${localStorage.getItem('insent-token')}`;
    }

}







