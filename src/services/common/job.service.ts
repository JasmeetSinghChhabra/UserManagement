import { Injectable } from '@angular/core';
import { ODataService, ODataServiceFactory } from "../odata/odata";
import { AppService } from '../common/app.service';

import { Observable } from 'rxjs/rx';
import { RequestOptionsArgs } from '@angular/http/src/interfaces';
import { Job } from '../../models/job/job.model';

@Injectable()
export class JobService {
    
    private odataUsers: ODataService<any>;
    
    constructor(private odataFactory: ODataServiceFactory, private app: AppService) {
        this.odataUsers = this.odataFactory.CreateService<Job>("Sites");
    }

    getJobs(moduleId: number): Observable<Job[]> {
        this.odataUsers.config.additionalReqOptions = this.getRequestOptions(moduleId);
        return this.odataUsers
            .Query()
            .Exec();
    }

    getRequestOptions(moduleId: number): RequestOptionsArgs {
        let search = `projectId=${this.app.projectId}&module=${moduleId}`;
        return {
            withCredentials: true,
            search: search
        };
    }

}