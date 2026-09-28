import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon,
  InformationCircleIcon, SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useSpeech } from '../hooks/useSpeech';
import { todayService } from '../services/todayService';
import { isPrivacyMode, maskMoney, togglePrivacyMode } from '../utils/privacy';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SETTINGS_KEY = 'letterbook-today-layout';
const MODULES = ['journal', 'portfolio'];
const FOCUS_OPTIONS = [
  { value: 'MIX', label: 'A balanced mix' },
  { value: 'AT_RISK', label: 'At-risk first' },
  { value: 'WEAKEST', label: 'Lowest memory strength' },
  { value: 'NEW', label: 'New entries first' },
];
const STAGE_COLORS = {
  NEW: '#767676', LEARNING: '#0072b2', YOUNG: '#e69f00',
  MATURE: '#cc79a7', MASTERED: '#009e73',
};

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return {
      showJournal: saved.showJournal !== false,
      showPortfolio: saved.showPortfolio !== false,
      order: Array.isArray(saved.order) && saved.order.length === 2 ? saved.order : MODULES,
    };
  } catch { return { showJournal: true, showPortfolio: true, order: MODULES }; }
}

function dateLabel(value, options = { weekday: 'short', day: 'numeric', month: 'short' }) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function gist(data) {
  const items = [];
  if (data.atRiskCount) items.push(`${data.atRiskCount} ${data.atRiskCount === 1 ? 'word' : 'words'} due soon`);
  if (data.portfolio?.overduePayments) items.push(`${data.portfolio.overduePayments} ${data.portfolio.overduePayments === 1 ? 'payment' : 'payments'} overdue`);
  if (items.length) return `${items.join(' and ')}.`;
  if (data.dueCount) return `${data.dueCount} ${data.dueCount === 1 ? 'word' : 'words'} ready for a short review.`;
  if (data.journal?.daysSinceLastEntry != null && data.journal.daysSinceLastEntry > 0) return `A few lines can keep your journal moving.`;
  return 'Your words, writing, and property are up to date.';
}

function formatMoney(amount) {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount || 0)}`;
}

function CountUp({ value }) {
  const [shown, setShown] = useState(0);
  const current = useRef(0);
  useEffect(() => {
    const target = Number(value) || 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.current = target;
      setShown(target);
      return undefined;
    }
    const from = current.current;
    const started = performance.now();
    let frame;
    const tick = (now) => {
      const progress = Math.min(1, (now - started) / 420);
      const next = Math.round(from + (target - from) * (1 - (1 - progress) ** 3));
      current.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{new Intl.NumberFormat('en-IN').format(shown)}</>;
}

function GoalRing({ reviewed, goal }) {
  const radius = 29;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(reviewed / goal, 1) : 0;
  return <svg viewBox="0 0 72 72" className="h-[4.5rem] w-[4.5rem] shrink-0" role="img" aria-label={`${reviewed} of ${goal} reviews toward today's goal`}>
    <circle cx="36" cy="36" r={radius} fill="none" stroke="var(--mv-line)" strokeWidth="6" />
    <circle cx="36" cy="36" r={radius} fill="none" stroke="var(--mv-moss)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} transform="rotate(-90 36 36)" />
    <text x="36" y="34" textAnchor="middle" fill="var(--mv-ink)" fontSize="14" fontWeight="700">{Math.min(reviewed, goal)}/{goal}</text>
    <text x="36" y="47" textAnchor="middle" fill="var(--mv-ink-soft)" fontSize="8">today</text>
  </svg>;
}

function Skeleton() {
  return <div className="mx-auto max-w-6xl space-y-6" aria-label="Loading Today" aria-busy="true">
    <div className="space-y-3"><span className="mv-skeleton h-4 w-36" /><span className="mv-skeleton h-10 w-72 max-w-full" /><span className="mv-skeleton h-5 w-80 max-w-full" /></div>
    <span className="mv-skeleton h-72 w-full" /><span className="mv-skeleton h-36 w-full" /><span className="mv-skeleton h-52 w-full" />
  </div>;
}

function WordReason({ item }) {
  return <div className="flex min-w-0 items-baseline justify-between gap-3 border-b border-[var(--mv-line)] py-2 last:border-0">
    <span className="min-w-0 truncate text-sm font-semibold text-[var(--mv-ink)]" title={item.word.word}>{item.word.word}</span>
    <span className="shrink-0 text-xs text-[var(--mv-ink-soft)]">{item.reason}</span>
  </div>;
}

function LifeStrip({ data, settings, privateMode, onPrivacyToggle }) {
  const modules = {
    learn: <div key="learn" className="min-w-0 py-4 sm:px-4 sm:py-0 sm:first:pl-0">
      <p className="mv-eyebrow">Learn</p>
      <p className="mt-1 text-lg font-semibold text-[var(--mv-ink)]"><CountUp value={data.atRiskCount} /> {data.atRiskCount === 1 ? 'word' : 'words'} at risk</p>
      <p className="text-xs text-[var(--mv-ink-soft)]">Due within 3 days</p>
      <Link to="/practice" state={data.atRiskSession?.length ? { todaySession: data.atRiskSession.map((item) => item.word), todaySessionFocus: 'AT_RISK' } : undefined} className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[var(--mv-moss)]">Practice <ArrowRightIcon className="h-4 w-4" /></Link>
      <details className="text-[11px] text-[var(--mv-ink-soft)]"><summary className="inline-flex min-h-11 cursor-pointer items-center gap-1 font-semibold"><InformationCircleIcon className="h-3.5 w-3.5" />How counted</summary><p>Unmastered entries scheduled after today and within the next three local calendar days.</p></details>
    </div>,
    journal: <div key="journal" className="min-w-0 py-4 sm:border-l sm:border-[var(--mv-line)] sm:px-4 sm:py-0">
      <p className="mv-eyebrow">Write</p>
      <p className="mt-1 text-lg font-semibold text-[var(--mv-ink)]">{data.journal?.daysSinceLastEntry == null ? 'No entries yet' : `${data.journal.daysSinceLastEntry} days since writing`}</p>
      <p className="text-xs text-[var(--mv-ink-soft)]">Three lines is enough to begin.</p>
      {data.wordOfTheDay ? <Link to={`/journal?wordId=${data.wordOfTheDay.id}`} className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[var(--mv-moss)]">Write 3 lines using “{data.wordOfTheDay.word}” <ArrowRightIcon className="h-4 w-4 shrink-0" /></Link> : <Link to="/journal" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[var(--mv-moss)]">Open journal <ArrowRightIcon className="h-4 w-4" /></Link>}
    </div>,
    portfolio: <div key="portfolio" className="min-w-0 py-4 sm:border-l sm:border-[var(--mv-line)] sm:px-4 sm:py-0 sm:last:pr-0">
      <div className="flex items-center justify-between gap-2"><p className="mv-eyebrow">Portfolio</p><button type="button" onClick={onPrivacyToggle} aria-label={privateMode ? 'Show property amounts' : 'Hide property amounts'} className="min-h-11 px-2 text-[11px] font-semibold text-[var(--mv-ink-soft)]">{privateMode ? 'Show amounts' : 'Hide amounts'}</button></div>
      {data.portfolio?.propertyCount ? <>
        <p className="mt-1 text-lg font-semibold text-[var(--mv-ink)]">{maskMoney(formatMoney(data.portfolio.pendingAmount))} pending</p>
        {data.portfolio.overduePayments ? <p className="text-xs text-[var(--mv-terracotta)]">{data.portfolio.overduePayments} {data.portfolio.overduePayments === 1 ? 'payment' : 'payments'} overdue · {data.portfolio.longestOverdueDays} days</p> : <p className="text-xs text-[var(--mv-ink-soft)]">All payments up to date</p>}
        <Link to="/property-tracker" className="mt-3 block min-h-11 py-3" aria-label={`${data.portfolio.paidPercent}% paid, ${(100 - data.portfolio.paidPercent).toFixed(2)}% pending; open Property Tracker`}><div className="h-2 overflow-hidden rounded-full bg-[var(--mv-paper-deep)]"><div className="h-full bg-[var(--mv-moss)]" style={{ width: `${data.portfolio.paidPercent}%` }} /></div></Link>
      </> : <p className="mt-1 text-sm text-[var(--mv-ink-soft)]">No properties tracked yet.</p>}
      <Link to="/property-tracker" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[var(--mv-moss)]">Property tracker <ArrowRightIcon className="h-4 w-4" /></Link>
      {data.portfolio?.propertyCount > 0 && <details className="text-[11px] text-[var(--mv-ink-soft)]"><summary className="inline-flex min-h-11 cursor-pointer items-center gap-1 font-semibold"><InformationCircleIcon className="h-3.5 w-3.5" />How calculated</summary><p>Paid, pending, and overdue values come from the Property Tracker installment ledger. An installment is overdue when unpaid and due before your local calendar date.</p></details>}
    </div>,
  };
  const ordered = ['learn', ...settings.order].map((key) => ({ key, node: modules[key] })).filter(({ key }) => key === 'learn' || settings[key === 'journal' ? 'showJournal' : 'showPortfolio']);
  return <div className={`grid divide-y divide-[var(--mv-line)] sm:divide-x sm:divide-y-0 ${ordered.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>{ordered.map(({ key, node }) => <React.Fragment key={key}>{node}</React.Fragment>)}</div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [focus, setFocus] = useState('MIX');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [privateMode, setPrivateMode] = useState(isPrivacyMode());
  const [settings, setSettings] = useState(readSettings);
  const { speak, supported, speaking } = useSpeech();

  useEffect(() => {
    let active = true;
    todayService.getToday(focus).then((result) => { if (active) { setData(result); setError(''); } })
      .catch(() => { if (active) setError('Today could not load. Try refreshing the page.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [focus]);

  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);

  const week = data?.lastSevenDays || [];
  const stages = data?.stages || [];
  const stageTotal = stages.reduce((sum, stage) => sum + stage.count, 0);
  const recallPoints = useMemo(() => (data?.recallTrend || []).filter((point) => point.accuracy != null), [data]);
  const recallPath = useMemo(() => {
    if (recallPoints.length < 2) return '';
    return recallPoints.map((point, index) => `${index ? 'L' : 'M'} ${index * (100 / (recallPoints.length - 1))} ${40 - (point.accuracy / 100) * 36}`).join(' ');
  }, [recallPoints]);

  if (loading) return <Skeleton />;
  if (error || !data) return <div role="alert" className="mx-auto max-w-xl py-16 text-center"><p className="mv-display text-2xl">Today is taking a moment.</p><p className="mt-2 text-sm text-[var(--mv-ink-soft)]">{error || 'No briefing data is available.'}</p><button type="button" onClick={() => { setLoading(true); setError(''); todayService.getToday(focus).then(setData).catch(() => setError('Today could not load. Try refreshing the page.')).finally(() => setLoading(false)); }} className="mt-4 min-h-11 rounded-lg border border-[var(--mv-line)] px-4 text-sm font-bold">Try again</button></div>;

  const session = data.suggestedSession || [];
  const complete = data.reviewedToday >= data.dailyGoal;
  const caughtUp = session.length === 0 && data.dueCount === 0 && data.atRiskCount === 0;
  const firstName = data.firstName || user?.displayName?.split(/\s+/)[0] || user?.username || 'there';
  const greetingLine = gist(data);
  const topCount = Math.max(data.dailyGoal, ...week.map((day) => day.count), 1);
  const tomorrow = data.forecast?.[0];
  const journalVisible = settings.showJournal;
  const portfolioVisible = settings.showPortfolio;

  const startToday = async (refresh = false) => {
    let selected = session;
    if (refresh) {
      try {
        const latest = await todayService.getToday(focus);
        setData(latest);
        selected = latest.suggestedSession || [];
      } catch { return; }
    }
    if (!selected.length) { navigate('/practice?mode=CUSTOM'); return; }
    navigate('/practice', { state: { todaySession: selected.map((item) => item.word), todaySessionFocus: focus } });
  };
  const togglePrivacy = () => setPrivateMode(togglePrivacyMode());
  const moveModule = (key, direction) => setSettings((current) => {
    const order = [...current.order];
    const index = order.indexOf(key);
    const target = index + direction;
    if (target < 0 || target >= order.length) return current;
    [order[index], order[target]] = [order[target], order[index]];
    return { ...current, order };
  });

  return <div className="mx-auto max-w-6xl space-y-7 sm:space-y-9">
    <header className="mv-enter space-y-2">
      <p className="mv-eyebrow">{dateLabel(data.localDate, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <h1 className="mv-display text-3xl text-[var(--mv-ink)] sm:text-4xl">{greeting()}, {firstName}.</h1>
      <p className="max-w-3xl text-base text-[var(--mv-ink-soft)]">{greetingLine}</p>
    </header>

    <section aria-labelledby="today-plan-title" className="mv-enter border-y border-[var(--mv-line)] py-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><p className="mv-eyebrow">Today's plan</p>{data.overdueCount > 0 && !complete && <span className="text-xs font-semibold text-[var(--mv-terracotta)]">A small catch-up</span>}{data.returningAfterBreak && <span className="text-xs text-[var(--mv-ink-soft)]">Welcome back</span>}</div>
          <h2 id="today-plan-title" className="mv-display mt-2 text-2xl leading-snug text-[var(--mv-ink)] sm:text-3xl">{data.totalWords === 0 ? 'Start with one word worth keeping.' : complete ? 'Your daily goal is met.' : caughtUp ? 'Nothing is due. You can leave it here.' : data.totalReviewCount === 0 ? 'Your first short review is ready.' : data.returningAfterBreak ? 'Ease back in with a short set.' : data.overdueCount > 0 ? 'A little practice will bring these back into reach.' : 'Make a little room for what you know.'}</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--mv-ink-soft)]">{data.totalWords === 0 ? 'Add a word or phrase to begin your collection.' : complete ? 'You can stop here, or take another small set when it suits you.' : caughtUp ? 'Your collection has no scheduled reviews in the next three days.' : data.totalReviewCount === 0 ? `Begin with ${session.length} entries, in a short first session.` : `A focused set of ${session.length} ${session.length === 1 ? 'entry' : 'entries'} keeps today's plan manageable.`}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {data.totalWords === 0 ? <Link to="/words" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[var(--mv-moss)] px-5 text-sm font-bold text-white hover:bg-[var(--mv-moss-dark)]">Add your first word <ArrowRightIcon className="h-4 w-4" /></Link> : complete ? <button type="button" disabled className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[var(--mv-moss)] px-5 text-sm font-bold text-white opacity-90"><CheckCircleIcon className="h-5 w-5" />Goal complete</button> : caughtUp ? <Link to="/words" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-[var(--mv-line)] px-5 text-sm font-bold text-[var(--mv-ink)]">Browse your words <ArrowRightIcon className="h-4 w-4" /></Link> : <button type="button" onClick={startToday} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[var(--mv-moss)] px-5 text-sm font-bold text-white hover:bg-[var(--mv-moss-dark)]">Start today's {session.length} · about {data.estimatedSessionMinutes} min <ArrowRightIcon className="h-4 w-4" /></button>}
            {complete && data.dueCount > 0 && <button type="button" onClick={() => startToday(true)} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[var(--mv-moss)]">Do more <ArrowRightIcon className="h-4 w-4" /></button>}
            {!complete && !caughtUp && data.totalWords > 0 && <label className="flex min-h-11 items-center gap-2 text-xs font-semibold text-[var(--mv-ink-soft)]"><span>Change focus</span><select value={focus} onChange={(event) => setFocus(event.target.value)} className="min-h-11 max-w-44 rounded-lg border border-[var(--mv-line)] bg-[var(--mv-paper)] px-2 text-xs text-[var(--mv-ink)]">{FOCUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}
          </div>
          {data.usingFallbackTimeEstimate && <p className="mt-2 text-xs text-[var(--mv-ink-soft)]">Time uses a 20-second-per-entry estimate until enough review times are recorded.</p>}
          {data.overdueCount > 0 && !complete && data.estimatedCatchUpDate && <p className="mt-3 text-xs text-[var(--mv-ink-soft)]">Estimate: at 15 a day, you could be caught up by {dateLabel(data.estimatedCatchUpDate)}.</p>}
          {complete && tomorrow && <p className="mt-3 text-xs text-[var(--mv-ink-soft)]">Tomorrow's preview: {tomorrow.count} {tomorrow.count === 1 ? 'word' : 'words'} due.</p>}
        </div>
        <div className="flex items-center gap-3 lg:pl-6"><Link to="/progress?range=7d" aria-label="Open seven-day progress and goal history"><GoalRing reviewed={data.reviewedToday} goal={data.dailyGoal} /></Link><div><p className="text-sm font-bold text-[var(--mv-ink)]">Today's goal</p><p className="text-xs text-[var(--mv-ink-soft)]">One quiet measure, once.</p></div></div>
      </div>
      {session.length > 0 && !complete && <div className="mt-6 grid gap-x-8 sm:grid-cols-2">
        {session.map((item) => <WordReason key={item.word.id} item={item} />)}
      </div>}
      {session.length > 0 && !complete && <details className="mt-3 max-w-2xl text-xs text-[var(--mv-ink-soft)]"><summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 font-semibold text-[var(--mv-moss)]"><InformationCircleIcon className="h-4 w-4" />Why these words?</summary><p className="max-w-xl pb-2">The list is repeatable: overdue words first, ranked by lower memory strength and more misses; then words due today; then words due in the next three days. Memory strength is the scheduler's estimate of how easily an entry will come back to mind.</p></details>}
      <details className="max-w-2xl text-xs text-[var(--mv-ink-soft)]"><summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 font-semibold text-[var(--mv-moss)]"><InformationCircleIcon className="h-4 w-4" />How are due counts calculated?</summary><p className="max-w-xl pb-2">Due includes unmastered entries scheduled on or before your saved local calendar date, plus entries without a scheduled date. Overdue means scheduled before that date. Today, Practice, Progress, and Words use the same event and schedule records.</p></details>
    </section>

    <section aria-labelledby="across-title" className="mv-enter">
      <div className="mb-3 flex items-end justify-between gap-3"><div><p className="mv-eyebrow">Across your life</p><h2 id="across-title" className="mv-display mt-1 text-xl text-[var(--mv-ink)]">Three places to tend</h2></div></div>
      <LifeStrip data={data} settings={settings} privateMode={privateMode} onPrivacyToggle={togglePrivacy} />
    </section>

    <section aria-labelledby="momentum-title" className="mv-enter border-t border-[var(--mv-line)] pt-6">
      <div className="mb-4"><p className="mv-eyebrow">Momentum</p><h2 id="momentum-title" className="mv-display mt-1 text-xl text-[var(--mv-ink)]">A recent rhythm, not a scorecard</h2></div>
      <div className="grid gap-6 md:grid-cols-[1.35fr_0.8fr_0.85fr]">
        <div>
          <p className="text-sm font-semibold text-[var(--mv-ink)]">{data.reviewsLastSevenDays} reviews · last 7 days · {data.activeDaysLastSevenDays} active {data.activeDaysLastSevenDays === 1 ? 'day' : 'days'}</p>
          <div className="relative mt-3 flex h-28 items-end justify-between gap-2 border-b border-[var(--mv-line)] pb-5" role="group" aria-label={`Review counts for the last seven days. Daily goal is ${data.dailyGoal}.`}>
            <div className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-[var(--mv-gold)]" style={{ bottom: `calc(1.25rem + ${data.dailyGoal / topCount * 55}px)` }}><span className="absolute -top-5 right-0 text-[10px] text-[var(--mv-ink-soft)]">goal {data.dailyGoal}</span></div>
            {week.map((day) => <Link to="/progress?range=7d" aria-label={`${dateLabel(day.date)}: ${day.count} reviews, open seven-day progress`} key={day.date} className="relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-sm focus-visible:outline" title={`${dateLabel(day.date)}: ${day.count} reviews`}><span className="text-[10px] font-semibold text-[var(--mv-ink-soft)]">{day.count || ''}</span><div className={`w-full max-w-8 rounded-t-sm ${day.date === data.localDate ? 'bg-[var(--mv-moss)]' : 'bg-[var(--mv-sky)]/65'}`} style={{ height: `${Math.max(day.count ? 6 : 1, (day.count / topCount) * 55)}px` }} /><span className={`absolute -bottom-5 text-[10px] ${day.date === data.localDate ? 'font-bold text-[var(--mv-moss)]' : 'text-[var(--mv-ink-soft)]'}`}>{dateLabel(day.date, { weekday: 'short' })}</span></Link>)}
          </div>
          <p className="mt-7 text-xs text-[var(--mv-ink-soft)]">Goal line: {data.dailyGoal} reviews per day. Earlier reviews with only a stored date are counted on that date.</p>
        </div>
        <div className="border-t border-[var(--mv-line)] pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
          <p className="text-sm font-semibold text-[var(--mv-ink)]">{data.currentStreakDays} {data.currentStreakDays === 1 ? 'day' : 'days'} in a row</p><p className="text-xs text-[var(--mv-ink-soft)]">Current streak · best {data.bestStreakDays} days</p>
          <div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-2xl font-bold tabular-nums text-[var(--mv-ink)]">{data.recall30Days.accuracy == null ? '—' : `${data.recall30Days.accuracy}%`}</p><p className="text-xs text-[var(--mv-ink-soft)]">30-day recall · {data.recall30Days.sampleSize} reviews</p></div>{recallPath && <Link to="/progress?range=30d" aria-label="Open 30-day recall details"><svg viewBox="0 0 100 42" preserveAspectRatio="none" className="h-10 w-24 overflow-visible" role="img" aria-label="Seven-day rolling recall trend, shown only for windows with at least twenty reviews"><path d={recallPath} fill="none" stroke="var(--mv-sky)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" /></svg></Link>}</div>
          <p className="mt-1 text-xs text-[var(--mv-ink-soft)]">{data.recall30Days.suppressed ? `${data.recall30Days.successful} of ${data.recall30Days.sampleSize} recalled · early estimate` : `${data.recall30Days.successful} of ${data.recall30Days.sampleSize} recalled`}</p>
          <details className="text-[11px] text-[var(--mv-ink-soft)]"><summary className="inline-flex min-h-11 cursor-pointer items-center gap-1 font-semibold"><InformationCircleIcon className="h-3.5 w-3.5" />How recall is counted</summary><p>Recall is the share of dated review events rated as recalled (quality 3–5) in the last 30 local calendar days. Percentages are hidden until the sample reaches 20 reviews.</p></details>
          {!recallPath && <p className="mt-2 text-[11px] text-[var(--mv-ink-soft)]">Trend appears after 20 reviews in a rolling week.</p>}
        </div>
        <div className="border-t border-[var(--mv-line)] pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0"><p className="text-sm font-semibold text-[var(--mv-ink)]">{data.recall30Days.accuracy == null ? 'A baseline is forming' : 'Recall is building'}</p><p className="mt-1 text-xs text-[var(--mv-ink-soft)]">{data.recall30Days.sampleSize} review events in the last 30 days. Earlier dated reviews remain part of the same event history.</p></div>
      </div>
    </section>

    <section aria-labelledby="memory-title" className="mv-enter border-t border-[var(--mv-line)] pt-6">
      <div className="mb-4"><p className="mv-eyebrow">Memory health</p><h2 id="memory-title" className="mv-display mt-1 text-xl text-[var(--mv-ink)]">Where your collection sits</h2></div>
      <div className="flex h-4 overflow-hidden rounded-full bg-[var(--mv-paper-deep)]" role="group" aria-label="Filter the collection by learning stage">
        {stages.filter((stage) => stage.count > 0).map((stage) => <Link to={`/words?stage=${stage.stage.toLowerCase()}`} key={stage.stage} aria-label={`Show ${stage.count} ${stage.stage.toLowerCase()} entries`} title={`${stage.stage}: ${stage.count}`} style={{ width: `${stageTotal ? stage.count * 100 / stageTotal : 0}%`, backgroundColor: STAGE_COLORS[stage.stage] }} className="block h-full focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--mv-focus)]" />)}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">{stages.map((stage) => <Link key={stage.stage} to={`/words?stage=${stage.stage.toLowerCase()}`} className="inline-flex min-h-11 items-center gap-2 text-xs text-[var(--mv-ink-soft)] hover:text-[var(--mv-ink)]"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: STAGE_COLORS[stage.stage] }} />{stage.stage.toLowerCase()} <strong className="text-[var(--mv-ink)]">{stage.count}</strong></Link>)}</div>
      <details className="text-[11px] text-[var(--mv-ink-soft)]"><summary className="inline-flex min-h-11 cursor-pointer items-center gap-1 font-semibold"><InformationCircleIcon className="h-3.5 w-3.5" />How stages are defined</summary><p>New means no review history. Learning is under 7 days, Young is 7–20 days, Mature is 21 days or more, and Mastered is five successful recalls in a row. These are the shared Progress definitions.</p></details>
      {data.closestToMastery?.length > 0 && <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm"><span className="font-semibold text-[var(--mv-ink)]">Closest to mastery:</span>{data.closestToMastery.map((word, index) => <React.Fragment key={word.id}>{index > 0 && <span className="text-[var(--mv-ink-soft)]">·</span>}<Link to={`/words?wordId=${word.id}`} title={word.word} className="max-w-40 truncate font-semibold text-[var(--mv-moss)]">{word.word} <span className="font-normal text-[var(--mv-ink-soft)]">({word.stepsToMastery} {word.stepsToMastery === 1 ? 'good recall' : 'good recalls'})</span></Link></React.Fragment>)}</div>}
    </section>

    <section aria-labelledby="coming-title" className="mv-enter border-t border-[var(--mv-line)] pt-6">
      <div className="mb-4"><p className="mv-eyebrow">Coming up</p><h2 id="coming-title" className="mv-display mt-1 text-xl text-[var(--mv-ink)]">A week at a glance</h2></div>
      <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <p className="text-sm font-semibold text-[var(--mv-ink)]">{tomorrow ? `Tomorrow: ${tomorrow.count} ${tomorrow.count === 1 ? 'word' : 'words'}` : 'No scheduled reviews tomorrow'}</p>
          <div className="relative mt-3 flex h-28 items-end justify-between gap-2 border-b border-[var(--mv-line)] pb-5" role="group" aria-label="Scheduled word reviews for each of the next seven days">
            {(data.forecast || []).map((day) => { const forecastMax = Math.max(1, ...data.forecast.map((entry) => entry.count)); return <Link to={`/words?dueDate=${day.date}`} key={day.date} aria-label={`${dateLabel(day.date)}: ${day.count} scheduled words, open list`} className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-sm focus-visible:outline" title={`${dateLabel(day.date)}: ${day.count} words`}><span className="text-[10px] text-[var(--mv-ink-soft)]">{day.count || ''}</span><div className="w-full max-w-8 rounded-t-sm bg-[var(--mv-plum)]/75" style={{ height: `${Math.max(day.count ? 5 : 1, day.count / forecastMax * 44)}px` }} /><span className="absolute -bottom-5 text-[10px] text-[var(--mv-ink-soft)]">{dateLabel(day.date, { weekday: 'short' })}</span></Link>; })}
          </div>
          <p className="mt-7 text-xs text-[var(--mv-ink-soft)]">Forecast counts scheduled cards, not estimated study time.</p>
        </div>
        {data.wordOfTheDay && <div className="border-t border-[var(--mv-line)] pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="mv-eyebrow">From your collection</p><div className="mt-1 flex items-center gap-2"><h3 className="mv-display text-xl text-[var(--mv-ink)]">{data.wordOfTheDay.word}</h3>{supported && <button type="button" onClick={() => speak(data.wordOfTheDay.word)} aria-label={`Say ${data.wordOfTheDay.word} aloud`} className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)]"><SpeakerWaveIcon className={`h-5 w-5 ${speaking ? 'text-[var(--mv-moss)]' : ''}`} /></button>}</div>
          {revealed ? <p className="mt-2 text-sm text-[var(--mv-ink-soft)]">{data.wordOfTheDay.definition || 'No meaning saved yet.'}</p> : <button type="button" onClick={() => setRevealed(true)} className="mt-2 min-h-11 text-sm font-bold text-[var(--mv-moss)]">Reveal meaning</button>}
        </div>}
      </div>
    </section>

    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--mv-line)] pt-4">
      <Link to="/progress" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--mv-moss)]">More progress <ArrowRightIcon className="h-4 w-4" /></Link>
      <button type="button" onClick={() => setSettingsOpen((open) => !open)} aria-expanded={settingsOpen} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--mv-ink-soft)]">Customize Today {settingsOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}</button>
      {settingsOpen && <div className="basis-full border-t border-[var(--mv-line)] py-4"><p className="text-sm font-bold text-[var(--mv-ink)]">Across your life</p><div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-2">
        <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--mv-ink-soft)]"><input type="checkbox" checked={settings.showJournal} onChange={(event) => setSettings((current) => ({ ...current, showJournal: event.target.checked }))} />Show Write</label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--mv-ink-soft)]"><input type="checkbox" checked={settings.showPortfolio} onChange={(event) => setSettings((current) => ({ ...current, showPortfolio: event.target.checked }))} />Show Portfolio</label>
        {settings.order.map((key, index) => <div key={key} className="inline-flex items-center gap-1 text-xs text-[var(--mv-ink-soft)]"><span>Move {key === 'journal' ? 'Write' : 'Portfolio'}</span><button type="button" disabled={index === 0} aria-label={`Move ${key} earlier`} onClick={() => moveModule(key, -1)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--mv-line)] disabled:opacity-40"><ChevronUpIcon className="h-4 w-4" /></button><button type="button" disabled={index === settings.order.length - 1} aria-label={`Move ${key} later`} onClick={() => moveModule(key, 1)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--mv-line)] disabled:opacity-40"><ChevronDownIcon className="h-4 w-4" /></button></div>)}
      </div></div>}
    </footer>
  </div>;
}
