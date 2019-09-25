//
//Created By Angel Robles 
//
#import <Cordova/CDV.h>
#import <CallKit/CallKit.h>
static NSString* pendingAction = nil;
static NSMutableDictionary *callbackIds1;
@interface AccuvCallPushMonitor : CDVPlugin

- (void)setAppName:(CDVInvokedUrlCommand*)command;
- (void)setIcon:(CDVInvokedUrlCommand*)command;
- (void)setRingtone:(CDVInvokedUrlCommand*)command;
- (void)setVideo:(CDVInvokedUrlCommand*)command;
- (void)setIncludeInRecents:(CDVInvokedUrlCommand*)command;
- (void)receiveCall:(CDVInvokedUrlCommand*)command;
- (void)sendCall:(CDVInvokedUrlCommand*)command;
- (void)connectCall:(CDVInvokedUrlCommand*)command;
- (void)endCall:(CDVInvokedUrlCommand*)command;
- (void)on:(CDVInvokedUrlCommand*)command;
- (void)mute:(CDVInvokedUrlCommand*)command;
- (void)unmute:(CDVInvokedUrlCommand*)command;
- (void)speakerOn:(CDVInvokedUrlCommand*)command;
- (void)speakerOff:(CDVInvokedUrlCommand*)command;
- (void)callNumber:(CDVInvokedUrlCommand*)command;
- (void)getPayload:(CDVInvokedUrlCommand*)command;
- (void)setDTMFState:(CDVInvokedUrlCommand*)command;
- (void)reportAnswerBackToPlugin:(NSString*)act;
- (void)setPendingActionForView:(NSString*)act;
@end
