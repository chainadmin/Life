import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { WidgetData, WidgetPreferences } from '../types';
export type WidgetSize='small'|'medium'|'large';
const time=(value:string|null)=>value?new Date(value).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):null;
const age=(value:string)=>{const minutes=Math.max(0,Math.round((Date.now()-new Date(value).getTime())/60000));return minutes<1?'Updated now':`Updated ${minutes} min ago`;};
export function WidgetCard({data,preferences,size,onLink}:{data:WidgetData;preferences:WidgetPreferences;size:WidgetSize;onLink?:(url:string)=>void}){
  const minimal=preferences.type==='minimal'; const visible=(section:string)=>preferences.type==='dailyBrief'||preferences.type==='minimal'||preferences.type===section;
  return <View style={[s.card,sizes[size]]}>
    {preferences.showGreeting&&!minimal?<Text style={s.greeting}>{data.greeting}</Text>:null}
    <View style={[s.content,size!=='small'&&s.columns]}>
      {data.money.enabled&&visible('money')?<Pressable style={s.section} onPress={()=>onLink?.('app://money')}><Text style={s.big}>{preferences.privacyMode?'Budget':data.money.availableToday==null?'—':`$${Math.round(data.money.availableToday)}`}</Text><Text style={s.detail}>{minimal?'Today':data.money.text.replace(/^\$[\d,]+\s*/,'')}</Text></Pressable>:null}
      {data.calendar.enabled&&visible('calendar')?<Pressable style={s.section} onPress={()=>onLink?.('app://calendar')}><Text style={s.big}>{data.calendar.eventCount} {minimal?'Events':data.calendar.eventCount===1?'event':'events'}</Text>{!minimal?<Text style={s.detail}>{data.calendar.nextEventTime?`Next${preferences.privacyMode?' event':''} at ${time(data.calendar.nextEventTime)}`:'Calendar is clear'}</Text>:null}</Pressable>:null}
      {data.email.enabled&&visible('email')&&!minimal?<Pressable style={s.section} onPress={()=>onLink?.('app://email')}><Text style={s.big}>{data.email.attentionCount} {data.email.attentionCount===1?'message':'messages'}</Text><Text style={s.detail}>may need attention</Text></Pressable>:null}
      {data.tasks.enabled&&visible('tasks')?<Pressable style={s.section} onPress={()=>onLink?.('app://tasks')}><Text style={s.big}>{data.tasks.dueToday} {minimal?'Tasks':data.tasks.dueToday===1?'task':'tasks'}</Text>{!minimal?<Text style={s.detail}>due today{data.tasks.overdue?` · ${data.tasks.overdue} overdue`:''}</Text>:null}</Pressable>:null}
    </View>
    <Text style={s.updated}>{age(data.updatedAt)}</Text>
  </View>;
}
const sizes={small:{width:164,minHeight:164},medium:{width:342,minHeight:164},large:{width:342,minHeight:350}};
const s=StyleSheet.create({card:{backgroundColor:'#FBFAF6',borderRadius:24,padding:18,justifyContent:'space-between',shadowColor:'#17231D',shadowOpacity:.12,shadowRadius:14,shadowOffset:{width:0,height:5}},greeting:{fontSize:19,fontWeight:'800',color:colors.ink,marginBottom:10},content:{flex:1,gap:11},columns:{flexDirection:'row',flexWrap:'wrap',alignContent:'flex-start'},section:{minWidth:125,flexGrow:1,paddingRight:10},big:{fontSize:20,fontWeight:'800',color:colors.ink},detail:{fontSize:13,color:colors.muted,marginTop:2},updated:{fontSize:11,color:colors.muted,marginTop:10}});
