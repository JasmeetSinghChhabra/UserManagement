/*
Created By Angel Robles
*/
package com.accuv.callpushmonitor;

import android.app.ActivityManager;
import android.content.pm.ApplicationInfo;
import android.content.Intent;
import android.content.ComponentName;
import android.content.Context;
import android.graphics.drawable.Icon;
import android.os.Bundle;
import android.telecom.Connection;
import android.telecom.ConnectionRequest;
import android.telecom.ConnectionService;
import android.telecom.DisconnectCause;
import android.telecom.PhoneAccountHandle;
import android.telecom.PhoneAccount;
import android.telecom.StatusHints;
import android.telecom.TelecomManager;
import android.telecom.VideoProfile;
import android.media.AudioManager;

import android.os.Handler;
import android.net.Uri;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import android.util.Log;
import java.util.List;
import java.util.Iterator;
import com.google.firebase.messaging.RemoteMessage;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import android.content.SharedPreferences;
import android.app.AlarmManager;
import android.app.PendingIntent;
import java.text.DateFormat;
import android.os.Handler;
import android.os.SystemClock;
import android.os.Looper;
import org.json.JSONObject;
import android.content.SharedPreferences;
import java.io.DataOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;




public class AccuvCallConnectionManager extends ConnectionService {

    private static String TAG = AccuvCallConnectionManager.class.getSimpleName();
    private static String PACKAGE_NAME = "";
    private static Connection conn;
    private static Context context;
    private static Icon icon;
    private static String appName;
    private static HashMap<String,String> callData;
    private static Class cordovaCall = null;
    private static AccuvCallConnectionManagerListener callListener;
    private static long ringingTimeout;
    private static AlarmManager aManager;
    private static Handler aHandler;
    private static boolean pickedUpCall;
    private static boolean callEngaged;
    public static final String API_ENDPOINT_SETTING_NAME = "accuv_api_endpoint";
    public static final String USER_ID_SETTING_NAME = "accuv_user_id";
    public static final String DEVICE_ID_SETTING_NAME = "accuv_device_id";
    public static final String END_API_CALL_REASON_NOANSWER = "ended by callee no answer";
    public static String callLogResult;

    public static void setIcon(Icon ic){
        icon = ic;
    }

    public static void setAppName(String aName){
        appName = aName;
    }
    public static void setContext(Context c){
        context = c;
        PACKAGE_NAME = c.getPackageName();
         appName = getApplicationName();
         loadParams();
         if(aManager == null) aManager = (AlarmManager) c.getSystemService(c.ALARM_SERVICE);
         if(aHandler == null) aHandler = new Handler(Looper.getMainLooper());

    }

    public static Boolean registerPhoneAcc(){
        Boolean result = false;
        try{    
                TelecomManager tm = (TelecomManager)context.getSystemService(context.TELECOM_SERVICE);

                PhoneAccountHandle handle =new PhoneAccountHandle(new ComponentName(PACKAGE_NAME,getCallNameClassHandle()),appName);
                PhoneAccount.Builder builder = new PhoneAccount.Builder(handle, appName);
                if(android.os.Build.VERSION.SDK_INT >= 26) {
                    Log.i(TAG, "version 26 and above");
                  builder.setCapabilities(PhoneAccount.CAPABILITY_SELF_MANAGED);
                }
                if(android.os.Build.VERSION.SDK_INT >= 23) {
                     Log.i(TAG, "version 23 and above");
                  builder.setCapabilities(PhoneAccount.CAPABILITY_CALL_PROVIDER | PhoneAccount.CAPABILITY_CONNECTION_MANAGER| PhoneAccount.CAPABILITY_VIDEO_CALLING );

                } 
                
                 PhoneAccount phoneAccount= builder.build();
                 tm.registerPhoneAccount(phoneAccount); 

                
                result = true;
        }catch(Exception err){
              Log.e(TAG, err.getMessage());  
        }
        return result;
        

    }
    static String getMainActivityName(){
        return PACKAGE_NAME+".MainActivity";
    }
    static void loadParams(){
        Log.i(TAG, AccuvCallConnectionManager.class.getPackage().getName());
        SharedPreferences prefs = context.getSharedPreferences(AccuvCallConnectionManager.class.getPackage().getName(),
          Context.MODE_PRIVATE);
      ringingTimeout = prefs.getLong("ringingTimeoutSecs",40);
      Log.i(TAG, "ringing timeout = "+ringingTimeout);
     
    }

    @Override
    public Connection onCreateIncomingConnection(final PhoneAccountHandle connectionManagerPhoneAccount, final ConnectionRequest request) {
        final Connection connection = new Connection() {
            
            @Override
            public void onAnswer() {
                Log.i(TAG, "Answering the call");
                pickedUpCall = true;
                this.setVideoState(VideoProfile.STATE_BIDIRECTIONAL);
                this.setActive();
                
                //not in cordova context
                if(!AccuvCallPushMonitor.isForeground()){
                    Intent intent = new Intent(context, VideoChatActivity.class);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    Bundle bToSend = new Bundle();
                    for(Map.Entry<String,String> entry : callData.entrySet()){
                        bToSend.putString(entry.getKey(), entry.getValue());
                    }
                    intent.putExtras(bToSend);
                    aHandler.postAtTime(new Runnable(){
                        @Override
                        public void run(){
                           context.startActivity(intent);
                        }
                    }, SystemClock.uptimeMillis() + 1500);

                } 
                else{
                     Intent intent = new Intent(AccuvCallPushMonitor.getCordova().getActivity().getApplicationContext(), AccuvCallPushMonitor.getCordova().getActivity().getClass());
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    intent.putExtra("waiting-for-call-answer", true);
                    try{
                        logCallStatistics(false, null).join();
                    }catch(Exception err){
                        Log.e(TAG, err.getMessage());
                    }
                    if("200".equalsIgnoreCase( callLogResult) ){
                         AccuvCallPushMonitor.getCordova().getActivity().getApplicationContext().startActivity(intent);
                         runCallback("answer");
                    }else{
                        endApiCall(false, null);
                    }
                   
                }
               
                
                Log.i(TAG, "call answered intent created!");
            }

            @Override
            public void onReject() {
                DisconnectCause cause = new DisconnectCause(DisconnectCause.REJECTED);
                this.setDisconnected(cause);
                this.destroy();
                conn = null;callEngaged = false;
                if(callListener != null) callListener.onEndCall();
                runCallback("reject");
               
            }

            @Override
            public void onAbort() {
                super.onAbort();
                callEngaged = false;
            }

            @Override
            public void onDisconnect() {
                DisconnectCause cause = new DisconnectCause(DisconnectCause.LOCAL);
                this.setDisconnected(cause);
                Log.i(TAG, "destroying call connection");
                conn = null;
                this.destroy();
                AccuvCallConnectionManager.endApiCall(VideoChatActivity.END_API_CALL_REASON_CLIENT);
                
            }
        };
        connection.setAddress(Uri.parse(request.getExtras().getString("from")), TelecomManager.PRESENTATION_ALLOWED);
        if(icon != null) {
            StatusHints statusHints = new StatusHints((CharSequence)"", icon, new Bundle());
            connection.setStatusHints(statusHints);
        }
        conn = connection;
        return connection;
    }

    @Override
    public Connection onCreateOutgoingConnection(PhoneAccountHandle connectionManagerPhoneAccount, ConnectionRequest request) {
        final Connection connection = new Connection() {
            @Override
            public void onAnswer() {
                super.onAnswer();
            }

            @Override
            public void onReject() {
                super.onReject();
            }

            @Override
            public void onAbort() {
                super.onAbort();
            }

            @Override
            public void onDisconnect() {
                DisconnectCause cause = new DisconnectCause(DisconnectCause.LOCAL);
                this.setDisconnected(cause);
                this.destroy();
                conn = null;
            }

            @Override
            public void onStateChanged(int state) {
              if(state == Connection.STATE_DIALING) {
                final Handler handler = new Handler();
                handler.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        Intent intent = new Intent();
                        intent.setComponent(new ComponentName(context, getMainActivityName()));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP);
                        context.startActivity(intent);
                    }
                }, 500);
              }
            }
        };
        connection.setAddress(Uri.parse(request.getExtras().getString("to")), TelecomManager.PRESENTATION_ALLOWED);
        if(icon != null) {
            StatusHints statusHints = new StatusHints((CharSequence)"", icon, new Bundle());
            connection.setStatusHints(statusHints);
        }
        connection.setDialing();
        conn = connection;
       
        return connection;
    }

     public static String getApplicationName() {
      ApplicationInfo applicationInfo = context.getApplicationInfo();
      int stringId = applicationInfo.labelRes;
      return stringId == 0 ? applicationInfo.nonLocalizedLabel.toString() : context.getString(stringId);
    }

    static String getCallNameClassHandle(){
        
        return  AccuvCallConnectionManager.class.getName();
    }

    static boolean isCordovaCallPluginHere(){
       if(cordovaCall == null){
         try{
            cordovaCall = Class.forName("com.dmarc.cordovacall.MyConnectionService");

            }catch(Exception err){
                Log.e(TAG, err.getMessage());
            }
       } 
       
        return false;
    }

    public static void receiveCall(String callTitle) {
        if(!checkCallPermission()) return;
        if(!checkCallPermission()) return;
        TelecomManager tm = (TelecomManager)context.getSystemService(context.TELECOM_SERVICE);
        PhoneAccountHandle handle =new PhoneAccountHandle(new ComponentName(PACKAGE_NAME,getCallNameClassHandle()),appName);
        Log.i(TAG, "Trying to initiate the call");
        Log.i(TAG, appName);

        Bundle inCall = new Bundle();
        inCall.putParcelable(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE,handle);
        inCall.putInt(TelecomManager.EXTRA_START_CALL_WITH_VIDEO_STATE, VideoProfile.STATE_BIDIRECTIONAL);
        inCall.putString("from",callTitle);
        if(callEngaged != true) {
            callEngaged = true;
            tm.addNewIncomingCall(handle, inCall);
        }
        watchRingingCall();
        
    }

    static JSONObject objFromUI;
    public static void receiveCall(String callTitle, JSONObject obj){
            objFromUI = obj;
            extraBundle = null;
            receiveCall(callTitle);
    }
    
    

    public static boolean checkCallPermission() {
        Log.i(TAG, "checking permissions to use the telecom kit");
        TelecomManager tm = (TelecomManager)context.getSystemService(context.TELECOM_SERVICE);
        PhoneAccountHandle handle =new PhoneAccountHandle(new ComponentName(PACKAGE_NAME,getCallNameClassHandle()),appName);
        PhoneAccount currentPhoneAccount = tm.getPhoneAccount(handle);
        return currentPhoneAccount != null && currentPhoneAccount.isEnabled();
    }
    

    static boolean isMyServiceRunning(Class<?> serviceClass) {
        ActivityManager manager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        for (ActivityManager.RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
            if (serviceClass.getName().equals(service.service.getClassName())) {
                return true;
            }
        }
        return false;
    } 
    public static Bundle extraBundle;
    public static void onMessageReceived(RemoteMessage remoteMessage) {
        callData = new HashMap<String,String>();
        Map<String, String> data = remoteMessage.getData();
        String message = (data != null && data.containsKey("message") ? data.get("message") : "");
        Log.i(TAG, "RECECIVING CALL From: " + remoteMessage.getFrom() + " messaage:  "+message );
        callData.putAll(data);
        if(message != null && message != "") receiveCall(message);
    }
    public static void onMessageReceived(RemoteMessage remoteMessage, Bundle extra) {
        extraBundle = extra;
        objFromUI = null;
       onMessageReceived(remoteMessage);
    }
    public static Thread logCallStatistics(boolean isend, String endReason){
            String callId = "";
            String fromUser = "";
            String fromDevice = "";
            String fromDevicePlatform = "";
            String workOrderSid = "";
            String roomId = "";
            String auxParams = null;
            String projectId = "";
            try{
            if(objFromUI != null){
                if(objFromUI.has("additionalData")){
                    JSONObject addData = objFromUI.getJSONObject("additionalData");
                    if(addData.has("auxParameters")){
                        auxParams = addData.getString("auxParameters");
                    }
                    if(addData.has("projectId")){
                        projectId = addData.getString("projectId");
                    }
                }
            }else if(extraBundle != null){
                if(extraBundle.containsKey("auxParameters")){
                        auxParams = extraBundle.getString("auxParameters");
                }

                if(extraBundle.containsKey("projectId")){
                        projectId = extraBundle.getString("projectId");
                }
            }
            }catch(Exception err){
                Log.e(TAG, err.getMessage());
            }
            Log.i(TAG, "Aux Params ");
            Log.i(TAG,auxParams );
            if(auxParams != null)
            try{
                        JSONObject obj = new JSONObject(auxParams);
                        
                        if(obj.has("callid")) callId = obj.getString("callid");
                        if(obj.has("fromDevice")) fromDevice = obj.getString("fromDevice");
                        if(obj.has("workOrderSid")) workOrderSid = obj.getString("workOrderSid");
                        if(obj.has("workorderSid")) workOrderSid = obj.getString("workorderSid");
                        if(obj.has("fromDevicePlatform")) fromDevicePlatform = obj.getString("fromDevicePlatform");
                        if(obj.has("roomId")) roomId = obj.getString("roomId");
                        if(obj.has("from")) fromUser = obj.getString("from");

                    Log.i(TAG, "Parsing the aux parameters ");
            }catch(Exception err){
                        Log.e(TAG, err.getMessage());
            }

            return logCallStatistics(readSettingValue(API_ENDPOINT_SETTING_NAME) + "/ChatEngine/LogCall?projectId="+projectId, 
            readSettingValue(USER_ID_SETTING_NAME), 
            readSettingValue(DEVICE_ID_SETTING_NAME),
            callId,
            fromUser,
            fromDevice,
            fromDevicePlatform,
            workOrderSid,
            roomId,
            isend,
            endReason
            );
    }
    public static boolean endApiCall(boolean logCall, String endReason){
        boolean bresult = false;
        try{
             DisconnectCause cause = new DisconnectCause(DisconnectCause.REJECTED);
         if(conn != null) conn.setDisconnected(cause);
         if(conn != null) conn.destroy();
        conn = null;
        }catch(Exception err){
                Log.e(TAG, err.getMessage());
        }
        try{
        
        bresult = true; pickedUpCall = false;
        callEngaged = false;
         if(logCall){
            logCallStatistics(true, endReason);
        }
        if(callListener != null) callListener.onEndCall();
        runCallback("hangup");
        }catch(Exception err){
            Log.e(TAG, err.getMessage());
        }
        return bresult;

    }
    public static boolean endApiCall(String endReason){
        return endApiCall(true, endReason);
    }
    public static boolean isConnectionNull(){
        return conn == null;
    }

    public static void runCallback(String callbackName){
         if(AccuvCallPushMonitor.getCordova() != null){
                    ArrayList<CallbackContext> callbackContexts = AccuvCallPushMonitor.getCallbackContexts().get(callbackName);
                    if(callbackContexts != null)for (final CallbackContext callbackContext : callbackContexts) {
                        AccuvCallPushMonitor.getCordova().getThreadPool().execute(new Runnable() {
                            public void run() {

                                //to send the data when we answer
                                JSONObject jresult = new JSONObject();
                                 if(extraBundle != null){
                                     
                                     for (String bk:extraBundle.keySet()) {
                                            try{
                                                jresult.put(bk, extraBundle.get(bk) );
                                            }catch(Exception err ){
                                                Log.e(TAG, err.getMessage());
                                            }
                                        }

                                 }else if(objFromUI != null){ //this is coming from the UI when the app is in foreground
                                     jresult = objFromUI;
                                 } 
                                 

                                PluginResult result = extraBundle == null && objFromUI == null ? new PluginResult(PluginResult.Status.OK, "success" ) :  new PluginResult(PluginResult.Status.OK, jresult );
                                result.setKeepCallback(true);
                                try{
                                callbackContext.sendPluginResult(result);
                                //objFromUI = null;
                                //extraBundle = null;
                                }catch(Exception err ){
                                    Log.e(TAG, err.getMessage());
                                }
                            }
                        });
                    }
        }
    }

     public static void sendCall(String to) {
        Uri uri = Uri.fromParts("tel", to, null);
        Bundle callInfoBundle = new Bundle();
        callInfoBundle.putString("to",to);
        Bundle callInfo = new Bundle();
        PhoneAccountHandle handle =new PhoneAccountHandle(new ComponentName(PACKAGE_NAME,getCallNameClassHandle()),appName);
        callInfo.putParcelable(TelecomManager.EXTRA_OUTGOING_CALL_EXTRAS,callInfoBundle);
        callInfo.putParcelable(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, handle);
        callInfo.putBoolean(TelecomManager.EXTRA_START_CALL_WITH_VIDEO_STATE, true);
        TelecomManager tm = (TelecomManager)context.getSystemService(context.TELECOM_SERVICE);
        tm.placeCall(uri, callInfo);
    }

    public static void mute() {
        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        audioManager.setMicrophoneMute(true);
    }

    public static void unmute() {
        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        audioManager.setMicrophoneMute(false);
    }

    public static void speakerOn() {
        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        audioManager.setSpeakerphoneOn(true);
    }

    public static void speakerOff() {
        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        audioManager.setSpeakerphoneOn(false);
    }

    public static void setListener(AccuvCallConnectionManagerListener mlistener){
        callListener = mlistener;
    }

    public interface AccuvCallConnectionManagerListener{
        void onEndCall();
    }

    public static void watchRingingCall(){
        aHandler.postAtTime(new Runnable(){
            @Override
            public void run(){
                if(!pickedUpCall){
                    endApiCall(END_API_CALL_REASON_NOANSWER);
                }
            }
        }, SystemClock.uptimeMillis() + (ringingTimeout * 1000));
    }

    public static void cleanUp(){
        callEngaged = false;
        pickedUpCall = false;
        objFromUI = null;
        extraBundle = null;

    }

static SharedPreferences sharedPref;
    public static void configCallLog(String baseApiEndpoint, String UserId, String DeviceId){
        if(sharedPref == null)  sharedPref =  context.getSharedPreferences(PACKAGE_NAME +"."+ getCallNameClassHandle(), Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();
        editor.putString(API_ENDPOINT_SETTING_NAME,baseApiEndpoint);
        editor.putString(USER_ID_SETTING_NAME,UserId);
        editor.putString(DEVICE_ID_SETTING_NAME,DeviceId);
        editor.apply();
        Log.i(TAG, "Configuring call log " + baseApiEndpoint + " " + UserId + " " + DeviceId);
    }

    public static String readSettingValue(String settingName){
        String result = "";
        if(sharedPref == null)  sharedPref = context.getSharedPreferences(PACKAGE_NAME +"."+ getCallNameClassHandle(), Context.MODE_PRIVATE);
        if(sharedPref.contains(settingName)){
            result= sharedPref.getString(settingName, "notgood");
       }
       return result;
    }

        public static Thread logCallStatistics(String urlAddress, String UserId, String DeviceId, String callId, String fromUser, String fromDevice, String fromDevicePlatform, String workOrderSid, String roomId, boolean isEnd, String endReason ) {
        callLogResult = null;
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    URL url = new URL(urlAddress);
                    HttpURLConnection httpconn = (HttpURLConnection) url.openConnection();
                    httpconn.setRequestMethod("POST");
                    httpconn.setRequestProperty("Content-Type", "application/json;charset=UTF-8");
                    httpconn.setRequestProperty("Accept", "application/json");
                    httpconn.setDoOutput(true);
                    httpconn.setDoInput(true);

                    JSONObject jsonParam = new JSONObject();
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

                    Log.i("JSON", jsonParam.toString());
                    DataOutputStream os = new DataOutputStream(httpconn.getOutputStream());
                    //os.writeBytes(URLEncoder.encode(jsonParam.toString(), "UTF-8"));
                    os.writeBytes(jsonParam.toString());

                    os.flush();
                    os.close();
                    callLogResult = String.valueOf(httpconn.getResponseCode());
                    Log.i("STATUS", String.valueOf(httpconn.getResponseCode()));
                    Log.i("MSG", httpconn.getResponseMessage());

                    httpconn.disconnect();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });

        thread.start();
        return thread;

    } 
}
