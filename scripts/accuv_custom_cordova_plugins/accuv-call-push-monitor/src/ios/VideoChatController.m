#import "VideoChatController.h"
#import <OpenTok/OpenTok.h>
#import <AVFoundation/AVFoundation.h>
#import "SVProgressHUD.h"
#import <CallKit/CallKit.h>
#import <CallKit/CXError.h>
#import "AccuvCallPushMonitorCustomClose.h"



@interface VideoChatController () <OTSessionDelegate, OTPublisherDelegate, OTSubscriberDelegate, VideoChatDelegate, NSObject, NSURLSessionDelegate>

@end


@implementation VideoChatController

UIButton *hangUpBtn;
UIButton *cameraBtn;
UIButton *noCameraBtn;
UIButton *micBtn;
UILabel *timerLabel;
NSString* cameraPos;
NSString* cameraSel;
NSString* micSel;
int ringTimeout;
NSTimer* watcher;
NSTimer* callTimer;
NSDate* startCallDateTime;
static bool initialized = false;
bool userHangup;
bool autoHangup;
bool callerHangup;


+ (VideoChatController*)sharedInstance {
    static VideoChatController *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[VideoChatController alloc] init];
        [sharedInstance initialize];
    });
    return sharedInstance;
}

+ (NSString*) DEVICE_ID_SETTING_NAME{
    return @"accuv_device_id";
}

+ (NSString*)  USER_ID_SETTING_NAME{
    return @"accuv_user_id";
}

+ (NSString*) API_ENDPOINT_SETTING_NAME{
    return @"accuv_api_endpoint";
}

- (void)viewWillAppear:(BOOL)animated {
    [super viewWillAppear:animated];
    
    if(self.fromBackground == YES){
        [VideoChatController sharedInstance].delegate = self;
    }
}

- (void)viewDidLoad {
    [super viewDidLoad];
    NSLog(@"VideoChatController  view starting to load");
    if(self.fromBackground == YES){
        [self showOrHideLoader :YES :@"Connecting..."];
        [self setupButtons];
       [self performSelector:@selector(connectToAnOpenTokSession) withObject:nil afterDelay:4.f];
    }
}

- (void)viewWillDisappear:(BOOL)animated{
}
- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id)coordinator {
    
    // before rotation
    
    [coordinator animateAlongsideTransition:^(id  _Nonnull context) {
        [timerLabel setFrame: CGRectMake( (self.view.bounds.size.width / 2) - 50,10,100,44)];
        
        [hangUpBtn setFrame:CGRectMake( (self.view.bounds.size.width ) - ( (hangUpBtn.currentBackgroundImage.size.width * 2 ) +10 +10), self.view.bounds.size.height - (hangUpBtn.currentBackgroundImage.size.height + 10), hangUpBtn.currentBackgroundImage.size.width, hangUpBtn.currentBackgroundImage.size.height)];
        
        
        [cameraBtn setFrame:CGRectMake( (self.view.bounds.size.width ) - (cameraBtn.currentBackgroundImage.size.width + 10), self.view.bounds.size.height - (cameraBtn.currentBackgroundImage.size.height + 10), cameraBtn.currentBackgroundImage.size.width, cameraBtn.currentBackgroundImage.size.height)];
        
        [micBtn setFrame:CGRectMake( 10 + micBtn.currentBackgroundImage.size.width + 10, self.view.bounds.size.height - (micBtn.currentBackgroundImage.size.height + 10), micBtn.currentBackgroundImage.size.width,micBtn.currentBackgroundImage.size.height)];
        
        [noCameraBtn setFrame:CGRectMake( 10, self.view.bounds.size.height - (noCameraBtn.currentBackgroundImage.size.height + 10), noCameraBtn.currentBackgroundImage.size.width,noCameraBtn.currentBackgroundImage.size.height)];
        CGRect rect = CGRectNull;
        if(self.view.bounds.size.width > self.view.bounds.size.height){
            rect= CGRectMake(self.view.bounds.size.width - (self.view.bounds.size.width / 4 ) - 20, 20, (self.view.bounds.size.width / 4 ), (self.view.bounds.size.height / 3 ) );
        } else{
            rect=CGRectMake(self.view.bounds.size.width - (self.view.bounds.size.width / 3 ) - 20, 20, (self.view.bounds.size.width / 3 ), (self.view.bounds.size.height / 4 ) );
        }
        if(self.publisher != nil)[self.publisher.view setFrame:rect];
        if(self.subscriber != nil)[self.subscriber.view setFrame:self.view.bounds];
        
    } completion:^(id  _Nonnull context) {
        
        // after rotation
        
    }];
}
- (void)setupButtons{

    NSString* labelText = @"00:00";
    CGRect labelFrame = CGRectMake( (self.view.bounds.size.width / 2) - 50,10,100,44);
    
    timerLabel = [[UILabel alloc] initWithFrame:labelFrame];
    timerLabel.backgroundColor = [UIColor clearColor];
    timerLabel.textColor = [UIColor whiteColor];
    timerLabel.font = [UIFont fontWithName:@"Verdana" size:20.0];
    timerLabel.text = labelText;
    timerLabel.shadowColor = [UIColor darkGrayColor];
    timerLabel.shadowOffset = CGSizeMake(1.0,1.0);
    
    noCameraBtn = [UIButton buttonWithType:UIButtonTypeCustom];
    
    cameraSel = @"yes";
    [noCameraBtn setBackgroundImage:[UIImage imageNamed:@"camera-on"] forState:UIControlStateNormal];
    noCameraBtn.backgroundColor = [UIColor clearColor];
    noCameraBtn.imageEdgeInsets = UIEdgeInsetsMake(8, 8, 8, 8);
    [noCameraBtn setFrame:CGRectMake( 10, self.view.bounds.size.height - (noCameraBtn.currentBackgroundImage.size.height + 10), noCameraBtn.currentBackgroundImage.size.width,noCameraBtn.currentBackgroundImage.size.height)];
    noCameraBtn.layer.cornerRadius = 0.5 * noCameraBtn.currentBackgroundImage.size.width;
    [noCameraBtn addTarget:self action:@selector(noCameraEventListener:) forControlEvents:UIControlEventTouchUpInside];
    
    micBtn = [UIButton buttonWithType:UIButtonTypeCustom];
    
    micSel = @"yes";
    [micBtn setBackgroundImage:[UIImage imageNamed:@"unmute-mic"] forState:UIControlStateNormal];
    micBtn.backgroundColor = [UIColor clearColor];
    micBtn.imageEdgeInsets = UIEdgeInsetsMake(8, 8, 8, 8);
    [micBtn setFrame:CGRectMake( 10 + micBtn.currentBackgroundImage.size.width + 10, self.view.bounds.size.height - (micBtn.currentBackgroundImage.size.height + 10), micBtn.currentBackgroundImage.size.width,micBtn.currentBackgroundImage.size.height)];
    micBtn.layer.cornerRadius = 0.5 * micBtn.currentBackgroundImage.size.width;
    [micBtn addTarget:self action:@selector(micEventListener:) forControlEvents:UIControlEventTouchUpInside];
    
    hangUpBtn = [UIButton buttonWithType:UIButtonTypeCustom];
    
    
    [hangUpBtn setBackgroundImage:[UIImage imageNamed:@"end-call"] forState:UIControlStateNormal];
    hangUpBtn.backgroundColor = [UIColor clearColor];
    hangUpBtn.imageEdgeInsets = UIEdgeInsetsMake(8, 8, 8, 8);
    [hangUpBtn setFrame:CGRectMake( (self.view.bounds.size.width ) - ( (hangUpBtn.currentBackgroundImage.size.width * 2)+10 +10), self.view.bounds.size.height - (hangUpBtn.currentBackgroundImage.size.height + 10), hangUpBtn.currentBackgroundImage.size.width, hangUpBtn.currentBackgroundImage.size.height)];
    hangUpBtn.layer.cornerRadius = 0.5 * hangUpBtn.currentBackgroundImage.size.width;
    [hangUpBtn addTarget:self action:@selector(hangUpButtonEventListener:) forControlEvents:UIControlEventTouchUpInside];
    
    cameraBtn = [UIButton buttonWithType:UIButtonTypeCustom];
    
    cameraPos = @"front";
    [cameraBtn setBackgroundImage:[UIImage imageNamed:@"rear-camera"] forState:UIControlStateNormal];
    cameraBtn.backgroundColor = [UIColor clearColor];
    cameraBtn.imageEdgeInsets = UIEdgeInsetsMake(8, 8, 8, 8);
    [cameraBtn setFrame:CGRectMake( (self.view.bounds.size.width ) - (cameraBtn.currentBackgroundImage.size.width + 10), self.view.bounds.size.height - (cameraBtn.currentBackgroundImage.size.height + 10), cameraBtn.currentBackgroundImage.size.width, cameraBtn.currentBackgroundImage.size.height)];
    cameraBtn.layer.cornerRadius = 0.5 * cameraBtn.currentBackgroundImage.size.width;
    [cameraBtn addTarget:self action:@selector(cameraSwitchEventListener:) forControlEvents:UIControlEventTouchUpInside];
    
    [self.view addSubview:noCameraBtn];
    [self.view addSubview:micBtn];
    [self.view addSubview:hangUpBtn];
    [self.view addSubview:cameraBtn];
    [self.view addSubview:timerLabel];
    
    NSLog(@"VideoChatController buttons configured");
    
}
- (void)hangUpButtonEventListener:(id)sender{
    [self showOrHideLoader:YES :@"Ending call..."];
    userHangup = true;
    [self performSelectorOnMainThread:@selector(endCall) withObject:nil waitUntilDone:NO];
    //[self performSelector:@selector(endCall) withObject:nil afterDelay:4.f];
    /*if(_session != nil){
     OTError* error;
     if(_publisher != NULL) [_session unpublish:_publisher error:&error];
     
     if(error != nil) NSLog(@"Error while trying to unpublish publisher %@",error);
     
     error = nil;
     if(_subscriber != NULL) [_session unsubscribe:_subscriber error:&error];
     if(error != nil )NSLog(@"Error while trying to unsubscriber subscriber %@",error);
     
     error = nil;
     [_session disconnect:&error];
     if(error != nil){
     NSLog(@"Error while trying to unpublish publisher %@",error);
     }
     
     }else{
     [self showOrHideLoader :YES :@"Call terminated"];
     
     [self bye];
     
     }*/
    
}
- (void)bye{
    
    if(self.fromBackground == YES){
        [self showOrHideLoader :YES :@"Call terminated"];
        
        //CUSTOM CLOSE IMPLEMENTATION
        [[UIApplication sharedApplication] close];
        
        //exit(EXIT_SUCCESS);
    }
}

- (void)micEventListener:(id)sender{
    if(_publisher != nil ){
        if( [micSel isEqualToString:@"mute"] ){
            _publisher.publishAudio = YES;
            [micBtn setBackgroundImage:[UIImage imageNamed:@"unmute-mic"] forState:UIControlStateNormal];
            micSel = @"unmute";
            
        }else{
            _publisher.publishAudio= NO;
            [micBtn setBackgroundImage:[UIImage imageNamed:@"mute-mic"] forState:UIControlStateNormal];
            micSel = @"mute";
        }
        
    }
    
}
- (void)cameraSwitchEventListener:(id)sender{
    if(_publisher != nil ){
        if( [cameraPos isEqualToString:@"back"] ){
            _publisher.cameraPosition = AVCaptureDevicePositionFront;
            [cameraBtn setBackgroundImage:[UIImage imageNamed:@"rear-camera"] forState:UIControlStateNormal];
            cameraPos = @"front";
            
        }else{
            _publisher.cameraPosition= AVCaptureDevicePositionBack;
            [cameraBtn setBackgroundImage:[UIImage imageNamed:@"front-camera"] forState:UIControlStateNormal];
            cameraPos = @"back";
        }
        
    }
    
}

- (void)noCameraEventListener:(id)sender{
    if(_publisher != nil ){
        if( [cameraSel isEqualToString:@"no"] ){
            _publisher.publishVideo = YES;
            cameraSel = @"yes";
            [noCameraBtn setBackgroundImage:[UIImage imageNamed:@"camera-on"] forState:UIControlStateNormal];
            
        }else{
            _publisher.publishVideo = NO;
            [noCameraBtn setBackgroundImage:[UIImage imageNamed:@"no-camera"] forState:UIControlStateNormal];
            cameraSel = @"no";
        }
        
    }
    
}

- (void)connectToAnOpenTokSession {
    
    [self setupAudioSession];
    
    NSLog(@"VideoChatController The keys are a=%@ c=%@ x=%@", self.apiKey, self.sessionId, self.token);
    if(_session == nil){
        //_session = [[OTSession alloc] initWithApiKey:self.apiKey sessionId:self.sessionId delegate:sessionDel];
        @try {
            _session = [[OTSession alloc] initWithApiKey:self.apiKey sessionId:self.sessionId delegate:self];
            NSError *error;
            [_session connectWithToken:self.token error:&error];
            if (error) {
                NSLog(@"VideoChatController ERROR TRYING TO CONNECT %@", error);
            }
        } @catch (NSException *exception) {
            NSLog(@"VideoChatController error trying to instantiante the ot session, %@", exception);
        } @finally {
            
        }
        
    }
    
    
}

# pragma mark - OTSession delegate callbacks

- (void)sessionDidConnect:(OTSession*)session
{
    [self logCall:self.projectId CallIdentifier:self.callid FromUser:self.fromUser FromDeviceIdentifier:self.fromdevice FromDevicePlatform:self.fromDevicePlatform WorkOrderSid:self.wosid RoomIdentifier:self.roomId IsEndCallLog:false EndReason:nil];
    if( [self.callLogResult isEqualToString: @"OK"] == false) {
        NSLog(@"VideoChatController Ending call due to not been able to send the log to the server");
        [self showOrHideLoader:true :@"User is in another call!!"];
        if(self.fromBackground) [self endCall];
        return;
    }
    
    NSLog(@"The client connected to the OpenTok session.");
    _publisher = [[OTPublisher alloc]
                  initWithDelegate:self];
    
    OTError *error = nil;
    [_session publish:_publisher error:&error];
    if (error)
    {
        NSLog(@"Unable to publish (%@)", error.localizedDescription);
        return;
    }
    
    CGSize screenSize = [UIScreen mainScreen].bounds.size;
    CGRect rect = CGRectNull;
    if(screenSize.width > screenSize.height){
        rect= CGRectMake(screenSize.width - (screenSize.width / 4 ) - 20, 20, (screenSize.width / 4 ), screenSize.height / 3 ) ;
    } else{
        rect=CGRectMake(screenSize.width - (screenSize.width / 3 ) - 20, 20, (screenSize.width / 3 ), (screenSize.height / 4 ) );
    }
    [_publisher.view setFrame:rect];
    [self.view addSubview:_publisher.view];
    
    
    NSLog(@"The client didconnected from the OpenTok session.");
}

- (void)sessionDidDisconnect:(OTSession*)session
{
    [self bye];
}
- (void)showOrHideLoader:(Boolean)showOrHide :(NSString*)msg{
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        // time-consuming task
        dispatch_async(dispatch_get_main_queue(), ^{
            if(!showOrHide) [SVProgressHUD dismiss];
            else [SVProgressHUD showWithStatus:msg];
        });
    });
}

- (void) session:(OTSession*)session
didFailWithError:(OTError*)error
{
    NSLog(@"The client failed to connect to the OpenTok session: (%@)", error);
}

- (void)session:(OTSession*)session
  streamCreated:(OTStream *)stream
{
    NSLog(@"A stream was created in the session.");
    _subscriber = [[OTSubscriber alloc] initWithStream:stream
                                              delegate:self];
    OTError *error = nil;
    [_session subscribe:_subscriber error:&error];
    if (error)
    {
        NSLog(@"Unable to subscribe (%@)", error.localizedDescription);
        return;
    }
    callTimer = [NSTimer scheduledTimerWithTimeInterval:1
                                                 target:self
                                               selector:@selector(updateTimerLabel)
                                               userInfo:nil
                                                repeats:YES];
    [_subscriber.view setFrame:self.view.bounds];
    [self.view insertSubview:_subscriber.view atIndex:0];
}

- (void)session:(OTSession*)session
streamDestroyed:(OTStream *)stream
{
    callerHangup = true;
    if(_subscriber != nil)[_subscriber.view removeFromSuperview];
    if(self.fromBackground) [self endCall];
    NSLog(@"A stream was destroyed in the session.");
    
}
# pragma mark - OTPublisher delegate callbacks
- (void)publisher:(OTPublisherKit*)publisher
 didFailWithError:(OTError*) error
{
    NSLog(@"The publisher failed: %@", error);
}
# pragma mark - OTPublisher delegate callbacks
- (void)publisher:(OTPublisherKit*)publisher
  streamDestroyed:(OTStream *)stream
{
    if(_publisher != nil) [_publisher.view removeFromSuperview];
}

# pragma mark - OTSubscriber delegate callbacks
- (void)subscriberDidConnectToStream:(OTSubscriberKit *)subscriber {
    [self showOrHideLoader :NO :nil];
    NSLog(@"The subscirber: %@ did connect to the stream", subscriber);
    
    @try {
        AVAudioSession* audioSession = [AVAudioSession sharedInstance];
        AVAudioSessionCategoryOptions options = audioSession.categoryOptions;
        // Respect old category options if category is
        // AVAudioSessionCategoryPlayAndRecord. Otherwise reset it since old options
        // might not be valid for this category.
        
        options &= ~AVAudioSessionCategoryOptionDefaultToSpeaker;
        
        
        NSError* err = nil;
        [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord
                      withOptions:options
                            error:&err];
        NSLog(@"VideoChatController error trying to remove the category %@",[err localizedFailureReason]);
    } @catch (NSException *exception) {
        NSLog(@"VideoChatController error trying to remove the category exception %@", exception.description);
    } @finally {
        
    }
}

- (void)subscriber:(OTSubscriberKit*)subscriber
  didFailWithError:(OTError*)error
{
    NSLog(@"subscriber %@ didFailWithError %@",
          subscriber.stream.streamId,
          error);
}

- (void) initialize{
    NSLog(@"VideoChatController INITIALIZING THE VIDEO CHAT CONTORLLER");
    if(initialized) return;
    initialized = true;
    CXProviderConfiguration *providerConfiguration;
    self.appName1 = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"];
    providerConfiguration = [[CXProviderConfiguration alloc] initWithLocalizedName:self.appName1];
    providerConfiguration.maximumCallGroups = 1;
    providerConfiguration.maximumCallsPerCallGroup = 1;
    NSMutableSet *handleTypes = [[NSMutableSet alloc] init];
    [handleTypes addObject:@(CXHandleTypePhoneNumber)];
    providerConfiguration.supportedHandleTypes = handleTypes;
    providerConfiguration.supportsVideo = YES;
    if (@available(iOS 11.0, *)) {
        providerConfiguration.includesCallsInRecents = NO;
    }
    self.callController = [[CXCallController alloc] init];
    self.provider = [[CXProvider alloc] initWithConfiguration:providerConfiguration];
    [self.provider setDelegate:self queue:nil];
    
    /*if ([[UIApplication sharedApplication] applicationState] == UIApplicationStateBackground){
     if( !([UIApplication sharedApplication].delegate.window.rootViewController.navigationController.viewControllers.count > 1) ){
     [UIApplication sharedApplication].delegate.window.rootViewController.navigationController.interactivePopGestureRecognizer.enabled = NO;
     NSLog(@"DISABLING SOME WEIRD STUFF MESSING UP WITH THE UI");
     }    }*/
    
    //allows user to make call from recents
    /*[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(receiveCallFromRecents:) name:@"RecentsCallNotification" object:nil];*/
    //detect Audio Route Changes to make speakerOn and speakerOff event handlers
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleAudioRouteChange:) name:AVAudioSessionRouteChangeNotification object:nil];
    
    [self speakerOff]; //by default;
}

- (void)handleAudioRouteChange:(NSNotification *) notification
{
    if(self.monitorAudioRouteChange1) {
        NSNumber* reasonValue = notification.userInfo[@"AVAudioSessionRouteChangeReasonKey"];
        AVAudioSessionRouteDescription* previousRouteKey = notification.userInfo[@"AVAudioSessionRouteChangePreviousRouteKey"];
        NSArray* outputs = [previousRouteKey outputs];
        if([outputs count] > 0) {
            AVAudioSessionPortDescription *output = outputs[0];
            if(![output.portType isEqual: @"Speaker"] && [reasonValue isEqual:@4]) {
                
            } else if([output.portType isEqual: @"Speaker"] && [reasonValue isEqual:@3]) {
                
            }
        }
    }
}

- (void)updateProviderConfig {
    CXProviderConfiguration *providerConfiguration;
    providerConfiguration = [[CXProviderConfiguration alloc] initWithLocalizedName:self.appName1];
    providerConfiguration.maximumCallGroups = 1;
    providerConfiguration.maximumCallsPerCallGroup = 1;
    if(self.ringtone1 != nil) {
        providerConfiguration.ringtoneSound = self.ringtone1;
    }
    if(self.icon1 != nil) {
        UIImage *iconImage = [UIImage imageNamed:self.icon1];
        NSData *iconData = UIImagePNGRepresentation(iconImage);
        providerConfiguration.iconTemplateImageData = iconData;
    }
    NSMutableSet *handleTypes = [[NSMutableSet alloc] init];
    [handleTypes addObject:@(CXHandleTypePhoneNumber)];
    providerConfiguration.supportedHandleTypes = handleTypes;
    providerConfiguration.supportsVideo = self.hasVideo1;
    if (@available(iOS 11.0, *)) {
        providerConfiguration.includesCallsInRecents = self.includeInRecents1;
    }
    
    self.provider.configuration = providerConfiguration;
}

- (Boolean)setAppName:(NSString*)appName
{
    Boolean result = NO;
    NSString* proposedAppName = appName;
    
    if (proposedAppName != nil && [proposedAppName length] > 0) {
        self.appName1 = proposedAppName;
        [self updateProviderConfig];
        result = YES;
    } return result;
}

- (Boolean)setIcon:(NSString*)iconName
{
    Boolean result = NO;
    NSString* proposedIconName = iconName;
    
    if (!(proposedIconName == nil || [proposedIconName length] == 0)) {
        
        if(!([UIImage imageNamed:proposedIconName] == nil) ){
            self.icon1 = proposedIconName;
            [self updateProviderConfig];
            result = YES;
        }
    }
    return result;
}

- (Boolean)setRingtone:(NSString*)fName
{
    Boolean result = NO;
    NSString* proposedRingtoneName = fName;
    
    if (!(proposedRingtoneName == nil || [proposedRingtoneName length] == 0) ){
        self.ringtone1 = [NSString stringWithFormat: @"%@.caf", proposedRingtoneName];
        [self updateProviderConfig];
        result = YES;
    }
    
    return result;
}



- (void)receiveCall:(NSUUID*)uid  callFromName:(NSString*)callFrom  callIdFrom:(NSString*)cidFrom
{
    NSString* callName = callFrom;
    NSString* callId =  cidFrom != nil ? cidFrom : callName ;
    
    if (cidFrom != nil) {
        [[NSUserDefaults standardUserDefaults] setObject:callName forKey:cidFrom];
        [[NSUserDefaults standardUserDefaults] synchronize];
    }
    NSLog(@"VideoChatController CALL NAME AND CALLID %@ ,  %@", callName, callId);
    if (callName != nil && [callName length] > 0) {
        CXHandle *handle = [[CXHandle alloc] initWithType:CXHandleTypePhoneNumber value:callId];
        CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
        callUpdate.remoteHandle = handle;
        callUpdate.hasVideo = self.hasVideo1;
        callUpdate.localizedCallerName = callName;
        callUpdate.supportsGrouping = NO;
        callUpdate.supportsUngrouping = NO;
        callUpdate.supportsHolding = NO;
        callUpdate.supportsDTMF = self.enableDTMF1;
        
        /*dispatch_async(dispatch_get_main_queue(), ^{
         
         
         });*/
        __weak VideoChatController *weakSelf = self;
        [self.provider reportNewIncomingCallWithUUID:uid update:callUpdate completion:^(NSError * _Nullable error) {
            if(!error){
                weakSelf.uuid = uid;
                NSLog(@"VideoChatController the call uuid is from the new incoming call %@", self.uuid);
            } else{
                if ([VideoChatController sharedInstance].delegate && [[VideoChatController sharedInstance].delegate respondsToSelector:@selector(callDidFail)]) {
                    [[VideoChatController sharedInstance].delegate callDidFail];
                }
            }
            
            
        }];
        
        watcher =  [NSTimer scheduledTimerWithTimeInterval:ringTimeout
                                                    target:self
                                                  selector:@selector(checkIfCallPickedUp)
                                                  userInfo:nil
                                                   repeats:NO];
        
        
    } else {
        
    }
}

- (void) checkIfCallPickedUp{
    if([VideoChatController sharedInstance].callPickedUp == false){
        autoHangup = true;
        [self endCall];
    }
}
- (NSString*) additionalZero:(int)value{
    NSString* strValue = [NSString stringWithFormat:@"%d", value];
    return [strValue length] <= 1 ? @"0": @"";
}

- (NSString*) convertToString:(int)value{
    return [NSString stringWithFormat:@"%d",value];
}
- (void) updateTimerLabel{
    if(startCallDateTime == nil) startCallDateTime = [NSDate date];
    NSTimeInterval firstInterval = [startCallDateTime timeIntervalSince1970];
    NSTimeInterval secondInterval = [[NSDate date] timeIntervalSince1970];
    int diff = (secondInterval - firstInterval);
    int hours =  floor(diff / 3600 % 24);
    int minutes = floor(diff / 60 % 60);
    int seconds = diff % 60;
    NSMutableString* finalTimerText = [NSMutableString stringWithString:@""];
    
    //hours
    if(hours > 0){
        [finalTimerText appendString:[self additionalZero:hours] ];
        [finalTimerText appendString:[self convertToString:hours]];
        [finalTimerText appendString:@":"];
    }
    
    //minutes
    [finalTimerText appendString:[self additionalZero:minutes] ];
    [finalTimerText appendString:[self convertToString:minutes]];
    [finalTimerText appendString:@":"];
    
    //minutes
    [finalTimerText appendString:[self additionalZero:seconds] ];
    [finalTimerText appendString:[self convertToString:seconds]];

    timerLabel.text = finalTimerText;
    
    
}

- (void)sendCall:(NSString*)to :(NSString*)callIdTo{
    BOOL hasId = callIdTo != nil ? YES: NO;
    NSString* callName = to;
    NSString* callId = hasId?callIdTo:callName;
    NSUUID *callUUID = [[NSUUID alloc] init];
    
    if (hasId) {
        [[NSUserDefaults standardUserDefaults] setObject:callName forKey:callId];
        [[NSUserDefaults standardUserDefaults] synchronize];
    }
    
    if (callName != nil && [callName length] > 0) {
        CXHandle *handle = [[CXHandle alloc] initWithType:CXHandleTypePhoneNumber value:callId];
        CXStartCallAction *startCallAction = [[CXStartCallAction alloc] initWithCallUUID:callUUID handle:handle];
        startCallAction.contactIdentifier = callName;
        startCallAction.video = self.hasVideo1;
        CXTransaction *transaction = [[CXTransaction alloc] initWithAction:startCallAction];
        [self.callController requestTransaction:transaction completion:^(NSError * _Nullable error) {
            if (error == nil) {
                
            } else {
                
            }
        }];
    } else {
        
    }
}

- (void)connectCall
{
    NSArray<CXCall *> *calls = self.callController.callObserver.calls;
    
    if([calls count] == 1) {
        [self.provider reportOutgoingCallWithUUID:calls[0].UUID connectedAtDate:nil];
        
    } else {
        
    }
    
}

- (void)endCall
{
    NSUUID* cuuid = self.uuid;
    
    if(self.fromBackground){
        [self showOrHideLoader :YES :@"Ending call.."];
    }
    
    CXEndCallAction *endCallAction = nil;
    @try {
        endCallAction = [[CXEndCallAction alloc] initWithCallUUID:[[[[self.callController callObserver] calls] firstObject] UUID]];
        
    }
    @catch (NSException *exception) {
        NSLog(@"Unknown error when trying to insatntiate end call action %@", exception.description);
    }
    
    CXTransaction *transaction = [[CXTransaction alloc] init];
    
    if(endCallAction != nil)[transaction addAction:endCallAction];
    
    //IF THE CALL WAS NOT ANSWERED AND TIMEOUT TRIGGERED THE END CALL
    //THEN JUST REPORT THE CALL HAS BEEN UNASWERED
    if([VideoChatController sharedInstance].callPickedUp != YES){
        
        [self reportBack:@"hangup"];
        
        [self.provider reportCallWithUUID:cuuid endedAtDate:nil reason:CXCallEndedReasonUnanswered];
        
        //just in case the above code plays dirty tricks <(-_-)>
        if ([VideoChatController sharedInstance].delegate && [[VideoChatController sharedInstance].delegate respondsToSelector:@selector(callDidEnd)]) {
            [[VideoChatController sharedInstance].delegate callDidEnd];
        }
        [self cleanData];
        return;
    }
    
    
    if(endCallAction != nil)[self.callController requestTransaction:transaction  completion:^(NSError * _Nullable error) {
        NSLog(@"VideoChatController Are you triggering at all?");
        NSLog(@"VideoChatController the call uuid is from the end call 2 %@", self.uuid);
        if (error == nil) {
            NSLog(@"VideoChatController No errors when trying to delete the call");
        } else {
            NSLog(@"VideoChatController error trying to end call %@",[error debugDescription]);
            NSLog(@"VideoChatController doing something else to end the call");
            
            [self reportBack:@"hangup"];
            [self.provider reportCallWithUUID:cuuid endedAtDate:nil reason:CXCallEndedReasonRemoteEnded];
            
            if ([VideoChatController sharedInstance].delegate && [[VideoChatController sharedInstance].delegate respondsToSelector:@selector(callDidEnd)]) {
                [[VideoChatController sharedInstance].delegate callDidEnd];
            }
            [self cleanData];
            //explode
            
        }
    }];
    
}


- (Boolean)mute
{
    Boolean result = NO;
    AVAudioSession *sessionInstance = [AVAudioSession sharedInstance];
    if(sessionInstance.isInputGainSettable) {
        result = [sessionInstance setInputGain:0.0 error:nil];
        
        
    }
    
    return result;
}

- (Boolean)unmute
{
    Boolean result = NO;
    AVAudioSession *sessionInstance = [AVAudioSession sharedInstance];
    if(sessionInstance.isInputGainSettable) {
        result = [sessionInstance setInputGain:1.0 error:nil];
        
    }
    
    return result;
    
}

- (Boolean)speakerOn
{
    AVAudioSession *sessionInstance = [AVAudioSession sharedInstance];
    BOOL result = [sessionInstance overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:nil];
    return result;
}

- (Boolean)speakerOff
{
    AVAudioSession *sessionInstance = [AVAudioSession sharedInstance];
    BOOL result = [sessionInstance overrideOutputAudioPort:AVAudioSessionPortOverrideNone error:nil];
    return result;
}

- (Boolean)callNumber:(NSString*)to
{
    Boolean result = NO;
    
    
    return result;
    
}

- (void) receiveCallFromRecents:(NSNotification *) notification
{
    NSString* callID = notification.object[@"callId"];
    NSString* callName = notification.object[@"callName"];
    NSUUID *callUUID = [[NSUUID alloc] init];
    CXHandle *handle = [[CXHandle alloc] initWithType:CXHandleTypePhoneNumber value:callID];
    CXStartCallAction *startCallAction = [[CXStartCallAction alloc] initWithCallUUID:callUUID handle:handle];
    startCallAction.video = [notification.object[@"isVideo"] boolValue]?YES:NO;
    startCallAction.contactIdentifier = callName;
    CXTransaction *transaction = [[CXTransaction alloc] initWithAction:startCallAction];
    [self.callController requestTransaction:transaction completion:^(NSError * _Nullable error) {
        if (error == nil) {
        } else {
            NSLog(@"%@",[error localizedDescription]);
        }
    }];
}

- (void)setupAudioSession
{
    @try {
        AVAudioSession *sessionInstance = [AVAudioSession sharedInstance];
        [sessionInstance setCategory:AVAudioSessionCategoryPlayAndRecord error:nil];
        [sessionInstance setMode:AVAudioSessionModeVoiceChat error:nil];
        NSTimeInterval bufferDuration = .005;
        [sessionInstance setPreferredIOBufferDuration:bufferDuration error:nil];
        [sessionInstance setPreferredSampleRate:44100 error:nil];
        NSError* err;
        [sessionInstance setActive:YES error:&err];
        NSLog(@"VideoChatController Configuring Audio, %@", err);
    }
    @catch (NSException *exception) {
        NSLog(@"VideoChatController Unknown error returned from setupAudioSession, %@", exception);
    }
    return;
}
- (void)setIncludeInRecents:(Boolean)include
{
    self.includeInRecents1 =include;
    [self updateProviderConfig];
    
}

- (void)setDTMFState:(Boolean)state
{
    self.enableDTMF1 = state;
    
}

- (void)cleanData{
    NSLog(@"VideoChatController cleaning data");
    if(watcher != nil && [watcher isValid]) {
        [watcher invalidate];
        watcher = nil;
    }
    if(callTimer != nil && [callTimer isValid]){
        [callTimer invalidate];
        callTimer = nil;
    }
    callerHangup = false;
    userHangup = false;
    autoHangup = false;
    [VideoChatController sharedInstance].fromDevicePlatform = nil;
    [VideoChatController sharedInstance].fromdevice = nil;
    [VideoChatController sharedInstance].fromUser = nil;
    [VideoChatController sharedInstance].projectId = nil;
    [VideoChatController sharedInstance].wosid = nil;
    [VideoChatController sharedInstance].roomId = nil;
    
    [VideoChatController sharedInstance].incomingPayload = nil;
    [VideoChatController sharedInstance].inACall = NO;
    [VideoChatController sharedInstance].callPickedUp = false;
    [VideoChatController sharedInstance].uuid = nil;
    
}
- (void)setVideoBool:(Boolean)ithas{
    [VideoChatController sharedInstance].hasVideo1 = ithas;
}

- (void)provider:(CXProvider *)provider performPlayDTMFCallAction:(CXPlayDTMFCallAction *)action
{
    NSLog(@"DTMF Event");
    [action fulfill];
    
}


- (void)provider:(CXProvider *)provider performSetMutedCallAction:(CXSetMutedCallAction *)action
{
    [action fulfill];
    BOOL isMuted = action.muted;
    if(self.publisher != nil) self.publisher.publishAudio = !(isMuted == true);
    //[action fail];
}


- (void)provider:(CXProvider *)provider performEndCallAction:(CXEndCallAction *)action
{
    NSLog(@"VideoChatController performing end call");
    if(watcher != nil && [watcher isValid]) {
        [watcher invalidate];
        watcher = nil;
    }
    [action fulfill];
    if ([VideoChatController sharedInstance].delegate && [[VideoChatController sharedInstance].delegate respondsToSelector:@selector(callDidEnd)]) {
        [[VideoChatController sharedInstance].delegate callDidEnd];
    }else
        [self callDidEnd];
    
}

- (void)reportBack:(NSString*)actionName{
    if(self.fromBackground != YES) [self.monitor reportAnswerBackToPlugin:actionName];
}
- (void)provider:(CXProvider *)provider performAnswerCallAction:(CXAnswerCallAction *)action
{
    NSLog(@"VideoChatController Answering !!!");
    [VideoChatController sharedInstance].callPickedUp = true;
    [action fulfill];
    
    [self setupAudioSession];
    //present a local notifcation to visually see when we are recieving a VoIP Notification
    if(self.incomingPayload != nil){
        NSString* auxParams = self.incomingPayload[@"auxParameters"];
        
        NSData *jsonData = [auxParams dataUsingEncoding:NSUTF8StringEncoding];
        id json = [NSJSONSerialization JSONObjectWithData:jsonData options:0 error:nil];
        
        NSLog(@"VideoChatController json parsed");
        NSLog(@"VideoChatController json is %@", json);
        NSLog(@"VideoChatController data type of var are %@, %@, %@",[[json objectForKey:@"a"] class], [[json objectForKey:@"c"] class], [[json objectForKey:@"x"] class] );
        NSString* a = (NSString *)[json objectForKey:@"a"];
        a = [a stringByReplacingOccurrencesOfString:@"'"
                                         withString:@""];
        NSLog(@"VideoChatController json a is in string %@", a);
        
        NSString* c = (NSString *)[json objectForKey:@"c"];
        
        NSString* x = (NSString *)[json objectForKey:@"x"];
        
        self.callid = (NSString *)[json objectForKey:@"callid"];
        self.fromdevice = (NSString *)[json objectForKey:@"fromDevice"];
        self.wosid = (NSString *)[json objectForKey:@"workOrderSid"];
        if(self.wosid == nil) self.wosid =(NSString *)[json objectForKey:@"workorderSid"];
        self.fromDevicePlatform = (NSString *)[json objectForKey:@"fromDevicePlatform"];
        self.roomId = (NSString *)[json objectForKey:@"roomId"];
        self.fromUser = (NSString *)[json objectForKey:@"from"];
        self.projectId = self.incomingPayload[@"projectId"];
        
        self.apiKey = a;
        self.sessionId = c;
        self.token = x;
        
        if(self.fromBackground== true ){
            NSLog(@"VideoChatController The command delegate is null, showing main controller! ");
            
            
            NSLog(@"VideoChatController incoming payload is not null instantiating video chat controller");
            //VideoChatController* videoChat = [[VideoChatController alloc] init];
            NSLog(@"VideoChatController video chat component instantiated");
            
            NSLog(@"VideoChatController call has been anaswered and post answer tasks have been performed");
            self.view.frame = UIScreen.mainScreen.bounds;
            
            [UIView transitionWithView:[UIApplication sharedApplication].delegate.window duration:0.5 options:UIViewAnimationOptionTransitionCrossDissolve animations:^{
                [UIApplication sharedApplication].delegate.window.rootViewController = self;
                
            }  completion:^(BOOL finished) {
                
            }];
            
            
        }else{
            
            [self reportBack:@"answer"];
            
        }
        
    }
    
    
    
    //[action fail];
}



- (void)providerDidReset:(CXProvider *)provider
{
    NSLog(@"%s","providerdidreset");
}

- (void)provider:(CXProvider *)provider performStartCallAction:(CXStartCallAction *)action
{
    /*[self setupAudioSession];
     CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
     callUpdate.remoteHandle = action.handle;
     callUpdate.hasVideo = action.video;
     callUpdate.localizedCallerName = action.contactIdentifier;
     callUpdate.supportsGrouping = NO;
     callUpdate.supportsUngrouping = NO;
     callUpdate.supportsHolding = NO;
     callUpdate.supportsDTMF = self.enableDTMF1;
     
     [VideoChatController.sharedInstance.provider reportCallWithUUID:action.callUUID updated:callUpdate];*/
    [action fulfill];
    
    //[action fail];
}

- (void)provider:(CXProvider *)provider didActivateAudioSession:(AVAudioSession *)audioSession
{
    NSLog(@"activated audio");
   // if(self.fromBackground) [self connectToAnOpenTokSession];
    //self.monitorAudioRouteChange1 = YES;
}

- (void)provider:(CXProvider *)provider didDeactivateAudioSession:(AVAudioSession *)audioSession
{
    NSLog(@"deactivated audio");
}
- (void) setRingTimeout:(NSString*)seconds{
    int b = (int) [seconds integerValue];
    NSLog(@"VideoChatController ringing timeout %d", b);
    if(b > 0){
        ringTimeout = b;
    }
}



- (void)callDidAnswer {
    
    
}

- (void)callDidEnd {
    NSLog(@"VideoChatController ending call... ");
    NSString* endReason;
    if(autoHangup) endReason = @"ended by callee no answer";
    if(userHangup) endReason = @"ended by callee";
    if(callerHangup) endReason = @"ended by caller";
    if(endReason == nil) endReason = @"ended by calee";
    
    //log call when ending the call
    [self logCall:self.projectId CallIdentifier:self.callid FromUser:self.fromUser FromDeviceIdentifier:self.fromdevice FromDevicePlatform:self.fromDevicePlatform WorkOrderSid:self.wosid RoomIdentifier:self.roomId IsEndCallLog:true EndReason:endReason];
    
    
    if(self.session != nil){
        OTError* error;
        if(self.publisher != NULL) [self.session unpublish:self.publisher error:&error];
        
        if(error != nil) NSLog(@"Error while trying to unpublish publisher %@",error);
        
        error = nil;
        if(self.subscriber != NULL) [self.session unsubscribe:self.subscriber error:&error];
        if(error != nil )NSLog(@"Error while trying to unsubscriber subscriber %@",error);
        
        error = nil;
        [self.session disconnect:&error];
        if(error != nil){
            NSLog(@"Error while trying to unpublish publisher %@",error);
            
        }
        
        
    }
    NSLog(@"Trying to end calls!!");
    
    [self cleanData];
    [self bye];
    
    [self reportBack:@"hangup"];
    self.monitorAudioRouteChange1 = NO;
    
}

- (void)callDidHold:(BOOL)isOnHold {
    
}

- (void)callDidFail {
    
    [self bye];
}

- (void) logCall: (NSString*)projectId CallIdentifier:(NSString*)callid  FromUser:(NSString*)fromUsr  FromDeviceIdentifier:(NSString*)fromDev FromDevicePlatform:(NSString*)fromDevPlatform WorkOrderSid:(NSString*)workOrderSid   RoomIdentifier:(NSString*)roomId  IsEndCallLog:(BOOL)isEnd EndReason:(NSString*)endReason{
    NSLog(@"VideoChatController calling log call");
    NSMutableDictionary* requestBody = [[NSMutableDictionary alloc] init];
    
    [requestBody setValue:callid forKey:@"CallIdentifier"];
    [requestBody setValue:workOrderSid forKey:@"WOSID"];
    [requestBody setValue:roomId forKey:@"RoomId"];
    if(isEnd) [requestBody setValue:endReason forKey:@"EndReason"];
    [requestBody setValue:fromUsr forKey:@"CallFrom"];
    [requestBody setValue:fromDev forKey:@"CallFromDeviceId"];
    [requestBody setValue:fromDevPlatform forKey:@"CallFromDevicePlatform"];
    [requestBody setValue:[NSUserDefaults.standardUserDefaults stringForKey:[VideoChatController USER_ID_SETTING_NAME] ] forKey:@"CallTo"];
    [requestBody setValue:[NSUserDefaults.standardUserDefaults stringForKey:[VideoChatController DEVICE_ID_SETTING_NAME] ] forKey:@"CallToDeviceId"];
    [requestBody setValue:@"ios" forKey:@"CallToDevicePlatform"];

    
    /*
    jsonParam.put("CallIdentifier", callId);
    jsonParam.put("WOSID",Integer.parseInt(workOrderSid));
    jsonParam.put("RoomId",  roomId);
    if(isEnd) jsonParam.put("EndReason", endReason);
    jsonParam.put("CallFrom", fromUser);
    jsonParam.put("CallFromDeviceId", fromDevice);
    jsonParam.put("CallFromDevicePlatform", fromDevicePlatform);
    jsonParam.put("CallTo", UserId);
    jsonParam.put("CallToDeviceId", DeviceId);
    jsonParam.put("CallToDevicePlatform", "android");
    */
    NSMutableString* targetUrl =[[NSMutableString alloc] initWithString: [NSUserDefaults.standardUserDefaults stringForKey:[VideoChatController API_ENDPOINT_SETTING_NAME]]];
    
    [targetUrl appendString:@"/ChatEngine/LogCall?projectId="];
    [targetUrl appendString:projectId];
    
    NSError *parsingError;
    
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    NSURLSession *session = [NSURLSession sessionWithConfiguration:configuration delegate:self delegateQueue:nil];
    
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:targetUrl] cachePolicy:NSURLRequestUseProtocolCachePolicy
                                                       timeoutInterval:60.0];
    
    [request addValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    [request addValue:@"application/json" forHTTPHeaderField:@"Accept"];
    
    [request setHTTPMethod:@"POST"];
    
    NSData *postData = [NSJSONSerialization dataWithJSONObject:requestBody options:0 error:&parsingError];
    
    if(parsingError == nil){
        [request setHTTPBody:postData];
        
        NSError* requestError;
        NSURLSessionDataTask *postDataTask = [session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *requestError) {
            NSLog(@"VideoChatController data returned %@", data);
            NSLog(@"VideoChatController This is the result of the request to the server %@", data);
        }];
        
        if(requestError == nil){
            self.callLogResult = @"OK";
        }
        
        [postDataTask resume];
        
    }
    
}


@end
