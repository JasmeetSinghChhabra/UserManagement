import { Injectable } from '@angular/core';
import { ODataService, ODataServiceFactory } from "../odata/odata";
import { Observable } from 'rxjs/rx';
import { RequestOptionsArgs, RequestOptions, Headers } from '@angular/http';
import { Api } from '../common/api.service';
import { AppService } from '../common/app.service';
import { User, UserDevice, UserNotification } from '../../models/models';

@Injectable()
export class UserService {
    
    private odataUsers: ODataService<any>;
    
    constructor(public api: Api, private odataFactory: ODataServiceFactory, private app: AppService) {
        this.odataUsers = this.odataFactory.CreateService<User>("Users");
    }

    getUsersbyType(userTypeId: number): Observable<User[]> {
        this.odataUsers.config.additionalReqOptions = this.getDefaultRequestOptions();
        this.odataUsers.config.additionalReqOptions.search+='&userId=';
        return this.odataUsers
            .Query()
            .Filter(`UserTypeId eq ${userTypeId}`)
            .Exec();
    }

    getUsersbyTypeAndPermissions(userTypeId: number, moduleId: number): Observable<User[]> {
        this.odataUsers.config.additionalReqOptions = this.getDefaultRequestOptions();
        this.odataUsers.config.additionalReqOptions.search+='&userId=';
        return this.odataUsers
            .Query()
            .Expand("UserActivities")
            .Filter(`UserTypeId eq ${userTypeId} and UserActivities/any(UserActivity: UserActivity/ModuleId eq ${moduleId})`)
            .Exec();
    }

    RegisterUserDevice(userDevice: UserDevice): Promise<any> {
        let headers = {'Content-Type': 'application/json; charset=utf-8' };
        
        let requestOptions = {
            headers: headers,
            withCredentials: true
        };
        
        return this.api.post("UserNotification/RegisterUserDeviceForPushNotifications" , userDevice, requestOptions).toPromise();
    }

    SendChatInviteNotification(userNotification: UserNotification): Promise<any> {
        let headers = {'Content-Type': 'application/json; charset=utf-8' };
        
        let requestOptions = {
            headers: headers,
            withCredentials: true
        };
        
        return this.api.post("UserNotification/SendChatInviteNotification" , userNotification, requestOptions).toPromise();
    }

    getDefaultRequestOptions(): RequestOptionsArgs {
        let search = `projectId=${this.app.projectId}`;
        return {
            withCredentials: true,
            search: search
        };
    }

}