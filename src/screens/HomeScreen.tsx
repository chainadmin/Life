import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { card, colors } from '../theme';
import { AssistantPersonality, CalendarEvent, EmailMessage, IntegrationStatus, MoneySummary, Task } from '../types';
import { WidgetDataService } from '../services/WidgetDataService';

type BriefData = {
  status: IntegrationStatus;
  events: CalendarEvent[];
  emails: EmailMessage[];
  tasks: Task[];
};

const disconnectedStatus: IntegrationStatus = {
  calendar: { connected: false, needsReconnect: false },
  gmail: { connected: false, needsReconnect: false },
};

const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const plural = (count: number, singular: string, pluralWord = `${singular}s`) => `${count} ${count === 1 ? singular : pluralWord}`;

function needsReply(message: EmailMessage) {
  const text = `${message.subject} ${message.snippet}`.toLowerCase();
  const automated = /no-?reply|newsletter|digest|receipt|statement|notification|sale|offer|promotion/.test(`${message.from} ${text}`.toLowerCase());
  return !automated && (/\?|please|could you|can you|let me know|reply|confirm|approval|review/.test(text));
}

function assistantSummary(data: BriefData, personality: AssistantPersonality = 'friendly') {
  const { events, emails, status, tasks } = data;
  const replyCount = emails.filter(needsReply).length;
  const due=tasks.filter(t=>!t.completed&&t.dueDate&&new Date(t.dueDate).toDateString()===new Date().toDateString());
  if(due.length) {
    const count=due.length===1?'one task':`${due.length} tasks`; const names=due.slice(0,3).map(t=>t.title).join(' • ');
    if(personality==='direct') return `${count[0].toUpperCase()+count.slice(1)} due today. ${names}`;
    if(personality==='professional') return `You have ${count} scheduled for completion today. ${names}`;
    if(personality==='calm') return `You have ${count} left today. You can work through them steadily. ${names}`;
    if(personality==='encouraging') return `You have ${count} left today. Start with one achievable next step. ${names}`;
    if(personality==='playful') return `You have ${count} left today—time to give that list a little trim. ${names}`;
    return `You’ve got ${count} left today. Let’s take them one at a time. ${names}`;
  }
  if (!status.calendar.connected && !status.gmail.connected) return 'Your task list is clear today. Connect Calendar or Gmail when you want a more personal brief.';
  if (status.calendar.connected && status.gmail.connected) {
    if (!events.length && !replyCount) return 'Today looks clear. Nothing urgent is standing out, so you have room to focus on what matters to you.';
    const dayShape = events.length > 3 ? 'fairly busy' : events.length ? 'pretty manageable' : 'mostly open';
    const emailText=replyCount===1?'one email that may need a response':`${replyCount} emails that may need responses`;
    if(personality==='direct') return `${plural(events.length, 'appointment')} today. ${emailText}.`;
    if(personality==='professional') return `You have ${plural(events.length, 'scheduled appointment')} today and ${emailText}.`;
    if(personality==='friendly') return `Today looks ${dayShape}. You’ve got ${plural(events.length, 'appointment')} and ${emailText}.`;
    return `Today looks ${dayShape}. You have ${plural(events.length, 'appointment')} and ${emailText}.`;
  }
  if (status.calendar.connected) return events.length ? `You have ${plural(events.length, 'appointment')} today. ${events.length < 3 ? 'There should still be time for other things.' : 'It may help to leave some breathing room between them.'}` : 'Your calendar is open today. You have room to decide what matters most.';
  return replyCount ? `${replyCount === 1 ? 'One email probably needs' : `${replyCount} emails may need`} a reply. The rest can likely wait.` : 'Your unread email looks manageable. Nothing obvious needs an immediate reply.';
}

export function HomeScreen({ navigation }: any) {
  const { profile, setProfile } = useAuth();
  const [brief, setBrief] = useState<BriefData>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const [money, setMoney] = useState<MoneySummary>();

  useEffect(() => {
    if (profile) return;
    AsyncStorage.getItem('session').then(async token => {
      try {
        const savedProfile = token === 'guest' ? JSON.parse((await AsyncStorage.getItem('guestProfile')) || 'null') : await api.getProfile();
        if (savedProfile) setProfile(savedProfile);
      } catch {
        // The brief remains useful without a profile.
      }
    });
  }, [profile, setProfile]);

  const loadBrief = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setNotice('');
    try {
      const status = await api.integrationStatus();
      const [eventsResult, emailsResult, tasksResult] = await Promise.allSettled([
        status.calendar.connected ? api.calendarToday() : Promise.resolve([]),
        status.gmail.connected ? api.gmailUnread() : Promise.resolve([]),
        api.getTasks(),
      ]);
      api.moneySummary().then(setMoney).catch(()=>setMoney(undefined));
      const events = eventsResult.status === 'fulfilled' ? eventsResult.value : [];
      const emails = emailsResult.status === 'fulfilled' ? emailsResult.value : [];
      if (eventsResult.status === 'rejected' || emailsResult.status === 'rejected') setNotice('Some connected information could not be refreshed. Your other details are still shown.');
      const tasks=tasksResult.status==='fulfilled'?tasksResult.value:[];
      setBrief({ status, events: [...events].sort((a, b) => +new Date(a.start) - +new Date(b.start)), emails, tasks });
    } catch {
      setBrief({ status: disconnectedStatus, events: [], emails: [], tasks: [] });
      setNotice('Your connected services could not be reached. Pull down to try again.');
    } finally {
      WidgetDataService.refresh().catch(()=>{});
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadBrief(); }, [loadBrief]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const replyEmails = useMemo(() => brief?.emails.filter(needsReply) ?? [], [brief]);
  const laterEmails = (brief?.emails.length ?? 0) - replyEmails.length;
  const firstEvent = brief?.events[0];
  const connected = brief?.status.calendar.connected || brief?.status.gmail.connected;

  const openRootScreen = (screen: 'CalendarAssistant' | 'EmailAssistant' | 'ConnectedServices') => navigation.getParent()?.navigate(screen);

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.page}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBrief(true)} tintColor={colors.green} />}
    >
      <View style={s.header}>
        <Text style={s.greeting}>{greeting}, {profile?.firstName || 'there'}</Text>
        <Text style={s.date}>{date}</Text>
        {loading ? <View style={s.loading}><ActivityIndicator color={colors.green} /><Text style={s.muted}>Putting your brief together…</Text></View> : <Text style={s.summary}>{assistantSummary(brief!, profile?.assistantPersonality)}</Text>}
      </View>

      {notice ? <Text style={s.notice}>{notice}</Text> : null}

      {!loading && <>
        <Section title="Tasks" icon="✓">
          {(()=>{const today=brief?.tasks.filter(t=>!t.completed&&t.dueDate&&new Date(t.dueDate).toDateString()===new Date().toDateString())||[];const overdue=brief?.tasks.filter(t=>!t.completed&&t.dueDate&&new Date(t.dueDate)<new Date()&&new Date(t.dueDate).toDateString()!==new Date().toDateString())||[];return <><Text style={s.primary}>{today.length} due today</Text><Text style={[s.detail,overdue.length>0&&{color:colors.danger}]}>{overdue.length} overdue</Text>{today.slice(0,3).map(t=><Text key={t.id} style={s.detail}>• {t.title}</Text>)}<Action label="View tasks" onPress={()=>navigation.navigate('Tasks')}/></>})()}
        </Section>
        <Section title="Money" icon="$">
          {money?.availableToday!=null?<><Text style={s.primary}>You have about ${Math.round(money.availableToday).toLocaleString()} available today.</Text>{money.nextBill&&<Text style={s.detail}>Next bill: {money.nextBill.name} — ${Math.round(money.nextBill.amount).toLocaleString()} {new Date(`${money.nextBill.nextDueDate}T12:00:00`).toLocaleDateString([],{weekday:'long'})}</Text>}<Action label="View Money" onPress={()=>navigation.getParent()?.navigate('Money')}/></>:<><Text style={s.primary}>Set up your budget and I can estimate what you can safely spend each day.</Text><Action label="Set Up Budget" onPress={()=>navigation.getParent()?.navigate('BudgetSetup')}/></>}
        </Section>
        <Section title="Your day" icon="☀">
          {brief?.status.calendar.connected ? (
            brief.events.length ? <>
              <Text style={s.primary}>{firstEvent ? `First up: ${firstEvent.title} at ${formatTime(firstEvent.start)}` : ''}</Text>
              <Text style={s.detail}>{plural(brief.events.length, 'event')} on your calendar today.</Text>
              {brief.events.slice(1, 3).map(event => <View style={s.row} key={event.id}><Text style={s.time}>{formatTime(event.start)}</Text><Text style={s.rowText} numberOfLines={1}>{event.title}</Text></View>)}
              <Action label="View today’s calendar" onPress={() => openRootScreen('CalendarAssistant')} />
            </> : <><Text style={s.primary}>Your calendar is open today.</Text><Text style={s.detail}>This could be a good day for focused work, errands, or a little breathing room.</Text><Action label="Plan something" onPress={() => navigation.navigate('Guided', { category: 'Plan Something' })} /></>
          ) : <EmptyService service="Calendar" detail="See appointments and open time in your brief." onPress={() => openRootScreen('ConnectedServices')} />}
        </Section>

        <Section title="Needs attention" icon="!">
          {brief?.status.gmail.connected ? (
            replyEmails.length ? <>
              <Text style={s.primary}>{replyEmails.length === 1 ? 'One email probably needs a reply.' : `${replyEmails.length} emails may need replies.`}</Text>
              {replyEmails.slice(0, 2).map(email => <View style={s.email} key={email.id}><Text style={s.emailSubject} numberOfLines={1}>{email.subject || 'No subject'}</Text><Text style={s.detail} numberOfLines={1}>{email.from}</Text></View>)}
              <Action label="Review email" onPress={() => openRootScreen('EmailAssistant')} />
            </> : <><Text style={s.primary}>Nothing urgent is standing out.</Text><Text style={s.detail}>You can check your inbox later unless you’re waiting for something.</Text></>
          ) : <EmptyService service="Gmail" detail="Surface messages that may need a reply." onPress={() => openRootScreen('ConnectedServices')} />}
        </Section>

        <Section title="Can wait" icon="○">
          {brief?.status.gmail.connected ? <><Text style={s.primary}>{laterEmails ? `${plural(laterEmails, 'unread message')} can likely wait.` : 'No low-priority unread mail to set aside.'}</Text><Text style={s.detail}>{laterEmails ? 'These look like updates, receipts, or messages that do not ask for a response.' : 'Your inbox is not adding extra noise right now.'}</Text></> : <Text style={s.detail}>When Gmail is connected, routine updates will be separated from messages that need attention.</Text>}
        </Section>

        <Section title="You may want to" icon="→">
          <View style={s.actions}>
            {replyEmails.length > 0 && <Action label="Prepare a reply" onPress={() => openRootScreen('EmailAssistant')} />}
            {brief?.status.calendar.connected && brief.events.length < 3 && <Action label="Use your open time" onPress={() => navigation.navigate('Guided', { category: 'Plan Something' })} />}
            <Action label="Ask for help with something else" onPress={() => navigation.navigate('Chat')} />
            {!connected && <Action label="Connect Calendar or Gmail" onPress={() => openRootScreen('ConnectedServices')} />}
          </View>
        </Section>
      </>}
      <Text style={s.refreshHint}>Pull down anytime to refresh your brief.</Text>
    </ScrollView>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return <View style={s.section}><View style={s.sectionHeading}><View style={s.sectionIcon}><Text style={s.sectionIconText}>{icon}</Text></View><Text style={s.sectionTitle}>{title}</Text></View>{children}</View>;
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.action, pressed && s.pressed]}><Text style={s.actionText}>{label}</Text><Text style={s.chevron}>›</Text></Pressable>;
}

function EmptyService({ service, detail, onPress }: { service: string; detail: string; onPress: () => void }) {
  return <><Text style={s.primary}>{service} is not connected.</Text><Text style={s.detail}>{detail}</Text><Action label={`Connect ${service}`} onPress={onPress} /></>;
}

const s = StyleSheet.create({
  screen: { backgroundColor: colors.cream },
  page: { padding: 20, paddingTop: 64, paddingBottom: 36, gap: 14 },
  header: { gap: 5, marginBottom: 8 },
  greeting: { color: colors.ink, fontWeight: '800', fontSize: 28 },
  date: { color: colors.muted, fontSize: 15 },
  summary: { color: colors.ink, fontSize: 18, lineHeight: 27, marginTop: 14, maxWidth: 560 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  muted: { color: colors.muted },
  notice: { color: colors.muted, backgroundColor: colors.peach, borderRadius: 12, padding: 12, lineHeight: 19 },
  section: { ...card, gap: 9 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 3 },
  sectionIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.paleGreen, alignItems: 'center', justifyContent: 'center' },
  sectionIconText: { color: colors.green, fontWeight: '800', fontSize: 16 },
  sectionTitle: { color: colors.ink, fontWeight: '800', fontSize: 18, textTransform: 'uppercase', letterSpacing: .5 },
  primary: { color: colors.ink, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  detail: { color: colors.muted, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  time: { color: colors.green, fontWeight: '700', width: 72 },
  rowText: { color: colors.ink, flex: 1 },
  email: { borderLeftWidth: 3, borderLeftColor: colors.paleGreen, paddingLeft: 10, gap: 2 },
  emailSubject: { color: colors.ink, fontWeight: '700' },
  action: { minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 3, paddingTop: 10 },
  actionText: { color: colors.green, fontWeight: '700', fontSize: 15, flex: 1 },
  chevron: { color: colors.green, fontSize: 24, lineHeight: 24 },
  pressed: { opacity: .55 },
  actions: { gap: 2 },
  refreshHint: { color: colors.muted, textAlign: 'center', fontSize: 13, marginTop: 4 },
});
