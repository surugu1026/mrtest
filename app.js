
/**
 * 作業フロー モックアップ（4ステップ） - 完全版 app.js
 * 変更要点：
 * - 音声認識は Web Speech API をやめ、Web Audio API でローカル音量検知（ネットワーク非依存）
 * - 何でも音声が検出されたら注意文言を表示（デバウンスあり）
 * - カメラ取得は段階的フォールバックで OverconstrainedError を回避
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ====== ヘッダー・メニュー ====== */
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  const overlay = document.getElementById('overlay');

  /* ====== カメラ ====== */
  const cameraVideo = document.getElementById('cameraVideo');
  const cameraFallback = document.getElementById('cameraFallback');

  /* ====== 手順・リソース表示要素 ====== */
  const taskNameEl = document.getElementById('taskName');
  const processNameEl = document.getElementById('processName');
  const stepIndexEl = document.getElementById('stepIndex');
  const stepTotalEl = document.getElementById('stepTotal');
  const stepDescEl = document.getElementById('stepDesc');
  const toolsEl = document.getElementById('tools');
  const solutionsEl = document.getElementById('solutions');
  const cautionNoteEl = document.getElementById('cautionNote');

  /* ====== 右パネルボタン ====== */
  const playBtn = document.getElementById('playBtn');
  const nextBtn = document.getElementById('nextBtn');

  /* ====== チャット ====== */
  const chatArea = document.getElementById('chatArea');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');

  /* ====== 音声検知ボタン（ローカル） ====== */
  const voiceBtn = document.getElementById('voiceBtn');

  /* ====== ユーティリティ（null安全） ====== */
  function on(el, type, handler) { if (el) el.addEventListener(type, handler); }

  /* ====== ステップセット定義 ====== */
  const stepSets = {
    'cell-passaging': [
      {
        task: '細胞継代', process: '準備',
        desc: [
          'インキュベーターから培養中の細胞を取り出す。',
          '顕微鏡で細胞の状態を確認してインキュベーターに戻す。'
        ],
        tools: '顕微鏡　インキュベーター',
        solutions: '—',
        video: 'movie_step1.mp4',
      },
      {
        task: '細胞継代', process: '準備',
        desc: [
          '安全キャビネットの空気流とSashを確認。',
          '70%エタノールでキャビネット内を清拭する。'
        ],
        tools: '安全キャビネット　キムワイプ',
        solutions: '70%エタノール',
        video: 'movie_step2.mp4',
      },
      {
        task: '細胞継代', process: '洗浄',
        desc: [
          'PBSでシャーレ内を洗浄し、廃棄用チューブへ回収する。',
          '必要量のトリプシン/EDTAを注入する。'
        ],
        tools: 'セロロジカルピペット　ピペットエイド　シャーレ',
        solutions: 'PBS（−）　トリプシン/EDTA',
        video: 'movie_step3.mp4',
      },
      {
        task: '細胞継代', process: '回収・播種',
        desc: [
          '培地でトリプシンを中和し細胞を回収する。',
          '新しい培地に懸濁して均一に播種する。'
        ],
        tools: '遠心チューブ　ピペット',
        solutions: 'DMEM（10%FBS, PS添加）',
        video: 'movie_step4.mp4',
      },
    ],
    'room-entry': [
      { task: '入室', process: '準備', desc: ['入室前チェック'], tools: '—', solutions: '—', video: 'movie_step1.mp4' },
      { task: '入室', process: '手順', desc: ['更衣'], tools: '—', solutions: '—', video: 'movie_step2.mp4' },
      { task: '入室', process: '手順', desc: ['滅菌靴へ履き替え'], tools: '—', solutions: '—', video: 'movie_step3.mp4' },
      { task: '入室', process: '完了', desc: ['入室完了'], tools: '—', solutions: '—', video: 'movie_step4.mp4' },
    ],
    'labcoat': [
      { task: '白衣', process: '準備', desc: ['サイズ確認'], tools: '—', solutions: '—', video: 'movie_step1.mp4' },
      { task: '白衣', process: '着用', desc: ['袖口・前合わせ'], tools: '—', solutions: '—', video: 'movie_step2.mp4' },
      { task: '白衣', process: '着用', desc: ['ボタン固定'], tools: '—', solutions: '—', video: 'movie_step3.mp4' },
      { task: '白衣', process: '確認', desc: ['着用確認'], tools: '—', solutions: '—', video: 'movie_step4.mp4' },
    ],
    'handwash': [
      { task: '手洗い', process: '準備', desc: ['石鹸準備'], tools: '—', solutions: '—', video: 'movie_step1.mp4' },
      { task: '手洗い', process: '洗浄', desc: ['手のひら・甲・指の間'], tools: '—', solutions: '—', video: 'movie_step2.mp4' },
      { task: '手洗い', process: '洗浄', desc: ['親指・爪・手首'], tools: '—', solutions: '—', video: 'movie_step3.mp4' },
      { task: '手洗い', process: '完了', desc: ['流水・ペーパー'], tools: '—', solutions: '—', video: 'movie_step4.mp4' },
    ],
    'xx-task': [
      { task: 'XX作業', process: '1', desc: ['ステップ1'], tools: '—', solutions: '—', video: 'movie_step1.mp4' },
      { task: 'XX作業', process: '2', desc: ['ステップ2'], tools: '—', solutions: '—', video: 'movie_step2.mp4' },
      { task: 'XX作業', process: '3', desc: ['ステップ3'], tools: '—', solutions: '—', video: 'movie_step3.mp4' },
      { task: 'XX作業', process: '4', desc: ['ステップ4'], tools: '—', solutions: '—', video: 'movie_step4.mp4' },
    ],
    'yy-task': [
      { task: 'YY作業', process: '1', desc: ['ステップ1'], tools: '—', solutions: '—', video: 'movie_step1.mp4' },
      { task: 'YY作業', process: '2', desc: ['ステップ2'], tools: '—', solutions: '—', video: 'movie_step2.mp4' },
      { task: 'YY作業', process: '3', desc: ['ステップ3'], tools: '—', solutions: '—', video: 'movie_step3.mp4' },
      { task: 'YY作業', process: '4', desc: ['ステップ4'], tools: '—', solutions: '—', video: 'movie_step4.mp4' },
    ],
    'ng-collection': [
      { task: 'NG集', process: '1', desc: ['NG事例１'], tools: '—', solutions: '—', video: 'movie_step1.mp4' },
      { task: 'NG集', process: '2', desc: ['NG事例２'], tools: '—', solutions: '—', video: 'movie_step2.mp4' },
      { task: 'NG集', process: '3', desc: ['NG事例３'], tools: '—', solutions: '—', video: 'movie_step3.mp4' },
      { task: 'NG集', process: '4', desc: ['NG事例４'], tools: '—', solutions: '—', video: 'movie_step4.mp4' },
    ],
    'shape-scan': [
      { task: 'かたちスキャン', process: '1', desc: ['スキャン準備'], tools: '—', solutions: '—', video: 'movie_step1.mp4' },
      { task: 'かたちスキャン', process: '2', desc: ['スキャン開始'], tools: '—', solutions: '—', video: 'movie_step2.mp4' },
      { task: 'かたちスキャン', process: '3', desc: ['解析'], tools: '—', solutions: '—', video: 'movie_step3.mp4' },
      { task: 'かたちスキャン', process: '4', desc: ['レポート'], tools: '—', solutions: '—', video: 'movie_step4.mp4' },
    ],
  };

  /* ====== 現在のセットとインデックス ====== */
  let currentSetKey = 'cell-passaging';
  let steps = stepSets[currentSetKey];
  let current = 0;

  /* ====== 初期描画＆カメラ開始 ====== */
  render(current);
  startCamera({ preferRear: true }); // 背面優先（端末が未対応なら自動フォールバック）

  /* ====== 描画関数 ====== */
  function render(i) {
    const s = steps[i];
    if (!s) return;

    if (stepIndexEl) stepIndexEl.textContent = String(i + 1);
    if (stepTotalEl) stepTotalEl.textContent = String(steps.length);
    if (taskNameEl) taskNameEl.textContent = s.task;
    if (processNameEl) processNameEl.textContent = s.process;

    // 手順本文
    if (stepDescEl) {
      stepDescEl.innerHTML = '';
      s.desc.forEach(d => {
        const li = document.createElement('li');
        li.textContent = d;
        stepDescEl.appendChild(li);
      });
    }

    // リソース
    if (toolsEl) toolsEl.textContent = s.tools;
    if (solutionsEl) solutionsEl.textContent = s.solutions; // 改行は CSS で表示

    // 動画ファイル
    if (playBtn) playBtn.setAttribute('data-video-file', s.video);

    // 次へ進む／完了
    if (nextBtn) {
      const labelEl = nextBtn.querySelector('.btn-label');
      if (labelEl) {
        labelEl.textContent = (i < steps.length - 1) ? '次へ進む' : '完了';
      } else {
        nextBtn.textContent = (i < steps.length - 1) ? '次へ進む' : '完了';
      }
    }

    // ★ 注意文言の初期化（毎ステップで非表示に戻す）
    if (cautionNoteEl) {
      cautionNoteEl.hidden = true;
      cautionNoteEl.textContent = '';
    }
  }

  /* ====== 「次へ進む」 ====== */
  on(nextBtn, 'click', () => {
    if (current < steps.length - 1) {
      current += 1;
      render(current);
    } else {
      alert('すべてのステップが完了しました。');
    }
  });

  /* ====== 「動画再生」 ====== */
  on(playBtn, 'click', () => {
    const file = playBtn.getAttribute('data-video-file');
    if (!file) { alert('動画ファイルが設定されていません（data-video-file）。'); return; }
    const url = `./${file}`;
    const win = window.open(url, '_blank', 'noopener');
    if (!win) alert('ブラウザのポップアップがブロックされました。許可設定をご確認ください。');
  });

  /* ====== チャット送信（テキスト“確認”も代替トリガー） ====== */
  on(sendBtn, 'click', sendMsg);
  on(chatInput, 'keydown', (e) => { if (e.key === 'Enter') sendMsg(); });
  function sendMsg() {
    const text = chatInput?.value?.trim() ?? '';
    if (!text) return;
    const div = document.createElement('div');
    div.className = 'msg';
    div.textContent = text;
    chatArea.appendChild(div);
    chatInput.value = '';
    chatArea.scrollTop = chatArea.scrollHeight;

    // テキストで「確認」を含む場合も注意文言を表示（完全代替）
    if (text.includes('確認')) showCautionNote();
  }

  /* ====== メニュー開閉 ====== */
  function openMenu() {
    if (!sideMenu || !overlay) return;
    sideMenu.classList.add('open');
    sideMenu.setAttribute('aria-hidden', 'false');
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
  }
  function closeMenu() {
    if (!sideMenu || !overlay) return;
    sideMenu.classList.remove('open');
    sideMenu.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
  }
  on(menuBtn, 'click', () => {
    if (!sideMenu) return;
    sideMenu.classList.contains('open') ? closeMenu() : openMenu();
  });
  on(overlay, 'click', () => closeMenu());

  /* ====== メニューリンク（a）クリック：セット切替 ====== */
  document.querySelectorAll('.menu-link, .menu-link-top').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.target;

      // セット切替（存在しなければデフォルトへ）
      currentSetKey = stepSets[target] ? target : 'cell-passaging';
      steps = stepSets[currentSetKey];

      // 先頭に戻して再描画
      current = 0;
      render(current);
      closeMenu();
    });
  });

  /* ====== 端末カメラ取得（段階的フォールバック） ====== */
  async function startCamera({ preferRear = true } = {}) {
    if (!cameraFallback) return;
    cameraFallback.hidden = true;

    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
    if (!isSecure) {
      cameraFallback.hidden = false;
      cameraFallback.textContent = '非HTTPSのためカメラ取得が制限される可能性があります。HTTPSまたは http://localhost を使用してください。';
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraFallback.hidden = false;
      cameraFallback.textContent = 'このブラウザはカメラ取得（getUserMedia）に対応していません。';
      return;
    }

    const tryConstraints = [
      { video: { facingMode: preferRear ? 'environment' : 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { facingMode: preferRear ? 'environment' : 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
      { video: true, audio: false },
    ];

    for (const constraints of tryConstraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stopCamera();
        cameraVideo.srcObject = stream;
        await cameraVideo.play().catch(() => {});
        return;
      } catch (err) {
        console.warn('getUserMedia error:', err.name, err.message, constraints);
        cameraFallback.hidden = false;
        cameraFallback.textContent = `カメラ取得失敗（${err.name}）。権限・他アプリ使用中・解像度制約をご確認ください。`;
      }
    }

    cameraFallback.hidden = false;
    cameraFallback.textContent = 'カメラ取得に失敗しました。権限・HTTPS・端末カメラの使用許可をご確認ください。';
  }

  function stopCamera() {
    const stream = cameraVideo && cameraVideo.srcObject;
    if (stream && typeof stream.getTracks === 'function') {
      stream.getTracks().forEach(t => t.stop());
    }
    if (cameraVideo) cameraVideo.srcObject = null;
  }
  window.addEventListener('beforeunload', stopCamera);

  /* ====== 音声検知（Web Audio API：ローカル） ====== */
  let audioCtx = null;
  let micStream = null;
  let analyser = null;
  let voiceDetectTimer = null;
  const VOICE_DEBOUNCE_MS = 1500;         // 1.5秒以内の連発は抑止
  const AMPLITUDE_THRESHOLD = 0.08;       // 音量しきい値（0〜1の正規化、環境に応じて調整可）
  const CHECK_INTERVAL_MS = 100;          // 判定間隔（ms）

  async function startVoiceDetection() {
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
    if (!isSecure) {
      cameraFallback.hidden = false;
      cameraFallback.textContent = '非HTTPSのためマイク取得が制限される可能性があります。HTTPSまたは http://localhost を使用してください。';
      return;
    }

    try {
      // マイク取得
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(micStream);

      // 解析ノード
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);

      // 監視ループ
      const data = new Uint8Array(analyser.frequencyBinCount);
      const check = () => {
        analyser.getByteFrequencyData(data);
        // 簡易的に平均振幅を算出してしきい値判定
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / (data.length * 255); // 0..1 正規化

        if (avg >= AMPLITUDE_THRESHOLD) {
          // デバウンス
          if (!voiceDetectTimer) {
            showCautionNote();
            voiceDetectTimer = setTimeout(() => { voiceDetectTimer = null; }, VOICE_DEBOUNCE_MS);
          }
        }
      };

      // setInterval で定期チェック（完全ローカル）
      window.voiceIntervalId = setInterval(check, CHECK_INTERVAL_MS);

      // UI更新
      voiceBtn.textContent = '🎙️ 音声検知停止';
      voiceBtn.setAttribute('aria-label', '音声検知停止');

    } catch (err) {
      console.warn('Audio getUserMedia error:', err.name, err.message);
      cameraFallback.hidden = false;
      cameraFallback.textContent = 'マイク取得に失敗しました。権限や他アプリの使用状況、HTTPSをご確認ください。';
    }
  }

  function stopVoiceDetection() {
    if (window.voiceIntervalId) {
      clearInterval(window.voiceIntervalId);
      window.voiceIntervalId = null;
    }
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }
    voiceBtn.textContent = '🎙️ 音声検知開始';
    voiceBtn.setAttribute('aria-label', '音声検知開始');
  }

  function showCautionNote() {
    if (!cautionNoteEl) return;
    cautionNoteEl.textContent = '注意文言：フラスコの上部を手で覆わないでください。';
    cautionNoteEl.hidden = false;
  }

  // 開始・停止ボタン（ローカル音声検知）
  on(voiceBtn, 'click', async () => {
    // 停止→開始のトグル
    if (audioCtx || window.voiceIntervalId || micStream) {
      stopVoiceDetection();
    } else {
      await startVoiceDetection();
    }
  });
});
