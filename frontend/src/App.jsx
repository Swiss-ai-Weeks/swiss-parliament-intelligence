import { useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookmarkSimple, Buildings, CalendarBlank, CaretDown,
  ChatCircleDots, Check, ClipboardText, ClockCounterClockwise, Copy, FileText,
  FadersHorizontal, GearSix, Globe, MagnifyingGlass, Paperclip, Pause, Play,
  ShieldCheck, Sparkle, ThumbsDown, ThumbsUp, UsersThree,
} from "@phosphor-icons/react";

const citations = {
  1: { time: "00:12:34", speaker: "Beat Flach", topic: "State vs. private provision", quote: "Die e-ID muss vom Staat herausgegeben werden. Nur so können wir das Vertrauen der Bevölkerung sicherstellen und einen gleichberechtigten Zugang für alle gewährleisten.", range: "00:12:34 – 00:12:52" },
  2: { time: "01:03:17", speaker: "Min Li Marti", topic: "Private providers", quote: "Ein staatlich betriebenes E-ID-System kann das Vertrauen in die digitale Identität stärken, weil der Staat für Sicherheit und Grundrechte bürgt.", range: "01:03:17 – 01:03:43" },
  3: { time: "00:48:09", speaker: "Marcel Dettling", topic: "Market solutions", quote: "Gleichzeitig dürfen wir private Anbieter nicht grundsätzlich ausschliessen. Ein Marktmodell kann Innovationen ermöglichen und die Akzeptanz erhöhen.", range: "00:48:09 – 00:48:27" },
  4: { time: "00:27:11", speaker: "Min Li Marti", topic: "Data protection concerns", quote: "Die Grundrechte dürfen nicht dem Komfort geopfert werden. Der Datenschutz muss im Zentrum jeder technischen Lösung stehen.", range: "00:27:11 – 00:27:38" },
  5: { time: "01:15:26", speaker: "Elisabeth Baume-Schneider", topic: "Federal safeguards", quote: "Die Daten müssen in der Schweiz bleiben und die gesetzlichen Schutzmechanismen müssen von Anfang an eingebaut sein.", range: "01:15:26 – 01:15:58" },
  6: { time: "00:52:03", speaker: "Beat Flach", topic: "Voluntary adoption", quote: "Vertrauen entsteht nur, wenn die Menschen selbst entscheiden können, ob und wann sie die elektronische Identität verwenden.", range: "00:52:03 – 00:52:25" },
  7: { time: "00:36:48", speaker: "Elisabeth Baume-Schneider", topic: "Voluntary use", quote: "Die Nutzung bleibt freiwillig. Diese Zusage ist ein Grundpfeiler der Vorlage und wird gesetzlich abgesichert.", range: "00:36:48 – 00:37:15" },
  8: { time: "01:28:12", speaker: "Marcel Dettling", topic: "Digital services", quote: "Eine Lösung wird nur dann erfolgreich sein, wenn sie im Alltag einen klaren Nutzen schafft und einfach zugänglich bleibt.", range: "01:28:12 – 01:28:38" },
  9: { time: "00:11:05", speaker: "Beat Flach", topic: "Universal access", quote: "Ein digitaler Service des Bundes darf niemanden ausschliessen. Es braucht weiterhin einen analogen Weg.", range: "00:11:05 – 00:11:29" },
};

const speakers = [
  { name: "Beat Flach", meta: "GLP · Aargau", image: "/assets/parliament-speaker.png", position: "52% 22%" },
  { name: "Min Li Marti", meta: "SP · Zürich", image: "/assets/speaker-min-li-marti.png" },
  { name: "Marcel Dettling", meta: "SVP · Schwyz", image: "/assets/speaker-marcel-dettling.png" },
  { name: "Elisabeth Baume-Schneider", meta: "Federal Council", image: "/assets/speaker-elisabeth-baume.png" },
];

const answerSections = [
  { title: "State vs. private provision", text: "The main divide was whether the state should issue the e-ID or whether private providers should be allowed. A majority favoured a state-run solution to ensure trust and universal access, while liberal voices argued for a market-based model.", cites: [1, 2, 3] },
  { title: "Data protection and surveillance risks", text: "Critics warned of surveillance and mission creep, calling for strong safeguards and minimal data storage. Supporters argued that a secure e-ID could reduce fraud, provided citizens retain control.", cites: [4, 5, 6] },
  { title: "Mandatory vs. voluntary use", text: "Several speakers rejected any form of obligation and insisted that use remain voluntary. Others noted that broad adoption would be necessary for the service to be useful in practice.", cites: [7, 8, 9] },
];

function NavItem({ icon: Icon, children, active, onClick }) {
  return <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}><Icon size={20} weight={active ? "fill" : "regular"} /><span>{children}</span></button>;
}

function CitationChip({ id, selected, onSelect }) {
  return <button className={`citation ${selected ? "selected" : ""}`} onClick={() => onSelect(id)} aria-label={`Open source ${id} at ${citations[id].time}`}><b>{id}</b><span>{citations[id].time}</span></button>;
}

function SpeakerList() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? speakers : speakers.slice(0, 3);
  return (
    <section className="source-section speakers-section">
      <div className="section-heading-row"><h3>Speakers in this debate</h3><button className="text-button" onClick={() => setExpanded(!expanded)}>{expanded ? "Show less" : "View all"}</button></div>
      <div className="speaker-list">
        {visible.map((speaker, index) => (
          <button className="speaker-row" key={speaker.name}>
            <img src={speaker.image} alt="" style={{ objectPosition: speaker.position || "50% 36%" }} />
            <span><strong>{speaker.name}</strong><small>{speaker.meta}</small></span>
            {index === 0 && <span className="speaking-badge">Now</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

function SourcePanel({ selectedId, onSelect }) {
  const source = citations[selectedId];
  const [playing, setPlaying] = useState(false);
  const progress = useMemo(() => 12 + selectedId * 7, [selectedId]);
  return (
    <aside className="source-panel">
      <div className="source-panel-head"><span><ClipboardText size={19} /> Source {selectedId} of 9</span><div className="source-arrows"><button onClick={() => onSelect(selectedId === 1 ? 9 : selectedId - 1)} aria-label="Previous source"><ArrowLeft size={16} /></button><button onClick={() => onSelect(selectedId === 9 ? 1 : selectedId + 1)} aria-label="Next source"><ArrowRight size={16} /></button></div></div>
      <div className="video-frame">
        <img src="/assets/parliament-speaker.png" alt="Parliamentary speaker at the lectern" />
        <div className="video-shade" />
        <div className="video-progress"><span style={{ width: `${progress}%` }} /></div>
        <div className="video-controls"><button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause video" : "Play video"}>{playing ? <Pause weight="fill" /> : <Play weight="fill" />}</button><span>{source.time} <i>/ 00:14:02</i></span><button aria-label="Video settings"><GearSix /></button></div>
      </div>
      <div className="source-scroll">
        <section className="speaker-summary"><div><h2>{source.speaker}</h2><p>National Council (NR)</p><p>22 September 2026</p></div><span className="party-pill">GLP</span></section>
        <blockquote>“{source.quote}”<small>{source.range}</small></blockquote>
        <button className="full-debate"><Play size={16} weight="fill" /> View in full debate <ArrowRight size={16} /></button>
        <section className="source-section about-source"><h3>About this source</h3><dl><dt>Session</dt><dd>Autumn Session 2026</dd><dt>Item</dt><dd>22.026 · Federal Act on Electronic Identity</dd><dt>Chamber</dt><dd>National Council</dd><dt>Date</dt><dd>22 Sep 2026</dd><dt>Source</dt><dd><a href="https://www.parlament.ch/" target="_blank" rel="noreferrer">Parliamentary video ↗</a></dd></dl></section>
        <SpeakerList />
        <section className="source-section related"><h3>Related moments</h3>{[4, 2, 8].map((id) => <button key={id} onClick={() => onSelect(id)} className={selectedId === id ? "active" : ""}><Play size={14} weight="fill" /><time>{citations[id].time}</time><span>{citations[id].topic}</span></button>)}</section>
      </div>
    </aside>
  );
}

export function App() {
  const [mode, setMode] = useState("ask");
  const [selectedId, setSelectedId] = useState(1);
  const [language, setLanguage] = useState("EN");
  const [query, setQuery] = useState("What were the main disagreements about the electronic identity proposal?");
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [nav, setNav] = useState("Conversational Briefing");
  const submit = (event) => { event.preventDefault(); if (query.trim()) setSelectedId(1); };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><Buildings size={35} weight="fill" /><span><strong>Swiss Parliament Intelligence</strong><small>Search. Watch. Understand.</small></span></div>
        <label className="global-search"><MagnifyingGlass size={21} /><input aria-label="Global search" placeholder="Search debates, people, topics, documents..." /><kbd>⌘ K</kbd></label>
        <div className="session"><CalendarBlank size={20} /><span><strong>Autumn Session 2026</strong><small>14 Sep – 2 Oct 2026</small></span></div>
        <div className="languages" aria-label="Language">{["DE", "FR", "IT", "EN"].map((item) => <button key={item} className={language === item ? "active" : ""} onClick={() => setLanguage(item)}>{item}</button>)}</div>
        <button className="avatar-button" aria-label="Account"><UsersThree size={22} /></button>
      </header>
      <nav className="sidebar">
        <div className="nav-main"><NavItem icon={ChatCircleDots} active={nav === "Conversational Briefing"} onClick={() => setNav("Conversational Briefing")}>Conversational Briefing</NavItem><NavItem icon={Play} active={nav === "Debates & Videos"} onClick={() => setNav("Debates & Videos")}>Debates & Videos</NavItem><NavItem icon={FileText} active={nav === "Documents"} onClick={() => setNav("Documents")}>Documents</NavItem><NavItem icon={UsersThree} active={nav === "People"} onClick={() => setNav("People")}>People</NavItem><NavItem icon={Globe} active={nav === "Topics"} onClick={() => setNav("Topics")}>Topics</NavItem><NavItem icon={Buildings} active={nav === "Committees"} onClick={() => setNav("Committees")}>Committees</NavItem><NavItem icon={ClipboardText} active={nav === "Initiatives & Bills"} onClick={() => setNav("Initiatives & Bills")}>Initiatives & Bills</NavItem></div>
        <div className="nav-secondary"><NavItem icon={BookmarkSimple}>Saved</NavItem><NavItem icon={ClockCounterClockwise}>History</NavItem><NavItem icon={GearSix}>Settings</NavItem></div>
        <div className="civic-note"><p>A public service for an open democracy.</p><div><ShieldCheck size={25} weight="fill" /><span>Federal Assembly<small>The Swiss Parliament</small></span></div></div>
      </nav>
      <main className="workspace">
        <div className="mode-switch" role="tablist"><button className={mode === "ask" ? "active" : ""} onClick={() => setMode("ask")}><ChatCircleDots size={28} /><span><strong>Ask</strong><small>Get a concise answer with sources</small></span></button><button className={mode === "investigate" ? "active" : ""} onClick={() => setMode("investigate")}><MagnifyingGlass size={28} /><span><strong>Investigate</strong><small>Explore the evidence yourself</small></span></button></div>
        <form className="question-box" onSubmit={submit}><textarea value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Ask about parliamentary debates" /><div className="question-tools"><span><button type="button"><Paperclip size={16} /> Add context</button><button type="button"><FadersHorizontal size={16} /> Filters</button></span><button type="button" className="scope"><Buildings size={16} /> Swiss Parliament only <CaretDown size={14} /></button></div><button className="send" aria-label="Submit question"><ArrowRight size={21} weight="bold" /></button></form>
        <article className="answer-card">
          <header><div className="ai-mark"><Sparkle size={20} weight="fill" /></div><div><h1>Answer</h1><p>Based on parliamentary debates and documents · AI interpretation (experimental)</p></div><time>Generated 14 Sep 2026, 14:32</time></header>
          <p className="answer-intro">The electronic identity (e-ID) proposal sparked three main areas of disagreement in Parliament:</p>
          <div className="answer-sections">{answerSections.map((section, index) => <section key={section.title}><span className="section-index">{index + 1}</span><div><h2>{section.title}</h2><p>{section.text}</p><div className="citations-row">{section.cites.map((id) => <CitationChip key={id} id={id} selected={selectedId === id} onSelect={setSelectedId} />)}</div></div></section>)}</div>
          <p className="answer-conclusion">Overall, there was broad agreement on the need for a secure and user-friendly solution, but clear disagreements remained on who should operate it, how to protect privacy, and whether it should be mandatory.</p>
          <footer><div className="feedback"><span>Was this helpful?</span><button className={feedback === "up" ? "selected" : ""} onClick={() => setFeedback("up")}><ThumbsUp /></button><button className={feedback === "down" ? "selected" : ""} onClick={() => setFeedback("down")}><ThumbsDown /></button></div><button className="copy-button" onClick={() => { navigator.clipboard?.writeText(query); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy answer"}</button></footer>
        </article>
      </main>
      <SourcePanel selectedId={selectedId} onSelect={setSelectedId} />
    </div>
  );
}
