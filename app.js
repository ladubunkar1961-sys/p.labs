/**
 * VOX CINEMA - Hollywood AI Text to Speech Studio
 * Client Controller & Audio Engineering
 */

(function () {
  'use strict';

  // State Management
  const state = {
    voices: [],
    bonusVoices: [],
    selectedVoice: null,
    isPlaying: false,
    isLooping: false,
    audioContext: null,
    analyser: null,
    audioSource: null,
    currentHistory: [],
    presets: {
      shawshank: {
        voiceId: "pNInz6obpgDQGcFmaJgB",
        text: "Remember, Red, hope is a good thing, maybe the best of things, and no good thing ever dies. I will be hoping that this letter finds you, and finds you well."
      },
      terminator: {
        voiceId: "VR6AewLTigWG4xSOukaG",
        text: "The unknown future rolls toward us. I face it for the first time with a sense of hope. Because if a machine can learn the value of human life, maybe we can too."
      },
      her: {
        voiceId: "EXAVITQu4vr4xnSDxMaL",
        text: "It is like I'm reading a book, and it's a book I deeply love. But I'm reading it slowly now, so the words are really far apart and the spaces between the words are almost infinite."
      },
      lalaland: {
        voiceId: "cgSgspJ2msm6clMCkdW9",
        text: "Here is to the ones who dream, foolish as they may seem. Here is to the hearts that ache, here is to the mess we make. A bit of madness is key to give us new colors to see."
      },
      interstellar: {
        voiceId: "pNInz6obpgDQGcFmaJgB",
        text: "Do not go gentle into that good night. Rage, rage against the dying of the light. We used to look up at the sky and wonder at our place in the stars."
      },
      bond: {
        voiceId: "VR6AewLTigWG4xSOukaG",
        text: "The proper function of man is to live, not to exist. I shall not waste my days in trying to prolong them. I shall use my time."
      }
    }
  };

  // DOM Elements
  const actorGrid = document.getElementById('actorGrid');
  const bonusGrid = document.getElementById('bonusGrid');
  const bonusDrawer = document.getElementById('bonusDrawer');
  const toggleBonusBtn = document.getElementById('toggleBonusBtn');
  const genderFilters = document.getElementById('genderFilters');
  const scriptInput = document.getElementById('scriptInput');
  const generateBtn = document.getElementById('generateBtn');
  const generateBtnText = document.getElementById('generateBtnText');
  const clearScriptBtn = document.getElementById('clearScriptBtn');
  const sampleQuoteBtn = document.getElementById('sampleQuoteBtn');
  const presetsBar = document.getElementById('presetsBar');

  // Stats
  const charCount = document.getElementById('charCount');
  const wordCount = document.getElementById('wordCount');
  const estDuration = document.getElementById('estDuration');

  // Sliders
  const stabilitySlider = document.getElementById('stabilitySlider');
  const stabilityVal = document.getElementById('stabilityVal');
  const similaritySlider = document.getElementById('similaritySlider');
  const similarityVal = document.getElementById('similarityVal');
  const speedSlider = document.getElementById('speedSlider');
  const speedVal = document.getElementById('speedVal');
  const modelSelect = document.getElementById('modelSelect');

  // Banner
  const bannerAvatar = document.getElementById('bannerAvatar');
  const bannerActorName = document.getElementById('bannerActorName');
  const bannerGenderBadge = document.getElementById('bannerGenderBadge');
  const bannerArchetype = document.getElementById('bannerArchetype');

  // Audio Player Elements
  const audioElement = document.getElementById('audioElement');
  const masterPlayBtn = document.getElementById('masterPlayBtn');
  const playIconSvg = document.getElementById('playIconSvg');
  const pauseIconSvg = document.getElementById('pauseIconSvg');
  const seekBar = document.getElementById('seekBar');
  const seekFill = document.getElementById('seekFill');
  const currentTimeDisplay = document.getElementById('currentTimeDisplay');
  const totalTimeDisplay = document.getElementById('totalTimeDisplay');
  const rewindBtn = document.getElementById('rewindBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  const loopToggleBtn = document.getElementById('loopToggleBtn');
  const muteBtn = document.getElementById('muteBtn');
  const volHighIcon = document.getElementById('volHighIcon');
  const volMutedIcon = document.getElementById('volMutedIcon');
  const volumeSlider = document.getElementById('volumeSlider');
  const downloadAudioBtn = document.getElementById('downloadAudioBtn');
  const copyAudioLinkBtn = document.getElementById('copyAudioLinkBtn');
  const playerActorTitle = document.getElementById('playerActorTitle');
  const playerTextPreview = document.getElementById('playerTextPreview');
  const equalizerBars = document.getElementById('equalizerBars');
  const visualizerCanvas = document.getElementById('visualizerCanvas');

  // History Elements
  const historyList = document.getElementById('historyList');
  const emptyHistoryMsg = document.getElementById('emptyHistoryMsg');
  const historyCountBadge = document.getElementById('historyCountBadge');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const toast = document.getElementById('toast');

  // Initialize
  async function init() {
    setupSliders();
    setupTextarea();
    setupAudioPlayer();
    setupShortcuts();
    await fetchVoices();
    await loadHistory();
    setupPresets();
    setupThemeToggle();
  }

  // Fetch Voice Roster
  async function fetchVoices() {
    try {
      const res = await fetch('/api/voices');
      if (res.ok) {
        const data = await res.json();
        state.voices = data.featured || [];
        state.bonusVoices = data.bonus || [];
      } else {
        throw new Error('API returned ' + res.status);
      }
    } catch (e) {
      console.warn('Using default embedded voice roster', e);
      state.voices = [
        {
          id: "pNInz6obpgDQGcFmaJgB",
          name: "Morgan Freeman",
          gender: "male",
          title: "The Iconic Narrator",
          tagline: "Deep, calm, god-like wisdom",
          archetype: "Cinematic Storyteller & Epic Narrator",
          avatar: "assets/morgan.jpg",
          accentColor: "#F59E0B",
          accentGlow: "rgba(245, 158, 11, 0.4)",
          quote: "Hope is a good thing, maybe the best of things, and no good thing ever dies.",
          tags: ["Baritone", "Warm", "Wise", "Epic"]
        },
        {
          id: "EXAVITQu4vr4xnSDxMaL",
          name: "Scarlett Johansson",
          gender: "female",
          title: "The Alluring AI Companion",
          tagline: "Intimate, sultry, velvety timbre",
          archetype: "Sentient AI & Melodic Confidante",
          avatar: "assets/scarlett.jpg",
          accentColor: "#EC4899",
          accentGlow: "rgba(236, 72, 153, 0.4)",
          quote: "The past is just a story we tell ourselves. But being here with you right now feels more real than anything else.",
          tags: ["Husky", "Intimate", "Sultry", "Emotive"]
        },
        {
          id: "VR6AewLTigWG4xSOukaG",
          name: "Arnold Schwarzenegger",
          gender: "male",
          title: "The Action Terminator",
          tagline: "Commanding, explosive, legendary power",
          archetype: "Cybernetic Warrior & Blockbuster Titan",
          avatar: "assets/arnold.jpg",
          accentColor: "#06B6D4",
          accentGlow: "rgba(6, 182, 212, 0.4)",
          quote: "Hasta la vista, baby! If it bleeds, we can kill it. Remember: failure is not an option. Come with me if you want to live!",
          tags: ["Authoritative", "Heroic", "Intense", "Iconic"]
        },
        {
          id: "cgSgspJ2msm6clMCkdW9",
          name: "Emma Stone",
          gender: "female",
          title: "The Radiant Starlet",
          tagline: "Vibrant, witty, emotionally captivating",
          archetype: "Charming Dramedy & Oscar Starlet",
          avatar: "assets/emma.jpg",
          accentColor: "#10B981",
          accentGlow: "rgba(16, 185, 129, 0.4)",
          quote: "Here's to the ones who dream, foolish as they may seem. Here's to the hearts that ache, here's to the mess we make.",
          tags: ["Playful", "Dynamic", "Expressive", "Charming"]
        }
      ];
    }

    renderActorCards('all');
    renderBonusVoices();
    if (state.voices.length > 0) {
      selectVoice(state.voices[0]);
    }
  }

  // Render 4 Spotlight Cards
  function renderActorCards(filter) {
    actorGrid.innerHTML = '';
    const filtered = state.voices.filter(v => filter === 'all' || v.gender === filter);

    filtered.forEach(voice => {
      const card = document.createElement('div');
      card.className = `actor-card ${state.selectedVoice?.id === voice.id ? 'active' : ''}`;
      card.style.setProperty('--card-accent', voice.accentColor);
      card.style.setProperty('--card-glow', voice.accentGlow);
      card.dataset.id = voice.id;

      card.innerHTML = `
        <div class="actor-card-top">
          <div class="actor-avatar-wrap">
            <img src="${voice.avatar}" alt="${voice.name}" class="actor-avatar" loading="lazy">
            <div class="actor-avatar-glow"></div>
          </div>
          <div class="actor-meta">
            <div class="actor-name-wrap">
              <span class="actor-name">${voice.name}</span>
              <span class="actor-badge ${voice.gender}">${voice.gender}</span>
            </div>
            <div class="actor-role-title">${voice.title}</div>
            <div class="actor-tagline">${voice.tagline}</div>
          </div>
        </div>

        <div class="actor-tags-row">
          ${(voice.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join('')}
        </div>

        <div class="actor-card-actions">
          <button class="sample-quote-btn" data-quote-id="${voice.id}" title="Preview iconic line">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Quote Line
          </button>
          <div class="select-actor-indicator">
            <span class="check-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            <span>${state.selectedVoice?.id === voice.id ? 'Cast Active' : 'Select'}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.sample-quote-btn')) {
          e.stopPropagation();
          loadSampleQuote(voice);
          return;
        }
        selectVoice(voice);
      });

      actorGrid.appendChild(card);
    });
  }

  // Render Bonus Voices in Collapsible Drawer
  function renderBonusVoices() {
    if (!state.bonusVoices || state.bonusVoices.length === 0) {
      if (toggleBonusBtn) toggleBonusBtn.hidden = true;
      return;
    }
    bonusGrid.innerHTML = '';
    state.bonusVoices.forEach(bv => {
      const bCard = document.createElement('div');
      bCard.className = `bonus-card ${state.selectedVoice?.id === bv.id ? 'active' : ''}`;
      bCard.dataset.id = bv.id;
      bCard.innerHTML = `
        <div class="bonus-info">
          <div class="bonus-name">${bv.name} <span class="actor-badge ${bv.gender}">${bv.gender}</span></div>
          <div class="bonus-title">${bv.title} • ElevenLabs ${bv.elevenVoice}</div>
        </div>
      `;
      bCard.addEventListener('click', () => {
        selectVoice({
          ...bv,
          avatar: "assets/morgan.jpg",
          accentColor: "#F59E0B",
          accentGlow: "rgba(245, 158, 11, 0.4)",
          tagline: bv.title
        });
      });
      bonusGrid.appendChild(bCard);
    });
  }

  // Select Actor
  function selectVoice(voice) {
    state.selectedVoice = voice;

    // Update accent theme variables
    document.documentElement.style.setProperty('--current-accent', voice.accentColor || '#F59E0B');
    document.documentElement.style.setProperty('--current-glow', voice.accentGlow || 'rgba(245, 158, 11, 0.4)');

    // Update active card styling
    document.querySelectorAll('.actor-card').forEach(c => {
      const isActive = c.dataset.id === voice.id;
      c.classList.toggle('active', isActive);
      const ind = c.querySelector('.select-actor-indicator span:last-child');
      if (ind) ind.textContent = isActive ? 'Cast Active' : 'Select';
    });

    document.querySelectorAll('.bonus-card').forEach(bc => {
      bc.classList.toggle('active', bc.dataset.id === voice.id);
    });

    // Update banner
    bannerAvatar.src = voice.avatar || 'assets/morgan.jpg';
    bannerAvatar.alt = voice.name;
    bannerActorName.textContent = voice.name;
    bannerGenderBadge.textContent = voice.gender.toUpperCase();
    bannerGenderBadge.className = `actor-badge ${voice.gender}`;
    bannerArchetype.textContent = `${voice.title} • ${voice.tagline || ''}`;

    showToast(`Cast actor: ${voice.name}`, 'info');
  }

  // Load Sample Quote
  function loadSampleQuote(voice) {
    selectVoice(voice);
    if (voice.quote) {
      scriptInput.value = voice.quote;
      updateTextStats();
      showToast(`Loaded quote for ${voice.name}`, 'success');
      scriptInput.focus();
    }
  }

  // Setup Presets
  function setupPresets() {
    presetsBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.preset-chip');
      if (!chip) return;
      const key = chip.dataset.preset;
      const preset = state.presets[key];
      if (preset) {
        const targetVoice = state.voices.find(v => v.id === preset.voiceId) || state.voices[0];
        if (targetVoice) selectVoice(targetVoice);
        scriptInput.value = preset.text;
        updateTextStats();
        showToast(`Loaded scene: "${chip.textContent}"`, 'success');
      }
    });

    // Sample quote button
    sampleQuoteBtn.addEventListener('click', () => {
      if (state.selectedVoice) {
        loadSampleQuote(state.selectedVoice);
      }
    });

    // Clear script button
    clearScriptBtn.addEventListener('click', () => {
      scriptInput.value = '';
      updateTextStats();
      scriptInput.focus();
    });

    // Filter pills
    genderFilters.addEventListener('click', (e) => {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;
      genderFilters.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderActorCards(pill.dataset.filter);
    });

    // Bonus drawer toggle
    toggleBonusBtn.addEventListener('click', () => {
      const isHidden = bonusDrawer.hidden;
      bonusDrawer.hidden = !isHidden;
      toggleBonusBtn.classList.toggle('open', isHidden);
      toggleBonusBtn.setAttribute('aria-expanded', String(isHidden));
    });
  }

  // Sliders Setup
  function setupSliders() {
    stabilitySlider.addEventListener('input', () => {
      stabilityVal.textContent = parseFloat(stabilitySlider.value).toFixed(2);
    });
    similaritySlider.addEventListener('input', () => {
      similarityVal.textContent = parseFloat(similaritySlider.value).toFixed(2);
    });
    speedSlider.addEventListener('input', () => {
      const val = parseFloat(speedSlider.value);
      speedVal.textContent = val.toFixed(2) + 'x';
      if (audioElement) audioElement.playbackRate = val;
    });
  }

  // Textarea & Statistics
  function setupTextarea() {
    scriptInput.addEventListener('input', updateTextStats);
    updateTextStats();
  }

  function updateTextStats() {
    const text = scriptInput.value || '';
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    // Estimated duration: average speaking rate ~140 words per minute => 2.33 words/sec
    const estSec = words > 0 ? Math.max(1, Math.round(words / 2.33)) : 0;

    charCount.textContent = chars.toLocaleString();
    wordCount.textContent = words.toLocaleString();
    estDuration.textContent = estSec > 0 ? `~${estSec}s` : '0s';
  }

  // Setup Keyboard Shortcuts
  function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        triggerGenerate();
      }
      if (e.code === 'Space' && document.activeElement !== scriptInput && !e.target.matches('input, textarea')) {
        e.preventDefault();
        togglePlayPause();
      }
    });

    generateBtn.addEventListener('click', triggerGenerate);
  }

  // Core Speech Generation Request
  async function triggerGenerate() {
    const text = scriptInput.value.trim();
    if (!text) {
      showToast('Please enter dialogue text in the script area.', 'error');
      scriptInput.focus();
      return;
    }

    if (!state.selectedVoice) {
      showToast('Please select a Hollywood actor voice.', 'error');
      return;
    }

    // Set Loading State
    generateBtn.classList.add('loading');
    generateBtnText.textContent = `Directing ${state.selectedVoice.name}...`;

    try {
      const payload = {
        text: text,
        voiceId: state.selectedVoice.id,
        actorName: state.selectedVoice.name,
        modelId: modelSelect.value,
        stability: parseFloat(stabilitySlider.value),
        similarityBoost: parseFloat(similaritySlider.value),
        speed: parseFloat(speedSlider.value)
      };

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const item = data.item;
      showToast(`Generated performance by ${item.actorName}!`, 'success');

      // Load & Play in Master Player
      loadAudioIntoPlayer(item.audioUrl, item.actorName, item.text);
      await loadHistory();

    } catch (err) {
      console.error('TTS Generation error:', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      generateBtn.classList.remove('loading');
      generateBtnText.textContent = 'Direct & Synthesize Speech';
    }
  }

  // Master Audio Player Setup & Web Audio API Visualizer
  function setupAudioPlayer() {
    masterPlayBtn.addEventListener('click', togglePlayPause);
    rewindBtn.addEventListener('click', () => {
      if (audioElement) audioElement.currentTime = Math.max(0, audioElement.currentTime - 5);
    });
    forwardBtn.addEventListener('click', () => {
      if (audioElement) audioElement.currentTime = Math.min(audioElement.duration || 0, audioElement.currentTime + 5);
    });

    loopToggleBtn.addEventListener('click', () => {
      state.isLooping = !state.isLooping;
      audioElement.loop = state.isLooping;
      loopToggleBtn.classList.toggle('active', state.isLooping);
      showToast(state.isLooping ? 'Looping enabled' : 'Looping disabled', 'info');
    });

    muteBtn.addEventListener('click', () => {
      audioElement.muted = !audioElement.muted;
      volHighIcon.hidden = audioElement.muted;
      volMutedIcon.hidden = !audioElement.muted;
    });

    volumeSlider.addEventListener('input', () => {
      audioElement.volume = parseFloat(volumeSlider.value);
      audioElement.muted = false;
      volHighIcon.hidden = false;
      volMutedIcon.hidden = true;
    });

    seekBar.addEventListener('input', () => {
      if (audioElement.duration) {
        audioElement.currentTime = (seekBar.value / 100) * audioElement.duration;
      }
    });

    copyAudioLinkBtn.addEventListener('click', () => {
      if (scriptInput.value) {
        navigator.clipboard.writeText(scriptInput.value);
        showToast('Script copied to clipboard!', 'success');
      }
    });

    // Audio element event listeners
    audioElement.addEventListener('timeupdate', () => {
      if (!audioElement.duration) return;
      const progress = (audioElement.currentTime / audioElement.duration) * 100;
      seekBar.value = progress;
      seekFill.style.width = progress + '%';
      currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
    });

    audioElement.addEventListener('loadedmetadata', () => {
      totalTimeDisplay.textContent = formatTime(audioElement.duration);
      seekBar.disabled = false;
      masterPlayBtn.disabled = false;
      rewindBtn.disabled = false;
      forwardBtn.disabled = false;
      copyAudioLinkBtn.disabled = false;
      downloadAudioBtn.removeAttribute('disabled');
    });

    audioElement.addEventListener('play', () => {
      state.isPlaying = true;
      playIconSvg.hidden = true;
      pauseIconSvg.hidden = false;
      equalizerBars.classList.add('playing');
      initVisualizer();
    });

    audioElement.addEventListener('pause', () => {
      state.isPlaying = false;
      playIconSvg.hidden = false;
      pauseIconSvg.hidden = true;
      equalizerBars.classList.remove('playing');
    });

    audioElement.addEventListener('ended', () => {
      if (!state.isLooping) {
        state.isPlaying = false;
        playIconSvg.hidden = false;
        pauseIconSvg.hidden = true;
        equalizerBars.classList.remove('playing');
        seekBar.value = 0;
        seekFill.style.width = '0%';
      }
    });

    initVisualizerCanvas();
  }

  function loadAudioIntoPlayer(audioUrl, actorName, text) {
    playerActorTitle.textContent = `${actorName} • Master Performance`;
    playerTextPreview.textContent = `"${text}"`;
    downloadAudioBtn.href = audioUrl;
    downloadAudioBtn.download = `VOX_${actorName.replace(/\s+/g, '_')}.mp3`;

    audioElement.src = audioUrl;
    audioElement.playbackRate = parseFloat(speedSlider.value) || 1.0;
    audioElement.play().catch(e => {
      console.log('Autoplay prevented or pending interaction', e);
    });
  }

  function togglePlayPause() {
    if (!audioElement.src) return;
    if (audioElement.paused) {
      audioElement.play();
    } else {
      audioElement.pause();
    }
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Real-time Canvas Spectrum Visualizer
  function initVisualizerCanvas() {
    const canvas = visualizerCanvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Draw idle resting wave
    function drawIdle() {
      if (state.isPlaying) return;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Subtle resting pulses
      const bars = 48;
      const barWidth = width / bars;
      for (let i = 0; i < bars; i++) {
        const h = 4 + Math.sin(Date.now() * 0.003 + i * 0.2) * 3;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(i * barWidth + 2, (height - h) / 2, barWidth - 4, h);
      }
      requestAnimationFrame(drawIdle);
    }
    drawIdle();
  }

  function initVisualizer() {
    if (!state.audioContext) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        state.audioContext = new AudioContext();
        state.analyser = state.audioContext.createAnalyser();
        state.analyser.fftSize = 128;
        state.audioSource = state.audioContext.createMediaElementSource(audioElement);
        state.audioSource.connect(state.analyser);
        state.analyser.connect(state.audioContext.destination);
      } catch (err) {
        console.warn('Web Audio API analyser init notice:', err);
        return;
      }
    }

    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }

    renderVisualizerFrame();
  }

  function renderVisualizerFrame() {
    if (!state.isPlaying || !state.analyser) return;

    const canvas = visualizerCanvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    state.analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, width, height);

    const barCount = 42;
    const barWidth = width / barCount;
    const accentColor = state.selectedVoice?.accentColor || '#F59E0B';

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * bufferLength);
      const value = dataArray[dataIndex] || 0;
      const percent = value / 255;
      const barHeight = Math.max(4, percent * (height - 15));

      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      // Create gradient for bars
      const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
      grad.addColorStop(0, accentColor);
      grad.addColorStop(1, 'rgba(239, 68, 68, 0.4)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x + 2, y, barWidth - 4, barHeight, 3);
      ctx.fill();
    }

    requestAnimationFrame(renderVisualizerFrame);
  }

  // Generation History Archive
  async function loadHistory() {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const history = await res.json();
        state.currentHistory = history;
        renderHistory(history);
      }
    } catch (e) {
      console.warn('Could not fetch history', e);
    }
  }

  function renderHistory(items) {
    historyCountBadge.textContent = `${items.length} clips`;

    if (!items || items.length === 0) {
      emptyHistoryMsg.hidden = false;
      historyList.querySelectorAll('.history-item').forEach(el => el.remove());
      return;
    }

    emptyHistoryMsg.hidden = true;
    historyList.querySelectorAll('.history-item').forEach(el => el.remove());

    items.forEach(item => {
      const voice = state.voices.find(v => v.id === item.voiceId) || { avatar: 'assets/morgan.jpg' };
      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = `
        <div class="history-item-left">
          <img src="${voice.avatar || 'assets/morgan.jpg'}" alt="${item.actorName}" class="history-avatar">
          <div class="history-content">
            <div class="history-actor-line">
              <span class="history-actor-name">${item.actorName}</span>
              <span class="history-time">${item.timestamp || ''}</span>
            </div>
            <div class="history-text" title="${item.text}">"${item.text}"</div>
          </div>
        </div>
        <div class="history-item-actions">
          <button class="tool-btn play-history-btn" title="Replay clip">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play
          </button>
          <a href="${item.audioUrl}" download="VOX_${item.actorName}.mp3" class="icon-btn mini" title="Download">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </a>
          <button class="icon-btn mini delete-history-btn" title="Delete clip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      `;

      row.querySelector('.play-history-btn').addEventListener('click', () => {
        loadAudioIntoPlayer(item.audioUrl, item.actorName, item.text);
      });

      row.querySelector('.delete-history-btn').addEventListener('click', async () => {
        try {
          await fetch(`/api/history/${item.id}`, { method: 'DELETE' });
          row.remove();
          state.currentHistory = state.currentHistory.filter(h => h.id !== item.id);
          historyCountBadge.textContent = `${state.currentHistory.length} clips`;
          if (state.currentHistory.length === 0) emptyHistoryMsg.hidden = false;
        } catch (e) {
          console.error(e);
        }
      });

      historyList.appendChild(row);
    });
  }

  clearHistoryBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear your studio history?')) {
      await fetch('/api/history', { method: 'DELETE' });
      state.currentHistory = [];
      renderHistory([]);
      showToast('Studio history archive cleared.', 'info');
    }
  });

  // Theme Toggle
  function setupThemeToggle() {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('cinema-midnight');
      const isMidnight = document.body.classList.contains('cinema-midnight');
      showToast(isMidnight ? 'Midnight Blue Theme' : 'Cinema Dark Theme', 'info');
    });
  }

  // Toast Notification
  let toastTimer = null;
  function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.className = 'toast';
    }, 3200);
  }

  // Start application
  document.addEventListener('DOMContentLoaded', init);
})();
