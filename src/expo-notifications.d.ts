declare module 'expo-notifications' {
  export const AndroidImportance:{HIGH:number};
  export const SchedulableTriggerInputTypes:{TIME_INTERVAL:'timeInterval'};
  export function requestPermissionsAsync():Promise<{status:string}>;
  export function setNotificationChannelAsync(id:string,channel:object):Promise<unknown>;
  export function scheduleNotificationAsync(request:{content:object;trigger:object}):Promise<string>;
  export function cancelScheduledNotificationAsync(id:string):Promise<void>;
}
