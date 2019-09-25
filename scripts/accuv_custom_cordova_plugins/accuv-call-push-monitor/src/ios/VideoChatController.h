//
//
//  Created by Angel Robles on 3/13/19.
//

#import <UIKit/UIKit.h>
#import <OpenTok/OpenTok.h>
#import <CallKit/CallKit.h>
#import "AccuvCallPushMonitor.h"



@protocol VideoChatDelegate <NSObject>

- (void)callDidAnswer;
- (void)callDidEnd;
- (void)callDidFail;

@end

@interface VideoChatController : UIViewController<CXProviderDelegate>

- (void)connectToAnOpenTokSession;

/*
 OPENTOK PROPERTIES
 */
@property (nonatomic) OTSession *session;
@property (nonatomic) OTPublisher *publisher;
@property (nonatomic) OTSubscriber *subscriber;
@property (nonatomic) NSString* sessionId;
@property (nonatomic) NSString* apiKey;
@property (nonatomic) NSString* token;
@property (nonatomic) Boolean fromBackground;

@property (nonatomic) NSString* callid;
@property (nonatomic) NSString* fromdevice;
@property (nonatomic) NSString* wosid;
@property (nonatomic) NSString* fromDevicePlatform;
@property (nonatomic) NSString* roomId;
@property (nonatomic) NSString* fromUser;
@property (nonatomic) NSString* projectId;
@property (nonatomic) NSString* callLogResult;


/* CALLKIT PROPERTIES */
@property (nonatomic) BOOL hasVideo1;
@property (nonatomic) NSString* appName1;
@property (nonatomic) NSString* ringtone1;
@property (nonatomic) NSString* icon1;
@property (nonatomic) BOOL includeInRecents1;
@property (nonatomic) NSMutableDictionary *callbackIds1;
@property (nonatomic) NSDictionary* pendingCallFromRecents1;
@property (nonatomic) BOOL monitorAudioRouteChange1;
@property (nonatomic) BOOL enableDTMF1;
@property (nonatomic, strong) CXProvider *provider;
@property (nonatomic, strong) CXCallController *callController;
@property (nonatomic, strong) NSString* calN;
@property (nonatomic, strong) AccuvCallPushMonitor* monitor;
@property (strong) NSUUID *uuid;
@property (strong) NSString *cId;
@property (nonatomic) Boolean inACall;
@property (nonatomic) Boolean callPickedUp;
@property (strong) NSDictionary* incomingPayload;


- (void) initialize;
- (void)updateProviderConfig;
- (Boolean)setAppName:(NSString*)appName;
- (Boolean)setIcon:(NSString*)iconName;
- (Boolean)setRingtone:(NSString*)ringtoneName;
- (void)setIncludeInRecents:(Boolean)includeInRecent;
- (void)receiveCall:(NSUUID*)uuid callFromName:(NSString*)from callIdFrom:(NSString*)callId;
- (void)sendCall:(NSString*)to :(NSString*)callId;
- (void)connectCall;
- (void)endCall;
//- (void)on:(CDVInvokedUrlCommand*)command;
- (Boolean)mute;
- (Boolean)unmute;
- (Boolean)speakerOn;
- (Boolean)speakerOff;
- (Boolean)callNumber:(NSString*)theNumber;
//- (void)initVideoCall:();
- (void)receiveCallFromRecents:(NSNotification *) notification;
- (void)setupAudioSession;
- (void)setDTMFState:(Boolean)state;
- (void)setVideoBool:(Boolean)itHas;
- (void) setRingTimeout:(NSString*)seconds;
+ (VideoChatController*)sharedInstance;
+ (NSString*) API_ENDPOINT_SETTING_NAME;
+ (NSString*) USER_ID_SETTING_NAME;
+ (NSString*) DEVICE_ID_SETTING_NAME;

@property (nonatomic, weak) id<VideoChatDelegate> delegate;

@end


