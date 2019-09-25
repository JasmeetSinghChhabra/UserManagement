/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 
 http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import "CDVVoipPush.h"
#import <PushKit/PushKit.h>
#import "VideoChatController.h"

@implementation CDVVoipPush

@synthesize callbackId;
CDVPluginResult* pluginResult;
//VideoChatController* videoChat;
- (void)pluginInitialize
{
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(finishLaunching:) name:UIApplicationDidFinishLaunchingNotification object:nil];
    NSLog(@"VoipPush plugin initialize");
    
    
}

- (void)finishLaunching:(NSNotification *)notification
{
    [self.commandDelegate runInBackground:^ {
        
        // Put here the code that should be on the AppDelegate.m
        dispatch_queue_t mainQueue = dispatch_get_main_queue();
        // Create a push registry object
        PKPushRegistry * voipRegistry = [[PKPushRegistry alloc] initWithQueue: mainQueue];
        // Set the registry's delegate to self
        voipRegistry.delegate = self;
        // Set the push type to VoIP
        voipRegistry.desiredPushTypes = [NSSet setWithObject:PKPushTypeVoIP];
        
    }];
    //this is just to make sure i instantiate the object?? how about if we just instantiate the object in other place??
    
    NSLog(@"VoipPush Finish Launching");
}

- (void)voipRegistration:(CDVInvokedUrlCommand*)command {
    callbackId = command.callbackId;
    [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
}

// Handle updated push credentials
- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials: (PKPushCredentials *)credentials forType:(NSString *)type {
    NSLog(@"VoipPush Plugin token received: %@", credentials.token);
    
    NSString *token = [[[[credentials.token description] stringByReplacingOccurrencesOfString:@"<"withString:@""]
                        stringByReplacingOccurrencesOfString:@">" withString:@""]
                       stringByReplacingOccurrencesOfString: @" " withString: @""];
    
    NSMutableDictionary* pushMessage = [NSMutableDictionary dictionaryWithCapacity:2];
    [pushMessage setObject:token forKey:@"token"];
    [pushMessage setObject:credentials.type forKey:@"type"];
    
    pluginResult= [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:pushMessage];
    [pluginResult setKeepCallbackAsBool:YES];
    
}

- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(NSString *)type {
    // Process the received push
    NSLog(@"VoipPush Plugin incoming payload: %@", payload.dictionaryPayload);
    NSLog(@"Running callkit now ");
    NSLog(@"This is the callback id %@", callbackId);
    //if this is coming from the background handle the call ourselves
    if ([[UIApplication sharedApplication] applicationState] == UIApplicationStateBackground){
        /*if(videoChat == nil ){
            videoChat = [[VideoChatController alloc] init];
            [videoChat initialize];
        }*/
        NSLog(@"VoipPush this is a background operation");
        
        //only show the incoming call ui if we are not in another call
        if([VideoChatController sharedInstance].inACall != YES ){
            NSLog(@"VoipPush starting the video call from background");
            [VideoChatController sharedInstance].inACall = YES;
            [[VideoChatController sharedInstance] setVideoBool:YES];
            [[VideoChatController sharedInstance] setRingTimeout:@"30"];
            [VideoChatController sharedInstance].calN = payload.dictionaryPayload[@"aps"][@"alert"][@"body"];
            [[VideoChatController sharedInstance] setIncomingPayload:payload.dictionaryPayload];
            [VideoChatController sharedInstance].fromBackground = YES;
            NSUUID* calluid= [NSUUID new];
            [[VideoChatController sharedInstance] receiveCall:calluid  callFromName:[VideoChatController sharedInstance].calN callIdFrom:nil];
        }else{
            NSLog(@"VoipPush already in a call");
        }
        
    }else if ([payload.type isEqualToString:@"PKPushTypeVoIP"]) {
        NSMutableDictionary* pushMessage = [NSMutableDictionary dictionaryWithCapacity:2];
        [pushMessage setObject:payload.dictionaryPayload forKey:@"payload"];
        [pushMessage setObject:payload.type forKey:@"type"];
        
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:pushMessage];
        [pluginResult setKeepCallbackAsBool:YES];
        if(self.commandDelegate != nil) [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
    } else {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Invalid push type received"];
        if(self.commandDelegate != nil) [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
    }
}

@end



