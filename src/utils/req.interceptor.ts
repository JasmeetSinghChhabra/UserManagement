//import { Injectable } from '@angular/core';
//import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';

//@Injectable()
//export class AuthInterceptor implements HttpInterceptor {
//  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//    // Clone the request to add the new header.
//    const authReq = req.clone({ headers: req.headers.set('Authorization', "x") });
//    // Pass on the cloned request instead of the original request.
//    return next.handle(authReq);
//  }
//}