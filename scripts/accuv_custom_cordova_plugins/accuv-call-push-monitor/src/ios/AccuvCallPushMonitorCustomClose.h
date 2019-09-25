//
//  NSObject+AccuvCallPushMonitorCustomClose.h
//  AccuV-Dev
//
//  Created by Angel Robles on 3/18/19.
//

@interface UIApplication (existing)
- (void)suspend;
- (void)terminateWithSuccess;
@end

@interface UIApplication (close)
- (void)close;
@end

