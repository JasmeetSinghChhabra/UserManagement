import { Injectable } from '@angular/core';
import { AppService } from '../common/app.service';
import { Api } from '../common/api.service';
import 'rxjs/add/operator/toPromise';


@Injectable()
export class ChatEngineService {

  constructor(private apiService: Api, private app: AppService) {
  }

  getOpenTokSession(roomId: string): Promise<any> {
    let options = {
      withCredentials: true
    };
    let params = {
      projectId: this.app.projectId,
      roomId: roomId 
    };
    return this.apiService.get("ChatEngine/GetSessionInfo", params, options).toPromise();
  }
}
