import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import { WidgetData } from '../types';

export const WIDGET_DATA_KEY='widget:data:v1';

// An EAS development/production build can register this boundary. Expo Go safely
// falls back to AsyncStorage, which is also the preview's source of truth.
const nativeBridge=NativeModules.MyAssistantWidgetBridge as undefined|{updateWidgetData:(json:string)=>Promise<void>|void;reloadWidgets:()=>Promise<void>|void};

export const WidgetBridge={
  async updateWidgetData(data:WidgetData){
    const json=JSON.stringify(data);
    await AsyncStorage.setItem(WIDGET_DATA_KEY,json);
    if(nativeBridge) await nativeBridge.updateWidgetData(json);
  },
  async reloadWidgets(){ if(nativeBridge) await nativeBridge.reloadWidgets(); },
  async readWidgetData(){const value=await AsyncStorage.getItem(WIDGET_DATA_KEY);return value?JSON.parse(value) as WidgetData:null;},
};
