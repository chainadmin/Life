import { Platform } from 'react-native';

export type RepeatType='One Time'|'Daily'|'Weekly'|'Monthly'|'Yearly'|'Custom';
export async function scheduleTaskNotification(title:string,date:string,repeat:RepeatType='One Time'){
  const Notifications=await import('expo-notifications');
  const permission=await Notifications.requestPermissionsAsync();
  if(permission.status!=='granted') return undefined;
  if(Platform.OS==='android') await Notifications.setNotificationChannelAsync('tasks',{name:'Task reminders',importance:Notifications.AndroidImportance.HIGH});
  const target=new Date(date);
  const seconds=Math.max(1,Math.round((target.getTime()-Date.now())/1000));
  const repeats=repeat!=='One Time';
  return Notifications.scheduleNotificationAsync({content:{title:'Task reminder',body:title,data:{kind:'task'}},trigger:{type:Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,seconds:repeats?repeat==='Daily'?86400:repeat==='Weekly'?604800:2592000:seconds,repeats,channelId:'tasks'}});
}
export async function cancelTaskNotification(id?:string){if(id){const Notifications=await import('expo-notifications');await Notifications.cancelScheduledNotificationAsync(id);}}
