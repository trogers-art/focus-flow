// js/modules/audio-module.js
const AudioModule = (() => {
  const TRACKS = [
    { id: 'rain',    icon: '🌧', name: 'Rain on Roof'    },
    { id: 'thunder', icon: '⛈', name: 'Distant Thunder'  },
    { id: 'fire',    icon: '🔥', name: 'Crackling Fire'   },
    { id: 'forest',  icon: '🌲', name: 'Forest & Birds'   },
    { id: 'waves',   icon: '🌊', name: 'Ocean Waves'      },
    { id: 'lofi',    icon: '🎵', name: 'Lo-Fi Beats'      },
    { id: 'witchy',  icon: '🔮', name: 'Witchy / Magical' },
    { id: 'brown',   icon: '◉',  name: 'Brown Noise'      },
  ];

  let ctx = null;
  const playing   = {}; // id → { out, nodes, stop? }
  const masterGains = {}; // id → GainNode

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  // ── noise buffers ──────────────────────────────────────────────────
  function whiteBuf(secs) {
    const c = getCtx();
    const n = Math.floor(c.sampleRate * secs);
    const buf = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = c.createBufferSource(); s.buffer = buf; s.loop = true;
    return s;
  }

  function brownBuf(secs) {
    const c = getCtx();
    const n = Math.floor(c.sampleRate * secs);
    const buf = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch); let last = 0;
      for (let i = 0; i < n; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = last * 3.5;
      }
    }
    const s = c.createBufferSource(); s.buffer = buf; s.loop = true;
    return s;
  }

  // ── sound builders ────────────────────────────────────────────────

  function buildRain() {
    const c = getCtx();
    const out = c.createGain(); out.gain.value = 0.9;
    // Layer 1 – roof hiss
    const h = whiteBuf(6);
    const hLP = c.createBiquadFilter(); hLP.type = 'lowpass'; hLP.frequency.value = 2000;
    const hLS = c.createBiquadFilter(); hLS.type = 'lowshelf'; hLS.frequency.value = 350; hLS.gain.value = 10;
    const hG  = c.createGain(); hG.gain.value = 0.5;
    h.connect(hLP); hLP.connect(hLS); hLS.connect(hG); hG.connect(out);
    // Layer 2 – patter
    const p = whiteBuf(4);
    const pBP = c.createBiquadFilter(); pBP.type = 'bandpass'; pBP.frequency.value = 1500; pBP.Q.value = 0.6;
    const pPK = c.createBiquadFilter(); pPK.type = 'peaking'; pPK.frequency.value = 3000; pPK.Q.value = 1.5; pPK.gain.value = 9;
    const pG  = c.createGain(); pG.gain.value = 0.4;
    p.connect(pBP); pBP.connect(pPK); pPK.connect(pG); pG.connect(out);
    // Layer 3 – high drips
    const dr = whiteBuf(3);
    const dHP = c.createBiquadFilter(); dHP.type = 'highpass'; dHP.frequency.value = 4500;
    const dG  = c.createGain(); dG.gain.value = 0.15;
    dr.connect(dHP); dHP.connect(dG); dG.connect(out);
    h.start(); p.start(); dr.start();
    return { out, nodes: [h, p, dr] };
  }

  function buildThunder() {
    const c = getCtx();
    const out = c.createGain(); out.gain.value = 1.0;
    // Continuous low rumble
    const rumble = brownBuf(8);
    const rLP1 = c.createBiquadFilter(); rLP1.type = 'lowpass'; rLP1.frequency.value = 90;
    const rLP2 = c.createBiquadFilter(); rLP2.type = 'lowpass'; rLP2.frequency.value = 60;
    const rG   = c.createGain(); rG.gain.value = 0.2;
    rumble.connect(rLP1); rLP1.connect(rLP2); rLP2.connect(rG); rG.connect(out);
    rumble.start();

    let stopped = false;
    const eventNodes = [];

    function strike() {
      if (stopped) return;
      const now = c.currentTime;
      // crack
      const cbuf = c.createBuffer(2, Math.floor(c.sampleRate * 0.18), c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = cbuf.getChannelData(ch);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      }
      const cs = c.createBufferSource(); cs.buffer = cbuf;
      const cHP = c.createBiquadFilter(); cHP.type = 'highpass'; cHP.frequency.value = 200;
      const cG  = c.createGain(); cG.gain.setValueAtTime(0.55 + Math.random() * 0.45, now);
      cG.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      cs.connect(cHP); cHP.connect(cG); cG.connect(out);
      cs.start(now); cs.stop(now + 0.3);
      eventNodes.push(cs, cHP, cG);
      // roll
      const rollDur = 2.5 + Math.random() * 4;
      const rb = brownBuf(Math.ceil(rollDur) + 1);
      const rLP = c.createBiquadFilter(); rLP.type = 'lowpass'; rLP.frequency.value = 130;
      const rollG = c.createGain();
      const pk = 0.6 + Math.random() * 0.4;
      rollG.gain.setValueAtTime(0.001, now + 0.05);
      rollG.gain.linearRampToValueAtTime(pk, now + 0.4);
      rollG.gain.exponentialRampToValueAtTime(0.001, now + rollDur);
      rb.connect(rLP); rLP.connect(rollG); rollG.connect(out);
      rb.start(now); rb.stop(now + rollDur + 0.1);
      eventNodes.push(rb, rLP, rollG);
      setTimeout(() => { if (!stopped) strike(); }, (6 + Math.random() * 18) * 1000);
    }
    setTimeout(() => { if (!stopped) strike(); }, 1500 + Math.random() * 2000);

    return {
      out, nodes: [rumble, rLP1, rLP2, rG],
      stop() { stopped = true; eventNodes.forEach(n => { try { n.stop && n.stop(); n.disconnect(); } catch(e){} }); }
    };
  }

  function buildFire() {
    const c = getCtx();
    const out = c.createGain(); out.gain.value = 1.0;
    // Roar
    const roar = brownBuf(6);
    const rLP1 = c.createBiquadFilter(); rLP1.type = 'lowpass'; rLP1.frequency.value = 320;
    const rLP2 = c.createBiquadFilter(); rLP2.type = 'lowpass'; rLP2.frequency.value = 180;
    const rW   = c.createBiquadFilter(); rW.type = 'lowshelf'; rW.frequency.value = 250; rW.gain.value = 8;
    const rG   = c.createGain(); rG.gain.value = 0.65;
    roar.connect(rLP1); rLP1.connect(rLP2); rLP2.connect(rW); rW.connect(rG); rG.connect(out);
    roar.start();
    // Mid hiss
    const hiss = whiteBuf(4);
    const hBP  = c.createBiquadFilter(); hBP.type = 'bandpass'; hBP.frequency.value = 900; hBP.Q.value = 0.5;
    const hHS  = c.createBiquadFilter(); hHS.type = 'highshelf'; hHS.frequency.value = 3000; hHS.gain.value = -22;
    const hG   = c.createGain(); hG.gain.value = 0.25;
    hiss.connect(hBP); hBP.connect(hHS); hHS.connect(hG); hG.connect(out);
    hiss.start();
    // Crackle events
    let stopped = false;
    const crackNodes = [];
    function crack() {
      if (stopped) return;
      const now = c.currentTime;
      const dur = 0.003 + Math.random() * 0.04;
      const freq = 3000 + Math.random() * 6000;
      const samples = Math.max(8, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, samples, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < samples; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / samples);
      const s = c.createBufferSource(); s.buffer = buf;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 4 + Math.random() * 8;
      const g  = c.createGain(); g.gain.value = 0.1 + Math.random() * 0.5;
      s.connect(bp); bp.connect(g); g.connect(out);
      s.start(now); s.stop(now + dur + 0.01);
      crackNodes.push(s, bp, g);
      setTimeout(crack, Math.random() < 0.35 ? 20 + Math.random() * 100 : 130 + Math.random() * 600);
    }
    crack();
    return {
      out, nodes: [roar, rLP1, rLP2, rW, rG, hiss, hBP, hHS, hG],
      stop() { stopped = true; crackNodes.forEach(n => { try { n.stop && n.stop(); n.disconnect(); } catch(e){} }); }
    };
  }

  function buildForest() {
    const c = getCtx();
    const out = c.createGain(); out.gain.value = 0.95;
    // Rustle
    const rust = whiteBuf(7);
    const rBP  = c.createBiquadFilter(); rBP.type = 'bandpass'; rBP.frequency.value = 700; rBP.Q.value = 0.4;
    const rLP  = c.createBiquadFilter(); rLP.type = 'lowpass'; rLP.frequency.value = 2000;
    const rG   = c.createGain(); rG.gain.value = 0.14;
    const rLFO = c.createOscillator(); rLFO.frequency.value = 0.11; rLFO.type = 'sine';
    const rLG  = c.createGain(); rLG.gain.value = 0.05;
    rLFO.connect(rLG); rLG.connect(rG.gain);
    rust.connect(rBP); rBP.connect(rLP); rLP.connect(rG); rG.connect(out);
    rust.start(); rLFO.start();
    // Crickets
    const crick = whiteBuf(3);
    const cBP   = c.createBiquadFilter(); cBP.type = 'bandpass'; cBP.frequency.value = 4200; cBP.Q.value = 18;
    const cG    = c.createGain(); cG.gain.value = 0;
    const cLFO  = c.createOscillator(); cLFO.frequency.value = 22; cLFO.type = 'square';
    const cLG   = c.createGain(); cLG.gain.value = 0.1;
    cLFO.connect(cLG); cLG.connect(cG.gain);
    crick.connect(cBP); cBP.connect(cG); cG.connect(out);
    crick.start(); cLFO.start();
    // Birds (FM synthesis)
    let stopped = false;
    const birdNodes = [];
    const species = [
      [2200,1.35,0.18,6,80],[3100,0.72,0.22,4,120],
      [1800,1.0,0.45,3,60],[2700,1.6,0.12,12,200],[1600,1.2,0.30,2.5,40],
    ];
    function chirp() {
      if (stopped) return;
      const now = c.currentTime;
      const delay = 0.8 + Math.random() * 5;
      const [bf,sr,dur,mf,md] = species[Math.floor(Math.random() * species.length)];
      const notes = 1 + Math.floor(Math.random() * 4);
      for (let ni = 0; ni < notes; ni++) {
        const t = now + delay + ni * (dur * 0.9 + 0.04);
        const car = c.createOscillator(); car.type = 'sine';
        car.frequency.setValueAtTime(bf * (0.92 + Math.random() * 0.16), t);
        car.frequency.exponentialRampToValueAtTime(bf * sr * (0.9 + Math.random() * 0.2), t + dur);
        const mod = c.createOscillator(); mod.type = 'sine'; mod.frequency.value = mf * (0.8 + Math.random() * 0.4);
        const modG = c.createGain(); modG.gain.value = md * (0.7 + Math.random() * 0.6);
        mod.connect(modG); modG.connect(car.frequency);
        const env = c.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.13 + Math.random() * 0.1, t + dur * 0.15);
        env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        car.connect(env); env.connect(out);
        car.start(t); car.stop(t + dur + 0.05);
        mod.start(t); mod.stop(t + dur + 0.05);
        birdNodes.push(car, mod, modG, env);
      }
      setTimeout(chirp, (delay + notes * (dur + 0.05)) * 1000 * 0.7);
    }
    setTimeout(() => { if (!stopped) chirp(); }, 300);
    setTimeout(() => { if (!stopped) chirp(); }, 1900);
    setTimeout(() => { if (!stopped) chirp(); }, 3500);
    return {
      out, nodes: [rust, rBP, rLP, rG, rLFO, rLG, crick, cBP, cG, cLFO, cLG],
      stop() { stopped = true; birdNodes.forEach(n => { try { n.stop && n.stop(); n.disconnect(); } catch(e){} }); }
    };
  }

  function buildWaves() {
    const c = getCtx();
    const out = c.createGain(); out.gain.value = 0.9;
    const allNodes = [];
    [[320,0.16,0.38,0.6],[600,0.10,0.25,0.35],[1100,0.22,0.18,0.22]].forEach(([lp,lfoF,lfoDep,g]) => {
      const src = whiteBuf(6 + Math.random() * 4);
      const lpF = c.createBiquadFilter(); lpF.type = 'lowpass'; lpF.frequency.value = lp;
      const gN  = c.createGain(); gN.gain.value = g * 0.55;
      const lfo = c.createOscillator(); lfo.frequency.value = lfoF; lfo.type = 'sine';
      const lG  = c.createGain(); lG.gain.value = lfoDep * g * 0.55;
      lfo.connect(lG); lG.connect(gN.gain);
      src.connect(lpF); lpF.connect(gN); gN.connect(out);
      src.start(); lfo.start();
      allNodes.push(src, lpF, gN, lfo, lG);
    });
    const sub = brownBuf(8);
    const sLP = c.createBiquadFilter(); sLP.type = 'lowpass'; sLP.frequency.value = 80;
    const sG  = c.createGain(); sG.gain.value = 0.38;
    sub.connect(sLP); sLP.connect(sG); sG.connect(out);
    sub.start();
    allNodes.push(sub, sLP, sG);
    return { out, nodes: allNodes };
  }

  function buildLofi() {
    const c = getCtx();
    const out = c.createGain(); out.gain.value = 0.85;
    // Chord pad Cmaj7
    const padMix = c.createGain(); padMix.gain.value = 0.18; padMix.connect(out);
    const padLP  = c.createBiquadFilter(); padLP.type = 'lowpass'; padLP.frequency.value = 1200; padLP.connect(padMix);
    const padNodes = [];
    [130.81,164.81,196.00,246.94].forEach(f => {
      const o  = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * (0.998 + Math.random() * 0.004);
      const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * (1.001 + Math.random() * 0.004);
      const g  = c.createGain(); g.gain.value = 0.5;
      o.connect(g); o2.connect(g); g.connect(padLP);
      o.start(); o2.start();
      padNodes.push(o, o2, g);
    });
    // Vinyl crackle
    const vinyl = whiteBuf(5);
    const vHP = c.createBiquadFilter(); vHP.type = 'highpass'; vHP.frequency.value = 3000;
    const vG  = c.createGain(); vG.gain.value = 0.035;
    vinyl.connect(vHP); vHP.connect(vG); vG.connect(out);
    vinyl.start();
    // Drum sequencer 78 BPM
    const bpm = 78, step = 60 / bpm / 4;
    const kick  = [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0];
    const snare = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];
    const hat   = [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0];
    const oHat  = [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1];
    let stopped = false, si = 0, next = c.currentTime + 0.05;
    const drumNodes = [];
    function sched() {
      while (next < c.currentTime + 0.25) {
        const t = next, s16 = si % 16;
        if (kick[s16]) {
          const o = c.createOscillator(); o.type = 'sine';
          o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.35);
          const g = c.createGain(); g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
          o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.5); drumNodes.push(o, g);
        }
        if (snare[s16]) {
          const nb = c.createBuffer(1, Math.floor(c.sampleRate * 0.18), c.sampleRate);
          const nd = nb.getChannelData(0);
          for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nd.length, 0.7);
          const ns = c.createBufferSource(); ns.buffer = nb;
          const nbp = c.createBiquadFilter(); nbp.type = 'bandpass'; nbp.frequency.value = 260; nbp.Q.value = 0.5;
          const ng = c.createGain(); ng.gain.setValueAtTime(0.32, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          ns.connect(nbp); nbp.connect(ng); ng.connect(out); ns.start(t); ns.stop(t + 0.2); drumNodes.push(ns, nbp, ng);
        }
        if (hat[s16]) {
          const hb = c.createBuffer(1, Math.floor(c.sampleRate * 0.045), c.sampleRate);
          const hd = hb.getChannelData(0);
          for (let i = 0; i < hd.length; i++) hd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / hd.length, 2);
          const hs = c.createBufferSource(); hs.buffer = hb;
          const hhp = c.createBiquadFilter(); hhp.type = 'highpass'; hhp.frequency.value = 8000;
          const hg = c.createGain(); hg.gain.value = 0.17;
          hs.connect(hhp); hhp.connect(hg); hg.connect(out); hs.start(t); hs.stop(t + 0.06); drumNodes.push(hs, hhp, hg);
        }
        if (oHat[s16]) {
          const ob = c.createBuffer(1, Math.floor(c.sampleRate * 0.20), c.sampleRate);
          const od = ob.getChannelData(0);
          for (let i = 0; i < od.length; i++) od[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / od.length, 0.4);
          const os = c.createBufferSource(); os.buffer = ob;
          const ohp = c.createBiquadFilter(); ohp.type = 'highpass'; ohp.frequency.value = 7000;
          const og = c.createGain(); og.gain.setValueAtTime(0.13, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          os.connect(ohp); ohp.connect(og); og.connect(out); os.start(t); os.stop(t + 0.22); drumNodes.push(os, ohp, og);
        }
        si++; next += step;
      }
      if (!stopped) setTimeout(sched, 80);
    }
    sched();
    return {
      out, nodes: [...padNodes, vinyl, vHP, vG, padMix, padLP],
      stop() { stopped = true; drumNodes.forEach(n => { try { n.stop && n.stop(); n.disconnect(); } catch(e){} }); }
    };
  }

  function buildWitchy() {
    const c = getCtx();
    const out = c.createGain(); out.gain.value = 0.88;
    // Drone
    const dMix = c.createGain(); dMix.gain.value = 0.28; dMix.connect(out);
    const dLP  = c.createBiquadFilter(); dLP.type = 'lowpass'; dLP.frequency.value = 280; dLP.connect(dMix);
    const droneNodes = [];
    [55.0,55.18,82.41,82.55].forEach(f => {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      o.connect(dLP); o.start(); droneNodes.push(o);
    });
    const dLFO = c.createOscillator(); dLFO.frequency.value = 0.04; dLFO.type = 'sine';
    const dLG  = c.createGain(); dLG.gain.value = 0.11;
    dLFO.connect(dLG); dLG.connect(dMix.gain); dLFO.start();
    // Shimmer 528Hz harmonics
    const shMix = c.createGain(); shMix.gain.value = 0.065; shMix.connect(out);
    const shimNodes = [];
    [528,529.5,792,793.2,1056,1057.8].forEach((f,i) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = c.createGain(); g.gain.value = 0.5;
      const vib = c.createOscillator(); vib.frequency.value = 0.3 + i * 0.07; vib.type = 'sine';
      const vG  = c.createGain(); vG.gain.value = 1.2;
      vib.connect(vG); vG.connect(o.frequency);
      o.connect(g); g.connect(shMix); o.start(); vib.start(); shimNodes.push(o,g,vib,vG);
    });
    // Whisper
    const wh  = whiteBuf(5);
    const wBP = c.createBiquadFilter(); wBP.type = 'bandpass'; wBP.frequency.value = 820; wBP.Q.value = 12;
    const wG  = c.createGain(); wG.gain.value = 0;
    const wLFO= c.createOscillator(); wLFO.frequency.value = 0.07; wLFO.type = 'sine';
    const wLG = c.createGain(); wLG.gain.value = 0.055;
    wLFO.connect(wLG); wLG.connect(wG.gain);
    wh.connect(wBP); wBP.connect(wG); wG.connect(out);
    wh.start(); wLFO.start();
    // Singing bowls
    let stopped = false;
    const bowlNodes = [];
    function bowl() {
      if (stopped) return;
      const now = c.currentTime, delay = 1 + Math.random() * 8;
      const freqs = [146.83,174.61,196.00,220.00,261.63];
      const f = freqs[Math.floor(Math.random() * freqs.length)];
      const dur = 4 + Math.random() * 6;
      [[f,0.6],[f*2.76,0.25],[f*5.4,0.1]].forEach(([freq,amp]) => {
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
        const vib = c.createOscillator(); vib.frequency.value = 5 + Math.random() * 3; vib.type = 'sine';
        const vG  = c.createGain(); vG.gain.value = freq * 0.003;
        vib.connect(vG); vG.connect(o.frequency);
        const g = c.createGain();
        g.gain.setValueAtTime(0, now + delay);
        g.gain.linearRampToValueAtTime(amp * 0.22, now + delay + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
        o.connect(g); g.connect(out);
        o.start(now + delay); o.stop(now + delay + dur + 0.1);
        vib.start(now + delay); vib.stop(now + delay + dur + 0.1);
        bowlNodes.push(o, vib, vG, g);
      });
      setTimeout(bowl, (delay + dur * 0.4) * 1000);
    }
    bowl(); setTimeout(bowl, 2500);
    return {
      out, nodes: [...droneNodes, dLFO, dLG, dMix, dLP, ...shimNodes, shMix, wh, wBP, wG, wLFO, wLG],
      stop() { stopped = true; bowlNodes.forEach(n => { try { n.stop && n.stop(); n.disconnect(); } catch(e){} }); }
    };
  }

  function buildBrown() {
    const c = getCtx();
    const out = c.createGain(); out.gain.value = 0.82;
    const src = brownBuf(8);
    const lp  = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800;
    src.connect(lp); lp.connect(out); src.start();
    return { out, nodes: [src, lp] };
  }

  const BUILDERS = { rain:buildRain, thunder:buildThunder, fire:buildFire, forest:buildForest, waves:buildWaves, lofi:buildLofi, witchy:buildWitchy, brown:buildBrown };

  // ── UI ────────────────────────────────────────────────────────
  function build(body) {
    body.innerHTML = TRACKS.map(t => `
      <div class="audio-track">
        <span class="track-icon">${t.icon}</span>
        <span class="track-name">${t.name}</span>
        <input type="range" class="track-vol" data-tid="${t.id}" min="0" max="1" step="0.01" value="0">
        <button class="track-play" id="tp-${t.id}" data-tid="${t.id}">▶</button>
      </div>
    `).join('') + '<div class="audio-hint">Mix any combination</div>';

    body.querySelectorAll('.track-play').forEach(btn => {
      btn.addEventListener('click', () => toggle(btn.dataset.tid));
    });
    body.querySelectorAll('.track-vol').forEach(sl => {
      sl.addEventListener('input', () => setVol(sl.dataset.tid, parseFloat(sl.value)));
    });
  }

  function toggle(id) {
    if (playing[id]) {
      stop(id);
    } else {
      start(id);
    }
  }

  function start(id) {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();
    const builder = BUILDERS[id];
    if (!builder) return;
    const sound = builder();
    const mg = c.createGain();
    const sl = document.querySelector(`.track-vol[data-tid="${id}"]`);
    const vol = sl && parseFloat(sl.value) > 0 ? parseFloat(sl.value) : 0.5;
    mg.gain.value = vol;
    if (sl && parseFloat(sl.value) === 0) sl.value = 0.5;
    sound.out.connect(mg); mg.connect(c.destination);
    playing[id] = sound;
    masterGains[id] = mg;
    const btn = document.getElementById('tp-' + id);
    if (btn) { btn.textContent = '⏸'; btn.classList.add('on'); }
  }

  function stop(id) {
    const sound = playing[id];
    if (!sound) return;
    try { sound.out.disconnect(); } catch(e) {}
    if (sound.stop) sound.stop();
    sound.nodes.forEach(n => { try { n.stop && n.stop(); n.disconnect(); } catch(e) {} });
    delete playing[id];
    delete masterGains[id];
    const btn = document.getElementById('tp-' + id);
    if (btn) { btn.textContent = '▶'; btn.classList.remove('on'); }
  }

  function setVol(id, val) {
    if (masterGains[id]) masterGains[id].gain.value = val;
    if (!playing[id] && val > 0) start(id);
  }

  return { build };
})();
