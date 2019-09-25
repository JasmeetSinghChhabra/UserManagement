/*
Created By Angel Robles
*/
package com.accuv.callpushmonitor;

import com.opentok.android.Session;
import com.opentok.android.Stream;
import com.opentok.android.Publisher;
import com.opentok.android.PublisherKit;
import com.opentok.android.Subscriber;
import com.opentok.android.OpentokError;
import com.opentok.android.VideoUtils;
import android.support.annotation.NonNull;
import android.support.v7.app.AppCompatActivity;
import android.Manifest;
import android.content.Intent;
import android.content.Context;
import android.content.res.Configuration;
import android.content.pm.ActivityInfo;
import android.opengl.GLSurfaceView;
import android.os.Bundle;
import android.os.Build;
import android.os.SystemClock;
import android.util.Log;
import android.util.Rational;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.FrameLayout;
import android.widget.RelativeLayout;
import android.widget.ProgressBar;
import android.widget.Chronometer;
import android.widget.Toast;
import android.graphics.drawable.GradientDrawable;
import android.graphics.Color;
import android.app.PictureInPictureParams;
import pub.devrel.easypermissions.EasyPermissions;
import org.json.JSONObject;
import java.util.List;
import java.util.HashMap;







public class VideoChatActivity extends AppCompatActivity 
                               implements Session.SessionListener,
                               PublisherKit.PublisherListener,
                               EasyPermissions.PermissionCallbacks,
                               AccuvCallConnectionManager.AccuvCallConnectionManagerListener
 {

    private static String TAG = VideoChatActivity.class.getSimpleName();
    private static String PACKAGE_NAME = "";//AccuvCallConnectionManager.class.getPackage().getName();//"com.dev.accuvapp.mobile";
    private  String apiKey;
    private  String sessionId;
    private  String token;
    private static String callId;
    private static String fromDevice;
    private static String workOrderSid;
    private static String fromDevicePlatform;
    private static String roomId;
    private static String fromUser;
    private static String projectId;

    public static final String END_API_CALL_REASON_CLIENT = "ended by callee";
    public static final String END_API_CALL_REASON_ORIGIN = "ended by caller";

    private static final int RC_SETTINGS_SCREEN_PERM = 123;
    private static final int RC_VIDEO_APP_PERM = 124;
    private static String[] perms = {Manifest.permission.INTERNET, Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO};
    private static int ringingTimeout = 30;
    private Session session;
    private Publisher publisher;
    private Subscriber subscriber;
    private FrameLayout publisherViewContainer;
    private RelativeLayout subscriberViewContainer;
    private LinearLayout buttonsContainer;
    private ProgressBar loader;

    Chronometer cmTimer;
    
    public void setData(Context c, Intent i){
       if("".equalsIgnoreCase(PACKAGE_NAME)){
        PACKAGE_NAME = c.getPackageName();
        Log.i(TAG, "Extracting intent");
         if(i.getExtras().containsKey("auxParameters")){
             Log.i(TAG, "Extracting params");
          String auxp =  i.getExtras().getString("auxParameters");
          Log.i(TAG, "Params : "+auxp);
          setData(auxp);
        }

         if(i.getExtras().containsKey("projectId")){
             projectId =  i.getExtras().getString("projectId");
         }
       } 
    }

    private void setData(String auxParams){
            try{
               JSONObject obj = new JSONObject(auxParams);
               Log.i(TAG, "Converted to json aux parameters ");
               if(obj.has("a")) apiKey = obj.getString("a"); 
               if(obj.has("c")) sessionId = obj.getString("c");
               if(obj.has("x")) token = obj.getString("x");
               if(apiKey != null) apiKey = apiKey.replace("'","");
               if(obj.has("callid")) callId = obj.getString("callid");
               if(obj.has("fromDevice")) fromDevice = obj.getString("fromDevice");
               if(obj.has("workOrderSid")) workOrderSid = obj.getString("workOrderSid");
               if(obj.has("workorderSid")) workOrderSid = obj.getString("workorderSid");
               if(obj.has("fromDevicePlatform")) fromDevicePlatform = obj.getString("fromDevicePlatform");
               if(obj.has("roomId")) roomId = obj.getString("roomId");
               if(obj.has("from")) fromUser = obj.getString("from");
               Log.i(TAG, "THe info a = "+apiKey + " c = "+sessionId + " x = "+ token);
            }catch(Exception err){
                Log.e(TAG, err.getMessage());
            }
    }

    @Override
    protected void onSaveInstanceState(final Bundle outState) {
        super.onSaveInstanceState(outState);
        
        // Save the state of item position
         outState.putString("apiKey", apiKey);
         outState.putString("sessionId", sessionId);
         outState.putString("token", token);    
    }

    @Override
    protected void onRestoreInstanceState(final Bundle savedInstanceState) {
        super.onRestoreInstanceState(savedInstanceState);
        
        // Read the state of item position
        apiKey = savedInstanceState.getString("apiKey");
        sessionId = savedInstanceState.getString("sessionId");
        token = savedInstanceState.getString("token");

    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        LoadLayouts();
        AccuvCallConnectionManager.setContext(getApplicationContext());
        AccuvCallConnectionManager.setListener(this);
        setData(getApplicationContext(), getIntent());
        checkPermissionsThenContinue();
    }

     @Override
    protected void onPause() {
        super.onPause();

            if (session != null) {
                try{
                    session.onPause();
                }catch(Exception err){
                    Log.e(TAG, err.getMessage());
                }
            }
            if(this.isFinishing()){
                AccuvCallConnectionManager.cleanUp();
                AccuvCallConnectionManager.endApiCall(END_API_CALL_REASON_CLIENT);
            }
    }

    @Override
    protected void onResume() {
        super.onResume();
            if (session != null) {
                try{
                    session.onResume();
                }catch(Exception err){
                    Log.e(TAG, err.getMessage());
                }
                
            }
    }

    @Override
    protected void onStart() {
        super.onStart();
        Log.d(TAG, "onStart");
    }

    @Override
    protected void onStop() {
        super.onStop();
        Log.d(TAG, "onStop");

    }


     @Override
    protected void onDestroy(){
        super.onDestroy();
        AccuvCallConnectionManager.cleanUp();
        
    }
   
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults){
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        Log.i(TAG, "Request permissions results!!");
        EasyPermissions.onRequestPermissionsResult(requestCode,permissions, grantResults, this);
    }

    @Override
    public void onPermissionsGranted(int requestCode, List<String> list){
        Log.i(TAG, "Permissions granted!!");
        if(requestCode == RC_VIDEO_APP_PERM){
            Log.i(TAG, "Now to connect to open tok");
            checkPermissionsThenContinue();
        }
    }

    @Override
    public void onPermissionsDenied(int requestCode, List<String> list){
        Log.i(TAG, "Permissions denied!!");
        if(requestCode == RC_VIDEO_APP_PERM){
                ///show popup explaining those permissions are needed if want to try again or not
        }
    }

    private void checkPermissionsThenContinue(){
        if(EasyPermissions.hasPermissions(this, perms)){

            Log.i(TAG, "Permissions has been granted");
            //if we have all the permissions needed then connect to openTok
            connectToOpenTok();

        }else{
            EasyPermissions.requestPermissions(this, getApplicationContext().getApplicationInfo().name + " app needs access to your camera and mic in order to receive video calls!", RC_VIDEO_APP_PERM, perms);
        }
    }

    private void connectToOpenTok(){
        Log.i(TAG, "Connecting to open tok");
        ShowLoader(true);
        
        session = new Session.Builder(this, apiKey, sessionId).build();
        session.setSessionListener(this);
        session.connect(token);
       
    }

    private void LoadLayouts(){

        RelativeLayout mainLayout = new RelativeLayout(this);
        RelativeLayout.LayoutParams mainLayoutParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.FILL_PARENT, ViewGroup.LayoutParams.FILL_PARENT);
        mainLayout.setLayoutParams(mainLayoutParams);
        

        buttonsContainer = new LinearLayout(this);
        RelativeLayout.LayoutParams buttonsContainerLayoutParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        buttonsContainerLayoutParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        buttonsContainerLayoutParams.addRule(RelativeLayout.CENTER_HORIZONTAL);
        buttonsContainer.setLayoutParams(buttonsContainerLayoutParams);
        buttonsContainer.setOrientation(LinearLayout.HORIZONTAL);
        
        subscriberViewContainer = new RelativeLayout(this);
        RelativeLayout.LayoutParams subscriberLayoutParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,ViewGroup.LayoutParams.MATCH_PARENT);
        subscriberViewContainer.setLayoutParams(subscriberLayoutParams);

        publisherViewContainer = new FrameLayout(this);
        RelativeLayout.LayoutParams publisherLayoutParams = new RelativeLayout.LayoutParams( (getResources().getDisplayMetrics().widthPixels / 3), (getResources().getDisplayMetrics().heightPixels / 4));
        publisherLayoutParams.setMargins(16,16,16,16);
        publisherLayoutParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        publisherLayoutParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
        publisherViewContainer.setLayoutParams(publisherLayoutParams);
        
        ImageButton hideShowCameraButton = generateButton("camera_on");
        ImageButton muteUnmutebutton = generateButton("unmute_mic");
        ImageButton endCallButton = generateButton("end_call");
        ImageButton frontRearCameraButton = generateButton("rear_camera");
        
        buttonsContainer.addView(hideShowCameraButton);
        buttonsContainer.addView(muteUnmutebutton);
        buttonsContainer.addView(endCallButton);
        buttonsContainer.addView(frontRearCameraButton);

        loader = new ProgressBar(this);
        RelativeLayout.LayoutParams pbLayoutParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,ViewGroup.LayoutParams.WRAP_CONTENT);
        pbLayoutParams.addRule(RelativeLayout.CENTER_HORIZONTAL);
        pbLayoutParams.addRule(RelativeLayout.CENTER_VERTICAL);
        loader.setLayoutParams(pbLayoutParams);

        cmTimer = new Chronometer(this);
        RelativeLayout.LayoutParams cmTimerLayoutParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,ViewGroup.LayoutParams.WRAP_CONTENT);
        cmTimerLayoutParams.addRule(RelativeLayout.CENTER_HORIZONTAL);
        cmTimerLayoutParams.addRule(RelativeLayout.ALIGN_TOP);
        cmTimer.setLayoutParams(cmTimerLayoutParams);
        cmTimer.setTextSize(20);
        cmTimer.setTextColor(Color.WHITE);
       

        mainLayout.addView(cmTimer);
        mainLayout.addView(loader);
        mainLayout.addView(subscriberViewContainer);
        mainLayout.addView(publisherViewContainer);
        mainLayout.addView(buttonsContainer);
        publisherViewContainer.bringToFront();
        buttonsContainer.bringToFront();
        loader.bringToFront();
        loader.setVisibility(View.VISIBLE);
        cmTimer.bringToFront();

        setContentView(mainLayout);
        Log.i(TAG, "Layouts loaded");
    }

    private void ShowLoader(boolean isVisible){
        if(isVisible) loader.setVisibility(View.VISIBLE);
        else loader.setVisibility(View.GONE);
    }
    private ImageButton generateButton(String imageName){
        GradientDrawable shape = new GradientDrawable();
        shape.setCornerRadius(8);
        ImageButton btn = new ImageButton(this);
        btn.setBackgroundDrawable(shape);
        btn.setImageResource(getResources().getIdentifier(imageName,"drawable",getPackageName()));
        btn.setTag(imageName);
        btn.setOnClickListener(btnOnClick);

        LinearLayout.LayoutParams buttonLayoutParam = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT); 
        buttonLayoutParam.setMargins(16,16,16,16);
        btn.setLayoutParams(buttonLayoutParam);
        return btn;
    }

    private View.OnClickListener btnOnClick = new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                ShowLoader(true);
                ImageButton btn = (ImageButton) v;
                String img = (String) v.getTag();
                Log.i(TAG, " image on the pressed button " + img);
                String newImg = "";
                switch (img) {
                    case "no_camera":
                    case "camera_on":{
                        newImg = ("no_camera".equalsIgnoreCase(img) ? "camera_on" : "no_camera");
                        if(publisher != null){
                            if("camera_on".equalsIgnoreCase(img)) publisher.setPublishVideo(false);
                            else publisher.setPublishVideo(true);
                        }
                    }break;
                    case "mute_mic":
                    case "unmute_mic":{
                        newImg = ( "mute_mic".equalsIgnoreCase(img) ? "unmute_mic" : "mute_mic");                        
                        if("unmute_mic".equalsIgnoreCase(img)) AccuvCallConnectionManager.mute();
                        else AccuvCallConnectionManager.unmute();

                    }break;
                    case "rear_camera":
                    case "front_camera":{
                        newImg = ( "rear_camera".equalsIgnoreCase(img) ? "front_camera" : "rear_camera");
                        if(publisher != null) publisher.cycleCamera();
                    }break;
                    case "end_call":{
                        newImg = "end_call";
                        AccuvCallConnectionManager.endApiCall(END_API_CALL_REASON_CLIENT);
                    }break;

                }

                btn.setImageResource(getResources().getIdentifier( newImg,"drawable",getPackageName()));
                btn.setTag(newImg);
                ShowLoader(false);
            }
        };

    @Override
    public void onConnected(Session msession){
        Log.i(TAG, "Session Connected");
        try{
            AccuvCallConnectionManager.logCallStatistics(
            AccuvCallConnectionManager.readSettingValue(AccuvCallConnectionManager.API_ENDPOINT_SETTING_NAME) + "/ChatEngine/LogCall?projectId="+projectId, 
            AccuvCallConnectionManager.readSettingValue(AccuvCallConnectionManager.USER_ID_SETTING_NAME), 
            AccuvCallConnectionManager.readSettingValue(AccuvCallConnectionManager.DEVICE_ID_SETTING_NAME), 
            callId, fromUser, fromDevice, fromDevicePlatform, workOrderSid, roomId, false, null
            ).join();
        }catch(Exception err){
            Log.e(TAG, err.getMessage());
        }
        

        if("200".equalsIgnoreCase( AccuvCallConnectionManager.callLogResult ) ){
                publisher = new Publisher.Builder(this).build();
                publisher.setPublisherListener(this);
                RelativeLayout.LayoutParams publisherLayoutParams = new RelativeLayout.LayoutParams(publisherViewContainer.getWidth(),publisherViewContainer.getHeight());
                publisherViewContainer.addView(publisher.getView(), publisherLayoutParams);
                session.publish(publisher);
                
                if (publisher.getView() instanceof GLSurfaceView) {
                    ((GLSurfaceView)publisher.getView()).setZOrderOnTop(true);
                        
                }

        }else{
            ShowQuickMessage("Another device already answer the call.", getApplicationContext());
            AccuvCallConnectionManager.endApiCall(false, null);
        }
        
    }

    @Override
    public void onDisconnected(Session msession){
        Log.i(TAG, "Session Disconnected");
    }

    @Override
    public void onStreamReceived(Session msession, Stream stream){
        Log.i(TAG, "Stream Received");

        //if(subscriber == null){
            subscriber = new Subscriber.Builder(this, stream).build();
            session.subscribe(subscriber);
            //View v = subscriber.getView();
            RelativeLayout.LayoutParams subscriberLayoutParams = new RelativeLayout.LayoutParams(getResources().getDisplayMetrics().widthPixels,getResources().getDisplayMetrics().heightPixels);
            //v.setLayoutParams(subscriberLayoutParams);
            subscriberViewContainer.addView(subscriber.getView(),subscriberLayoutParams);
            ShowLoader(false);
            cmTimer.start();

        //}
    }

    @Override
    public void onStreamDropped(Session msession, Stream stream){
        Log.i(TAG, "Stream Dropped");

        if(subscriber != null){
            subscriber = null;
            subscriberViewContainer.removeAllViews();
            AccuvCallConnectionManager.endApiCall(END_API_CALL_REASON_ORIGIN);
        }
    }

    @Override
    public void onError(Session msession, OpentokError err){
        Log.i(TAG, "Session error : "+ err.getMessage());
    }

    @Override
    public void onStreamCreated(PublisherKit publisherKit, Stream mstream){
        Log.i(TAG, "Publisher Stream Created");
    }

    @Override
    public void onStreamDestroyed(PublisherKit publisherKit, Stream mstream){
        Log.i(TAG, "Publisher Stream Destroyed");
    }
 
    @Override
    public void onError(PublisherKit publisherKit, OpentokError err){
        Log.i(TAG, "Publisher error : "+ err.getMessage());
    } 

    @Override
    public void onEndCall(){
        if(session != null){
            if(subscriber != null) session.unsubscribe(subscriber);
            if(publisher != null) session.unpublish(publisher);
            session.disconnect();
            session = null;
            subscriber = null;
            publisher = null;
        }
        Log.i(TAG, "Running on end call frorm activity");        
        finish();
        moveTaskToBack(true);
        System.exit(0);

    }

    public static void ShowQuickMessage(String msg, Context c){
        Toast toast=Toast.makeText(c,msg,Toast.LENGTH_LONG);
        toast.show();
    }


}
