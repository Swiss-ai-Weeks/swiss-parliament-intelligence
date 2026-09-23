import React,{useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowRight,Check,CaretDown as ChevronDown,ArrowSquareOut as ExternalLink,Pause,Play,ArrowCounterClockwise as RotateCcw,ShieldCheck} from '@phosphor-icons/react';
import './landing.css';
import LandingAccount from './LandingAccount.jsx';
import {ResearchDemo,PrivacyDemo,ParticipateDemo} from './LandingDemos.jsx';
const asset=name=>import.meta.env.BASE_URL+'brand/'+name;
const alpineLandscape=asset('alpine-landscape.png'),porticoForeground=asset('portico.png'),cleisthenesBust=asset('cleisthenes-bust.png'),midnightMark=asset('midnight-mark.svg'),genevaFooter={url:asset('geneva-footer.png')};
function Button({asChild,variant,size,className='',children,...props}){const cls='civic-button '+(variant||'civic')+' '+className;return asChild?React.cloneElement(children,{...props,className:cls}):<button type="button" {...props} className={cls}>{children}</button>;}
const statements = [
  "Public decisions shape the places we share.",
  "Understanding them should feel open to everyone.",
] as const;

const chapters = [
  {
    id: "understand",
    number: "01",
    label: "Understand",
    title: "Make sense of the debate.",
    summary: "Turn complex discussion into a clear, source-linked explanation.",
    copy: "Watch a real parliamentary passage. Read the original words, then switch to English.",
  },
  {
    id: "privacy",
    number: "02",
    label: "Stay private",
    title: "Prove eligibility. Keep the details private.",
    summary: "Share the proof that matters. Keep personal details on your device.",
    copy: "Explore a future privacy flow: confirm citizenship, age and, when needed, canton without sharing your full identity.",
  },
  {
    id: "participate",
    number: "03",
    label: "Participate",
    title: "Understand first. Then have your say.",
    summary: "Consider the arguments, then respond on your own terms.",
    copy: "Ask a question, consider both sides, then try a simulated community vote. Your perspective stays your own.",
  },
] as const;

type ChapterId = (typeof chapters)[number]["id"];
function WordStatement({ text, className }: { text: string; className: string }) {
  return (
    <div className={className}>
      <p className="sr-only">{text}</p>
      <p aria-hidden="true" className="statement-words">
        {text.split(" ").map((word, index) => (
          <span className="statement-word" key={`${word}-${index}`}>
            {word}
          </span>
        ))}
      </p>
    </div>
  );
}

export default function CivicLanding({onNavigate,user,onUser,language='en',reduceMotion=false}) {
  const [accountOpen,setAccountOpen]=useState(false);
  const getStarted=()=>user?onNavigate(null,'dashboard'):setAccountOpen(true);
  const sceneRef = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [activeChapter, setActiveChapter] = useState<ChapterId>("understand");
  const [navState, setNavState] = useState<"opening" | "visible" | "hidden">("opening");

  useEffect(() => {
    if (reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReady(true);
      return;
    }
    let live = true;
    const timer = window.setTimeout(() => live && setReady(true), 2800);
    Promise.all(
      [alpineLandscape, porticoForeground, cleisthenesBust].map(
        (src) =>
          new Promise<void>((resolve) => {
            const image = new Image();
            image.onload = () => resolve();
            image.onerror = () => resolve();
            image.src = src;
          }),
      ),
    ).then(() => live && setReady(true));
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!ready || !sceneRef.current || reduceMotion) return;
    let cancelled=false;
    let cleanup = () => {};
    void import("gsap").then(async ({ gsap }) => {
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if(cancelled)return;
      gsap.registerPlugin(ScrollTrigger);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !sceneRef.current)
        return;
      const ctx = gsap.context(() => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: sceneRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.45,
            invalidateOnRefresh: true,
          },
        });
        timeline
          .to(".hero-copy, .mascot, .scroll-cue", { opacity: 0, y: -24, duration: 10 }, 4)
          .to(".portico-layer", { scale: 2.15, duration: 26, ease: "power1.in" }, 0)
          .to(".portico-layer", { opacity: 0, duration: 7, ease: "power1.out" }, 23)
          .to(".landscape-layer", { scale: 1.12, yPercent: -2, duration: 100, ease: "none" }, 0)
          .to(".statement-one", { opacity: 1, duration: 4 }, 31)
          .fromTo(
            ".statement-one .statement-word",
            { opacity: 0.12 },
            { opacity: 1, stagger: 1.4, duration: 8 },
            34,
          )
          .to(".statement-one", { opacity: 0, y: -28, duration: 8 }, 57)
          .to(".statement-two", { opacity: 1, duration: 4 }, 65)
          .fromTo(
            ".statement-two .statement-word",
            { opacity: 0.12 },
            { opacity: 1, stagger: 1.4, duration: 8 },
            68,
          )
          .to(".statement-two", { opacity: 0, y: -22, duration: 7 }, 91);
      }, sceneRef);
      cleanup = () => ctx.revert();
    });
    return () => {cancelled=true;cleanup();};
  }, [ready,reduceMotion]);

  useEffect(() => {
    const featuresTop = document.getElementById("features")?.offsetTop ?? Number.POSITIVE_INFINITY;
    const initialY = window.scrollY;
    if (initialY < 48) setNavState("opening");
    else if (initialY < featuresTop + 160) setNavState("visible");
    else setNavState("hidden");

    let previousY = initialY;
    const updateNavigation = () => {
      const currentY = window.scrollY;
      const delta = currentY - previousY;
      if (currentY < 48) {
        setNavState("opening");
      } else if (delta < -2) {
        setNavState("visible");
      } else if (delta > 2) {
        setNavState("hidden");
      }
      previousY = currentY;
    };
    window.addEventListener("scroll", updateNavigation, { passive: true });
    return () => window.removeEventListener("scroll", updateNavigation);
  }, []);

  const active = chapters.find((chapter) => chapter.id === activeChapter) ?? chapters[0];
  const selectChapter = (id: ChapterId, scroll = false) => {
    setActiveChapter(id);
    if (scroll)
      document.getElementById("features")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
  };

  return (
    <div className="civic-landing" data-reduce-motion={reduceMotion}>
      <div
        className={`loading-curtain ${ready ? "is-ready" : ""}`}
        role="status"
        aria-live="polite"
      >
        <img src={midnightMark} alt="" className="loading-mark" />
        <span>Preparing the view</span>
      </div>
      <LandingAccount open={accountOpen} onClose={()=>setAccountOpen(false)} onUser={u=>{onUser(u);setAccountOpen(false);onNavigate(null,"dashboard");}} onGuest={()=>{setAccountOpen(false);onNavigate(null,"dashboard");}}/>
      <header className={`site-header nav-${navState}`}>
        <a href="#top" className="brand" aria-label="Cleisthenes, Swiss civic companion">
          <img src={cleisthenesBust} alt="" className="brand-bust" />
          <span>
            <strong>Cleisthenes</strong>
            <small>Swiss civic companion</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#features">How it works</a>
          <a href="#features" onClick={() => selectChapter("understand")}>
            Sources
          </a>
          <a href="#site-footer">About</a>
        </nav>
        <button className="landing-enter" onClick={getStarted}>Get started <ArrowRight/></button>
      </header>

      <section
        className="opening-sequence"
        ref={sceneRef}
        aria-label="An opening view across the Swiss Alps"
      >
        <div className="opening-sticky">
          <img
            className="landscape-layer"
            src={alpineLandscape}
            alt="A painted Swiss lake surrounded by Alpine mountains"
            fetchPriority="high"
          />
          <img className="portico-layer" src={porticoForeground} alt="" aria-hidden="true" />
          <img
            className="portico-layer portico-side portico-side-left"
            src={porticoForeground}
            alt=""
            aria-hidden="true"
          />
          <img
            className="portico-layer portico-side portico-side-right"
            src={porticoForeground}
            alt=""
            aria-hidden="true"
          />
          <div className="hero-copy" id="top">
            <h1>
              A clearer view.
              <br />
              Your own decision.
            </h1>
            <p className="hero-subtitle">Meet Cleisthenes, your thoughtful civic companion.</p>
            <Button variant="civic" size="lg" onClick={getStarted}>Get started <ArrowRight /></Button><a className="landing-preview-link" href="#features">See it in action</a>
          </div>
          <div className="mascot" aria-label="Cleisthenes, the civic companion">
            <img
              src={cleisthenesBust}
              alt="Cleisthenes, a friendly sculpted-paper civic companion"
            />
            <p>
              <span>Cleisthenes</span>Your civic companion
            </p>
          </div>
          <a className="scroll-cue" href="#opening-thoughts">
            <span>Scroll to enter</span>
            <ArrowDown aria-hidden="true" />
          </a>
          <div className="motion-statements">
            <WordStatement text={statements[0]} className="narrative-statement statement-one" />
            <WordStatement text={statements[1]} className="narrative-statement statement-two" />
          </div>
        </div>
        <div className="scene-anchor" id="opening-thoughts" aria-hidden="true" />
        <div className="reduced-statements">
          <p>{statements[0]}</p>
          <p>{statements[1]}</p>
        </div>
      </section>

      <div className="paper-tear" aria-hidden="true" />
      <section className="features-section" id="features">
        <div className="section-intro">
          <p className="eyebrow">Three ways in</p>
          <h2>
            Democracy begins
            <br />
            with understanding.
          </h2>
          <p>
            Move from a difficult question to a clearer view—without losing the source, your
            privacy, or your voice.
          </p>
        </div>
        <div className="feature-explorer">
          <div className="chapter-list" aria-label="Explore features">
            {chapters.map((chapter) => (
              <Button
                key={chapter.id}
                id={`chapter-${chapter.id}`}
                variant="ghost"
                className={`chapter-button ${activeChapter === chapter.id ? "is-active" : ""}`}
                aria-pressed={activeChapter === chapter.id}
                aria-controls={`panel-${chapter.id}`}
                onClick={() => setActiveChapter(chapter.id)}
              >
                <span className="chapter-number">{chapter.number}</span>
                <span>
                  <strong>{chapter.label}</strong>
                  <small>{chapter.summary}</small>
                </span>
                <ArrowRight />
              </Button>
            ))}
          </div>
          <article
            className="feature-panel"
            id={`panel-${active.id}`}
            aria-labelledby={`chapter-${active.id}`}
          >
            <div className="feature-copy">
              <h3>{active.title}</h3>
              <p>{active.copy}</p>
            </div>
            <div key={active.id} className="active-demo">{active.id==='understand'?<ResearchDemo reduceMotion={reduceMotion} onExplore={()=>{onNavigate(null,'parliament');const u=new URL(location.href);u.searchParams.set('business','20250082');history.replaceState({},'',u);}}/>:active.id==='privacy'?<PrivacyDemo reduceMotion={reduceMotion}/>:<ParticipateDemo reduceMotion={reduceMotion} onExplore={()=>onNavigate(null,'explore')}/>}</div>
          </article>
        </div>
      </section>

      <footer className="site-footer" id="site-footer">
        <div className="footer-top">
          <h2>Your voice. Your choice.</h2>
          <Button
            variant="civicOutline"
            size="sm"
            onClick={getStarted}
          >
            Get started <ArrowRight />
          </Button>
        </div>
        <div className="footer-art" aria-hidden="true">
          <img src={genevaFooter.url} alt="" />
        </div>
        <div className="footer-bottom">
          <a href="#top" className="brand footer-brand" aria-label="Cleisthenes home">
            <img src={cleisthenesBust} alt="" className="brand-bust" />
            <strong>Cleisthenes</strong>
          </a>
          <nav className="footer-links" aria-label="Feature navigation">
            <div className="footer-feature-links">
              <button onClick={() => selectChapter("understand", true)}>Understand</button>
              <button onClick={() => selectChapter("privacy", true)}>Privacy</button>
              <button onClick={() => selectChapter("participate", true)}>Participate</button>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href="https://midnight.vote" target="_blank" rel="noreferrer">
                Explore midnight.vote <ExternalLink />
              </a>
            </Button>
          </nav>
          <div className="footer-meta">
            <p>Independent Swiss pilot · Public sources, personal understanding</p>
            <p>No government affiliation</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
