/**
 * 👑 heavenlyExam.js: 지능형 구절 병합 및 핵심 구문 추출 엔진
 * 업데이트: common.js와 충돌을 일으키던 showQuarterMenu 중복 함수 완전 삭제
 */

let heavenlyData = null; 
const heavenlyCache = {};

let currentQuizChapterData = null;
let currentFullVerses = [];

const STOP_WORDS = new Set([
    "또", "및", "곧", "즉", "그러나", "그런데", "그리고", "그러므로", "하지만", "또한", "이에", "이와", "그리하여",
    "이", "그", "저", "것", "바", "수", "안", "위", "아래", "때", "후", "대하여", "위하여", "인하여", "더불어", "함께", 
    "가운데", "중에", "앞에", "뒤에", "가라사대", "이르되", "하니", "하더라", "있더라", "하노라", "주기를", "그에게는", 
    "아니한", "하리라", "있는", "하시는", "행위를", "가진", "주어", "하나님의", "말씀을", "교회의", "주라", "옷", 
    "내가", "나는", "너와", "보니", "보매", "이르리니", "을", "한", "와", "가", "이", "를", "에"
]);

// 🚨 이곳에 있던 중복 함수(showQuarterMenu)를 삭제하여 충돌 100% 차단!

async function loadQuarterData(qName) {
    const loadingEl = document.getElementById('loading');
    if(loadingEl) loadingEl.style.display = 'block';
    
    if (heavenlyCache[qName]) {
        heavenlyData = heavenlyCache[qName];
        renderChapterList(qName);
        if(loadingEl) loadingEl.style.display = 'none';
        return; 
    }
    try {
        const response = await fetch(`${SERVER_URL}?action=loadQuarter&name=${encodeURIComponent(qName)}`);
        const data = await response.json();
        if (data && data.chapters) {
            heavenlyData = data;
            heavenlyCache[qName] = data;
            renderChapterList(qName);
        }
    } catch (e) { 
        console.error("데이터 로드 실패:", e); 
        alert("데이터를 불러오는 데 실패했습니다. 통신 상태를 확인해주세요.");
    } finally { 
        if(loadingEl) loadingEl.style.display = 'none'; 
    }
}

function renderChapterList(qName) {
    const fileContainer = document.getElementById('file-container');
    if (typeof hideAllSections === 'function') hideAllSections();
    document.getElementById('list-area').style.display = 'block';
    if (typeof updateNavUI === 'function') updateNavUI(false);
    
    fileContainer.innerHTML = `<h3 style="text-align:center; color:#007AFF; margin-bottom:20px;">🏆 ${qName} 목록</h3>`;
    heavenlyData.chapters.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'glass-card'; 
        card.style.cssText = "padding:20px; margin-bottom:12px; cursor:pointer; display:flex; justify-content:space-between; background:white; border-radius:16px;";
        card.innerHTML = `<span style="font-weight:700; color:#1c1c1e;">제 ${ch.name} 시험 보기</span><span>〉</span>`;
        card.onclick = () => {
            if (typeof openNicknamePage === 'function') {
                openNicknamePage(ch);
            } else {
                startHeavenlyQuiz(ch);
            }
        };
        fileContainer.appendChild(card);
    });
}

function shuffleCurrentQuiz() {
    if(confirm("문제를 전체 다시 섞고 초기화 하시겠습니까?")) {
        if (typeof toggleIOSSheet === 'function') toggleIOSSheet();
        if (currentQuizChapterData) startHeavenlyQuiz(currentQuizChapterData); 
    }
}

function startHeavenlyQuiz(chapter) {
    if (typeof hideAllSections === 'function') hideAllSections();
    const quizArea = document.getElementById('quiz-area');
    const quizText = document.getElementById('quiz-text');
    
    quizArea.style.display = 'block';
    if (typeof updateNavUI === 'function') updateNavUI(false);
    document.getElementById('quiz-title').innerText = `계시록 제 ${chapter.name}`;
    quizText.innerHTML = "";
    currentAnswers = []; 

    currentQuizChapterData = chapter;
    currentFullVerses = [...chapter.verses];
    
    const hintContent = document.getElementById('hint-content');
    if(hintContent) {
        hintContent.innerHTML = currentFullVerses.map(v => `<div style="margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">${v}</div>`).join('');
        const hintTitle = document.getElementById('hint-chapter-title');
        if (hintTitle) hintTitle.innerText = `📖 계시록 제 ${chapter.name}`;
    }

    const shuffled = [...chapter.verses].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 11);

    selected.forEach((vStr, i) => {
        const match = vStr.match(/^\[?(\d+[:：]\d+)\]?\s*(.*)/);
        let ref = match ? match[1] : `구절 ${i+1}`;
        let text = (match ? match[2] : vStr).replace(/\{|\}/g, "");

        const div = document.createElement('div');
        div.className = 'quiz-item';
        div.style.cssText = "margin-bottom:20px; padding:20px; background:white; border-radius:15px; border-left:5px solid #007AFF;";
        
        let safeText = encodeURIComponent(text);
        let headerHtml = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-bottom:8px; border-bottom:1px dashed rgba(0,122,255,0.2);">
                <div style="font-weight:900; color:#007AFF; font-size: 1.1rem;">문항 ${i+1} <span style="font-size:0.9rem; color:#888;">(${ref}절)</span></div>
                <button onclick="showItemHint('${safeText}')" style="background:rgba(0,122,255,0.08); border:none; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:18px; box-shadow:0 2px 8px rgba(0,0,0,0.05); transition:transform 0.2s;" onmousedown="this.style.transform='scale(0.9)'" onmouseup="this.style.transform='scale(1)'">
                    💡
                </button>
            </div>
        `;
        
        if (Math.random() < 0.7) { 
            currentAnswers.push(text);
            div.innerHTML = headerHtml + `<textarea class="q-inline-input" data-ref="${ref}절" data-ans="${text}" style="width:100%; min-height:80px; border-bottom:3px solid #007AFF; color:var(--ios-blue); font-weight:bold; padding:10px;" placeholder="구절 전체를 입력하세요"></textarea>`;
        } else {
            let words = text.split(' ');
            let quizHTML = "";
            
            let isBlankCandidate = words.map(w => {
                let cleanW = w.replace(/[.,?!]/g, "");
                return cleanW.length >= 2 && !STOP_WORDS.has(cleanW);
            });
            
            let chunks = [];
            for (let j = 0; j < words.length; j++) {
                if (isBlankCandidate[j]) {
                    let chunk = words[j];
                    let startIdx = j;
                    while (j + 1 < words.length && isBlankCandidate[j + 1] && (j - startIdx) < 3) {
                        chunk += " " + words[++j];
                    }
                    chunks.push({ text: chunk, isBlank: true });
                } else {
                    chunks.push({ text: words[j], isBlank: false });
                }
            }

            let blankEligible = chunks.map((c, index) => ({ ...c, index })).filter(c => c.isBlank);
            blankEligible.sort(() => Math.random() - 0.5); 
            
            let targetCount = Math.ceil(blankEligible.length * 0.28) || 1;
            let selectedIndices = new Set();

            for (let candidate of blankEligible) {
                if (selectedIndices.size >= targetCount) break;
                if (!selectedIndices.has(candidate.index - 1) && !selectedIndices.has(candidate.index + 1)) {
                    selectedIndices.add(candidate.index);
                }
            }

            chunks.forEach((chunk, index) => {
                if (selectedIndices.has(index)) {
                    currentAnswers.push(chunk.text);
                    const width = Math.min(chunk.text.length * 1.2 + 2, 18);
                    quizHTML += `<input type="text" class="q-inline-input" data-ref="${ref}절" data-ans="${chunk.text}" style="width:${width}em; max-width:98%; border-bottom:3px solid #007AFF; color:var(--ios-blue); font-weight:800; text-align:center; margin: 2px 0;" placeholder="입력"> `;
                } else {
                    quizHTML += `<span style="color:#007AFF; font-weight:600; font-size:1.05rem;">${chunk.text}</span> `;
                }
            });

            div.innerHTML = headerHtml + `<div style="line-height:2.4; word-break: keep-all;">${quizHTML}</div>`;
        }
        quizText.appendChild(div);
    });

    setTimeout(() => {
        const inputs = document.querySelectorAll('.q-inline-input');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                if (typeof checkInputRealtime === 'function') {
                    checkInputRealtime(this);
                }
            });
        });
    }, 100);

    window.scrollTo(0,0);
}

function showItemHint(encodedText) {
    const text = decodeURIComponent(encodedText);
    let modal = document.getElementById('item-hint-overlay');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'item-hint-overlay';
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); z-index:99999; display:none; align-items:center; justify-content:center; padding:20px; opacity:0; transition:opacity 0.3s ease;";
        modal.onclick = closeItemHint;
        
        const box = document.createElement('div');
        box.style.cssText = "background:rgba(255,255,255,0.95); padding:30px 20px; border-radius:24px; box-shadow:0 15px 35px rgba(0,0,0,0.2); text-align:center; width:100%; max-width:340px; transform:scale(0.9); transition:transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); border:1px solid rgba(255,255,255,0.6);";
        box.onclick = (e) => e.stopPropagation(); 
        
        box.innerHTML = `
            <div style="font-size:36px; margin-bottom:10px;">💡</div>
            <h3 style="color:#007AFF; margin:0 0 15px 0; font-size:19px; font-weight:800; text-shadow:none;">문항 정답 힌트</h3>
            <div id="item-hint-text" style="font-size:16px; color:#1c1c1e; line-height:1.6; font-weight:600; word-break:keep-all; margin-bottom:24px; padding:15px; background:rgba(0,122,255,0.05); border-radius:12px; border:1px solid rgba(0,122,255,0.1);"></div>
            <button onclick="closeItemHint()" style="width:100%; padding:14px; background:linear-gradient(135deg, #00C6FF, #0072FF); color:white; border:none; border-radius:14px; font-size:16px; font-weight:800; cursor:pointer; box-shadow:0 4px 15px rgba(0,114,255,0.3);">확인</button>
        `;
        
        modal.appendChild(box);
        document.body.appendChild(modal);
    }
    
    document.getElementById('item-hint-text').innerText = text;
    modal.style.display = 'flex';
    
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('div').style.transform = 'scale(1)';
    }, 10);
}

function closeItemHint() {
    const modal = document.getElementById('item-hint-overlay');
    if (modal) {
        modal.style.opacity = '0';
        modal.querySelector('div').style.transform = 'scale(0.9)';
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
}