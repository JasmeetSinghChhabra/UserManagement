//
//Created By Angel Robles
//
#import <Cordova/CDV.h>
#import "AccuvCallPushMonitor.h"
#import "VideoChatController.h"

@implementation AccuvCallPushMonitor
- (void)pluginInitialize
{
        //initialize callback dictionary
    callbackIds1 = [[NSMutableDictionary alloc]initWithCapacity:5];
    [callbackIds1 setObject:[NSMutableArray array] forKey:@"answer"];
    [callbackIds1 setObject:[NSMutableArray array] forKey:@"reject"];
    [callbackIds1 setObject:[NSMutableArray array] forKey:@"hangup"];
    [callbackIds1 setObject:[NSMutableArray array] forKey:@"sendCall"];
    [callbackIds1 setObject:[NSMutableArray array] forKey:@"receiveCall"];
    [callbackIds1 setObject:[NSMutableArray array] forKey:@"mute"];
    [callbackIds1 setObject:[NSMutableArray array] forKey:@"unmute"];
    [callbackIds1 setObject:[NSMutableArray array] forKey:@"speakerOn"];
    [callbackIds1 setObject:[NSMutableArray array] forKey:@"speakerOff"];
    [callbackIds1 setObject:[NSMutableArray array] forKey:@"DTMF"];
    [callbackIds1 setObject:[NSMutableArray array] forKey:@"initVideoCall"];
    //NSString* ringinTimeout = [self.commandDelegate.settings objectForKey:[@"accuv-call-push-ringing-timeout" lowercaseString]];
   // NSLog(@"Total time to ring is %@", ringinTimeout);
   
   
}

- (void)setAppName:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult* pluginResult = nil;
    NSString* proposedAppName = [command.arguments objectAtIndex:0];
    BOOL result = [[VideoChatController sharedInstance] setAppName:proposedAppName];

    
        if(result){
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"App Name Changed Successfully"];
        } else{
             pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"App Name Can't Be Empty"];
        }
   
   [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)setIcon:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    NSString* proposedIconName = [command.arguments objectAtIndex:0];
    BOOL result = [[VideoChatController sharedInstance] setIcon:proposedIconName];
    if(result)
    {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Icon Changed Successfully"];
    }else{
         pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"This icon does not exist. Make sure to add it to your project the right way."];
    }
  
    if(self.commandDelegate != nil) [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)setRingtone:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult* pluginResult = nil;
    NSString* proposedRingtoneName = [command.arguments objectAtIndex:0];
    BOOL result = [[VideoChatController sharedInstance] setRingtone:proposedRingtoneName];

    if(result){
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Ringtone Changed Successfully"];
    }else{
         pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Cannot change to this ringtone."];
    }
    
    if(self.commandDelegate != nil) [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)setIncludeInRecents:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    [[VideoChatController sharedInstance] setIncludeInRecents:[[command.arguments objectAtIndex:0] boolValue]];
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"includeInRecents Changed Successfully"];
     [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)setDTMFState:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    [[VideoChatController sharedInstance] setDTMFState:[[command.arguments objectAtIndex:0] boolValue]];
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"enableDTMF Changed Successfully"];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)setVideo:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    BOOL videoIs = [[command.arguments objectAtIndex:0] boolValue];
    [[VideoChatController sharedInstance] setVideoBool:videoIs];
   pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"hasVideo Changed Successfully"];
     [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)receiveCall:(CDVInvokedUrlCommand*)command
{
    NSString* callName = [command.arguments objectAtIndex:0];
   
    if([VideoChatController sharedInstance].inACall != YES){
        [VideoChatController sharedInstance].inACall = YES;
        [VideoChatController sharedInstance].fromBackground = NO;
        [VideoChatController sharedInstance].monitor = self;
        [[VideoChatController sharedInstance] setVideoBool:YES];
         [[VideoChatController sharedInstance] setRingTimeout:@"30"];
        [VideoChatController sharedInstance].calN = callName;
        [VideoChatController sharedInstance].incomingPayload = [command.arguments objectAtIndex:1];
        
        [self performSelector:@selector(performCall) withObject:nil afterDelay:2.f];
        [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Incoming call successful"] callbackId:command.callbackId];
    }else{
        [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Already in a call"] callbackId:command.callbackId];
    }
    
}

- (void)sendCall:(CDVInvokedUrlCommand*)command
{
    BOOL hasId = ![[command.arguments objectAtIndex:1] isEqual:[NSNull null]];
    NSString* callName = [command.arguments objectAtIndex:0];
    NSString* callId = hasId?[command.arguments objectAtIndex:1]:callName;
    [[VideoChatController sharedInstance] sendCall:callName :callId];
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Outgoing call successful"] callbackId:command.callbackId];
}

- (void)connectCall:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    [[VideoChatController sharedInstance] connectCall];
     pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Call connected successfully"];
 
   [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)endCall:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    [[VideoChatController sharedInstance] endCall];

     pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Call ended successfully"];
 
     [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)on:(CDVInvokedUrlCommand*)command;
{
    NSString* eventName = [command.arguments objectAtIndex:0];
    if(callbackIds1[eventName] != nil) {
        [callbackIds1[eventName] addObject:command.callbackId];
    }
   
}



- (void) reportAnswerBackToPlugin:(NSString*)action
{
    NSLog(@"VoipPush Answering back for the plugin");
    //present a local notifcation to visually see when we are recieving a VoIP Notification
    
    if(self.commandDelegate != nil ){
        for (id callbackId in callbackIds1[action]) {
            CDVPluginResult* pluginResult = nil;
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK  messageAsDictionary:[VideoChatController sharedInstance].incomingPayload];
            [pluginResult setKeepCallbackAsBool:YES];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
        }
    }
    
    //[action fail];
}



- (void)mute:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    BOOL success =[[VideoChatController sharedInstance] mute];
        if(success) {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Muted Successfully"];
        } else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"An error occurred"];
        }
   
    if(self.commandDelegate != nil) [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)unmute:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    BOOL success = [[VideoChatController sharedInstance] unmute];
        if(success) {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Muted Successfully"];
        } else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"An error occurred"];
        }
    if(self.commandDelegate != nil) [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)speakerOn:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    
    BOOL success = [[VideoChatController sharedInstance] speakerOn];
    if(success) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Speakerphone is on"];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"An error occurred"];
    }
    if(self.commandDelegate != nil) [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)speakerOff:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    
    BOOL success = [[VideoChatController sharedInstance] speakerOff];
    if(success) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Speakerphone is off"];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"An error occurred"];
    }
    if(self.commandDelegate != nil) [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)callNumber:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    NSString* phoneNumber = [command.arguments objectAtIndex:0];
    NSString* telNumber = [@"tel://" stringByAppendingString:phoneNumber];
    if (@available(iOS 10.0, *)) {
        [[UIApplication sharedApplication] openURL:[NSURL URLWithString:telNumber]
                                           options:nil
                                 completionHandler:^(BOOL success) {
                                     if(success) {
                                         CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Call Successful"];
                                         if(self.commandDelegate != nil) [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
                                     } else {
                                         CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Call Failed"];
                                         if(self.commandDelegate != nil) [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
                                     }
                                 }];
    } else {
        BOOL success = [[UIApplication sharedApplication] openURL:[NSURL URLWithString:telNumber]];
        if(success) {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Call Successful"];
        } else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Call Failed"];
        }
        if(self.commandDelegate != nil) [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
    
}
- (void)getPayload:(CDVInvokedUrlCommand*)command{
    CDVPluginResult* pluginResult = nil;
    NSLog(@"getting the payload result!!!");
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[VideoChatController sharedInstance].incomingPayload];
    
    if(self.commandDelegate != nil) [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)configCallLog:(CDVInvokedUrlCommand*)command{
    if( [command.arguments count] >= 3){
        [NSUserDefaults.standardUserDefaults setObject:[command.arguments objectAtIndex:0] forKey:[VideoChatController  API_ENDPOINT_SETTING_NAME]];
        [NSUserDefaults.standardUserDefaults setObject:[command.arguments objectAtIndex:1] forKey:[VideoChatController USER_ID_SETTING_NAME]];
        [NSUserDefaults.standardUserDefaults setObject:[command.arguments objectAtIndex:2] forKey:[VideoChatController DEVICE_ID_SETTING_NAME]];
    }
}
- (void)setPendingActionForView:(NSString*)act{
    pendingAction = act;
}

-(void) performCall{
    [[VideoChatController sharedInstance] receiveCall:[NSUUID new]  callFromName:[VideoChatController sharedInstance].calN callIdFrom:nil];
}
@end
