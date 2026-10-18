import { useState } from 'react';
import { CalendarDays, Heart, Target, Trophy, BookOpen, ArrowUpRight } from 'lucide-react';
import { useApp } from '@/store/useApp';
import { Card } from '@/components/ui';
import { GameArtwork } from '@/components/BrandArtwork';
import { tArr } from '@/utils/i18n';
import { gameProgress, reportStats } from '@/utils/report';
import { GAMES, type GameId } from '@/types';

const practice: Record<GameId, [string, string]> = {
  karasina: ['اتفقوا على إشارة الوقوف، وجربوا جولة من غير منافسة قبل اللعب.', 'Agree on the stop signal and try a round without competition.'],
  tamathil: ['قلّدوا وضعية واحدة معًا، وامدح محاولة الثبات حتى لو كانت قصيرة.', 'Copy one pose together and praise the attempt to hold still.'],
  ishara: ['راجعوا معنى كل إشارة، وابدأوا بتعليمات بسيطة قبل إضافة قاعدة جديدة.', 'Review each signal and practise a simple rule before adding another.'],
  aks: ['قولوا القاعدة بصوت مسموع، وخلي الدقة أهم من سرعة الإجابة.', 'Say the rule aloud and focus on accuracy before speed.'],
  sabr: ['شجّع الانتظار للإشارة الصحيحة، وسمّي السلوك: «استنيت قبل ما تضغط».', 'Praise waiting for the correct signal: “You waited before tapping.”'],
  nafas: ['تنفّسوا براحة معًا وقت الهدوء، وتوقفوا لو التمرين غير مريح.', 'Breathe comfortably together during a calm moment; stop if uncomfortable.'],
};

export function Report({ onSelect }: { onSelect: (game: GameId) => void }) {
  const { sessions, settings: { lang } } = useApp();
  const ar = lang === 'ar';
  const [demo, setDemo] = useState(false);
  const real = sessions.filter((session) => !session.id.startsWith('seed-'));
  const samples = sessions.filter((session) => session.id.startsWith('seed-'));
  const stats = reportStats(demo ? samples : real, tArr(lang, 'day_labels'));
  const progress = gameProgress(real);
  const played = progress.filter((item) => item.count > 0);
  const comparable = played.filter((item) => item.scoreChange !== null);
  const improved = comparable.filter((item) => item.scoreChange! > 0).length;
  const latest = [...real].filter((item) => Date.parse(item.date) <= Date.now()).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];
  const nextGame = latest?.game ?? 'sabr';
  const days = stats.perDay.filter((day) => day.count > 0).length;
  const date = (value: string) => new Date(value).toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return <div className="content-page report-page">
    <p className="eyebrow"><Trophy size={18} aria-hidden="true" />{ar ? 'كل محاولة تستحق التشجيع' : 'Every attempt deserves encouragement'}</p>
    <h1>{ar ? 'خطوة بخطوة مع طفلك' : 'Growing together, step by step'}</h1>
    <p className="report-intro">{ar ? 'تابع عادات اللعب، وافهم التغيّر في كل لعبة، واختاروا خطوة صغيرة للمرة الجاية.' : 'Follow play habits, understand changes within each game, and choose a small next step.'}</p>
    {samples.length > 0 && <button className="report-demo" aria-pressed={demo} onClick={() => setDemo(!demo)}>{demo ? (ar ? 'عرض بيانات اللعب الحقيقي' : 'Show real play history') : (ar ? 'استكشاف نموذج تقرير تجريبي' : 'Explore a sample report')}</button>}
    <div className="report-notice" role="status">{demo
      ? (ar ? 'أنت تشاهد مثالًا توضيحيًا فقط. الأرقام التالية لا تخص طفلك، والمقارنات الشخصية مخفية.' : 'Sample report only. These numbers are not your child’s results; personal comparisons are hidden.')
      : (ar ? 'بيانات اللعب الحقيقي فقط • آخر ٧ أيام حتى الآن • محفوظة على هذا الجهاز. السجل موحّد: مشاركة الجهاز أو اللعب الجماعي يدمج النتائج.' : 'Real play only • Last 7 calendar days through now • Saved on this device. Shared-device or group play combines results in one history.')}</div>

    {!demo && !played.length && <Card className="report-empty"><h2>{ar ? 'أول خطوة تبدأ بلعبة معًا' : 'Start with a game together'}</h2><p>{ar ? 'بعد إكمال أول لعبة، هتظهر المحاولة هنا. وللمقارنة داخل نفس اللعبة، نحتاج ٦ محاولات مكتملة على الأقل.' : 'Your first completed game will appear here. A within-game comparison needs at least 6 completed attempts.'}</p><button className="primary-cta" onClick={() => onSelect('sabr')}>{ar ? 'نجرب تحدي الصبر' : 'Try Patience & Color'}</button></Card>}
    <div className="report-metrics">
      <Metric icon={<Target />} value={stats.sessionsCount} title={ar ? 'محاولات مكتملة' : 'Completed attempts'} hint={ar ? 'خلال آخر ٧ أيام' : 'In the last 7 days'} />
      <Metric icon={<CalendarDays />} value={`${days}/7`} title={ar ? 'أيام لعب' : 'Days played'} hint={ar ? 'الاستمرارية أهم من كثرة الجولات' : 'Consistency over extra rounds'} />
      <Metric icon={<Heart />} value={stats.totalPatience} title={ar ? 'ثوانٍ مسجّلة للانتظار والهدوء' : 'Recorded waiting & calm seconds'} hint={ar ? 'وقت داخل الألعاب، وليس قياسًا للصبر اليومي' : 'In-game time, not everyday patience'} />
    </div>
    <Card className="report-panel"><h2>{ar ? 'إيقاع اللعب خلال الأسبوع' : 'Your weekly play rhythm'}</h2><p>{ar ? 'كل دائرة تمثل يومًا؛ الرقم هو عدد المحاولات المكتملة. اليوم الخالي فرصة للراحة.' : 'Each circle is a day; the number is completed attempts. A quiet day can be a rest day.'}</p><ol className="activity-week">{stats.perDay.map((day, index) => <li key={index}><span className={day.count ? 'active' : ''}>{day.count}</span><small>{day.label}</small></li>)}</ol></Card>
    {!demo && <><section className="report-section" aria-labelledby="progress-heading"><h2 id="progress-heading">{ar ? 'هل الأداء بيتغيّر؟' : 'How is play performance changing?'}</h2><p>{comparable.length ? (ar ? `تحسّن متوسط نتيجة ${improved} من ${comparable.length} ألعاب قابلة للمقارنة. ` : `${improved} of ${comparable.length} comparable games have higher scores. `) : (ar ? 'لسه بنكوّن صورة عن محاولات اللعب. ' : 'We are still building a picture of play attempts. ')}{ar ? 'نقارن أول ٣ محاولات بآخر ٣ في نفس اللعبة بعد اكتمال ٦، عبر السجل الحقيقي كله، وليس الأسبوع فقط.' : 'After 6 attempts, we compare the first 3 with the latest 3 in the same game across all real history, not just this week.'}</p>
      <div className="progress-games">{GAMES.map((meta) => {
        const item = progress.find((entry) => entry.game === meta.id)!;
        return <Card key={meta.id} className="progress-game"><div className="progress-game-top"><div className="progress-thumbnail"><GameArtwork game={meta.id} /></div><div><h3>{meta[lang].name}</h3><small>{item.count} {ar ? 'محاولات في السجل' : 'recorded attempts'}</small></div></div>
          {item.scoreChange === null ? <p>{meta.id === 'nafas' ? (ar ? 'نسجّل إكمال تمرين التنفس؛ درجة إكماله لا تقيس هدوء الطفل أو حالته النفسية.' : 'We record breathing exercise completion; its score does not measure calm or mental health.') : (ar ? `نحتاج ${Math.max(0, 6 - item.count)} محاولات إضافية لعرض مقارنة أولية.` : `${Math.max(0, 6 - item.count)} more attempts needed for an initial comparison.`)}</p> : <>
            <strong className="progress-change">{item.scoreChange > 0 ? '+' : ''}{item.scoreChange} {ar ? 'نقطة' : 'points'}</strong><p>{ar ? 'التغيّر في متوسط النتيجة من ١٠٠' : 'Change in average score out of 100'}</p>
            <div className="score-comparison">{[[ar ? 'أول ٣' : 'First 3', item.baselineScore], [ar ? 'آخر ٣' : 'Latest 3', item.recentScore]].map(([label, value]) => <div key={label}><span>{label}</span><meter min="0" max="100" value={Number(value)} aria-label={String(label)} /><b>{value}</b></div>)}</div>
            <p>{ar ? `تغيّر متوسط الأخطاء لكل محاولة: ${item.errorChange! > 0 ? '+' : ''}${item.errorChange}. الأقل يعني أخطاء مسجّلة أقل.` : `Change in average errors per attempt: ${item.errorChange! > 0 ? '+' : ''}${item.errorChange}. Lower means fewer recorded errors.`}</p>
            <p className="progress-context">{item.scoreChange > 0 ? (ar ? 'اتجاه مشجّع داخل اللعبة. لاحظ كمان هل المهارة بتظهر خارجها.' : 'An encouraging in-game trend. Also look for the skill outside the game.') : item.scoreChange < 0 ? (ar ? 'النتيجة أقل حاليًا. جرّب راحة، وراجع القاعدة معه قبل المحاولة التالية.' : 'Scores are lower for now. Try a break and review the rule together.') : (ar ? 'الأداء متقارب. كرّروا بهدوء من غير ضغط لرفع النتيجة.' : 'Scores are similar. Keep practice relaxed, without pressure.')}</p>
          </>}
          {item.firstDate && item.lastDate && <small>{date(item.firstDate)} — {date(item.lastDate)}</small>}
          <button className="report-game-link" onClick={() => onSelect(meta.id)}>{ar ? 'نتمرّن معًا' : 'Practise together'}<ArrowUpRight size={16} aria-hidden="true" /></button>
        </Card>;
      })}</div></section>
      <Card className="report-panel next-step"><span className="eyebrow">{ar ? 'خطوتكم القادمة' : 'Your next step'}</span><h2>{GAMES.find((game) => game.id === nextGame)![lang].name}</h2><p>{practice[nextGame][ar ? 0 : 1]}</p><ol><li>{ar ? 'قبل اللعب: اختاروا قاعدة واحدة ومكانًا مريحًا.' : 'Before play: choose one rule and a comfortable space.'}</li><li>{ar ? 'أثناء اللعب: امدح المحاولة المحددة، وخدوا راحة عند التعب.' : 'During play: praise a specific effort and rest when tired.'}</li><li>{ar ? 'بعد اللعب: لاحظ هل انتظر دوره أو اتبع تعليمات مشابهة بعيدًا عن الشاشة.' : 'After play: notice turn-taking or following similar instructions away from the screen.'}</li></ol><button className="primary-cta" onClick={() => onSelect(nextGame)}>{ar ? 'ابدأوا المحاولة' : 'Start an attempt'}</button></Card>
    </>}
    <details className="report-panel report-method"><summary>{ar ? 'إزاي أقرأ التقرير بشكل صحيح؟' : 'How should I read this report?'}</summary><p>{ar ? 'المقارنات وصف لمحاولات اللعب وليست اختبارًا للنمو أو تشخيصًا. النوم والمساعدة وتغيير إعدادات اللعبة ممكن يؤثروا على النتيجة. استخدموا ظروفًا متقاربة، واهتموا بالدقة والمحاولة بدل السرعة وحدها.' : 'Comparisons describe play attempts, not development tests or diagnoses. Sleep, assistance and settings can affect scores. Keep conditions similar and value accuracy and effort over speed alone.'}</p><p>{ar ? 'ألعاب الحركة تعتمد على تأكيد اللاعب أو ولي الأمر؛ التطبيق لا يراقب الحركة بالكاميرا. لا توجد ملفات منفصلة للأطفال: اللعب الجماعي أو مشاركة الجهاز يدمج النتائج، لذلك لا يمكن نسبتها لطفل واحد.' : 'Movement games rely on player or adult confirmation, not camera tracking. There are no separate child profiles: shared-device or group play combines results, so they cannot be attributed to one child.'}</p><p>{ar ? 'المقارنة تبدأ بعد ٦ محاولات لتكوين مجموعتين من ٣؛ هذا شرط حسابي داخل التطبيق، وليس معيارًا طبيًا. تقرير الأسبوع يحسب الأيام بالتوقيت المحلي للجهاز.' : 'Six attempts provide two sets of three; this is an app calculation rule, not a clinical benchmark. Weekly dates follow the device’s local time.'}</p></details>
    <a className="parent-library-link" href="/articles/"><BookOpen aria-hidden="true" /><span>{ar ? 'مكتبة أولياء الأمور' : 'Parent reading library'}<small>{ar ? 'أفكار للعب والتهدئة وتشجيع المحاولة' : 'Ideas for play, calm and encouragement · Arabic articles'}</small></span><ArrowUpRight aria-hidden="true" /></a>
  </div>;
}

function Metric({ icon, value, title, hint }: { icon: React.ReactNode; value: number | string; title: string; hint: string }) {
  return <Card className="report-metric"><span aria-hidden="true">{icon}</span><strong>{value}</strong><h2>{title}</h2><p>{hint}</p></Card>;
}
