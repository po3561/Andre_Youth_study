/**
 * 👑 heavenlyExam.js: 지능형 구절 병합 및 핵심 구문 추출 엔진 (강화 버전)
 * 수정 사항: 인접한 빈칸 후보를 최대 4단어까지 결합하여 문맥 중심의 문제 생성
 */

let heavenlyData = null; 
const heavenlyCache = {};

// 🚫 빈칸 제외 단어 리스트
const STOP_WORDS = new Set([
    "또", "및", "곧", "즉", "그러나", "그런데", "그리고", "그러므로", "하지만", "또한", "이에", "이와", "그리하여",
    "이", "그", "저", "것", "바", "수", "안", "위", "아래", "때", "후", "대하여", "위하여", "인하여", "더불어", "함께", 
    "가운데", "중에", "앞에", "뒤에", "가라사대", "이르되", "하니", "하더라", "있더라", "하노라", "주기를", "그에게는", 
    "아니한", "하리라", "있는", "하시는", "행위를", "가진", "주어", "하나님의", "말씀을", "교회의", "주라", "옷", 
    "내가", "나는", "너와", "보니", "보매", "이르리니", "을", "한", "와", "가", "이", "를", "에"
]);

function showQuarterMenu(highlightId, color) {
    if (typeof hideAllSections === 'function') hideAllSections();
    const quarterMenu = document.getElementById('quarter-menu');
    if (quarterMenu) quarterMenu.style.display = 'block';
    if (typeof updateNavUI === 'function') updateNavUI(false);
    if (highlightId && color) {
        const targetBtn = document.getElementById(highlightId);
        if (targetBtn) {
            targetBtn.style.backgroundColor = color;
            targetBtn.style.color = "white"; 
        }
    }
    window.scrollTo(0, 0);
}

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
    } catch (e) { console.error("로드 실패", e); }
    finally { if(loadingEl) loadingEl.style.display = 'none'; }
}

function renderChapterList(qName) {
    const fileContainer = document.getElementById('file-container');
    if (typeof hideAllSections === 'function') hideAllSections();
    document.getElementById('list-area').style.display = 'block';
    updateNavUI(false);
    fileContainer.innerHTML = `<h3 style="text-align:center; color:#007AFF; margin-bottom:20px;">🏆 ${qName} 목록</h3>`;
    heavenlyData.chapters.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'glass-card'; 
        card.style.cssText = "padding:20px; margin-bottom:12px; cursor:pointer; display:flex; justify-content:space-between; background:white; border-radius:16px;";
        card.innerHTML = `<span style="font-weight:700; color:#1c1c1e;">제 ${ch.name} 시험 보기</span><span>〉</span>`;
        card.onclick = () => openNicknamePage(ch);
        fileContainer.appendChild(card);
    });
}

/**
 * 📝 지능형 퀴즈 엔진: 구절 단위 병합 로직 (강화)
 */
function startHeavenlyQuiz(chapter) {
    hideAllSections();
    const quizArea = document.getElementById('quiz-area');
    const quizText = document.getElementById('quiz-text');
    quizArea.style.display = 'block';
    updateNavUI(false);
    document.getElementById('quiz-title').innerText = `계시록 제 ${chapter.name}`;
    quizText.innerHTML = "";
    currentAnswers = []; 

    const shuffled = [...chapter.verses].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 11);

    selected.forEach((vStr, i) => {
        const match = vStr.match(/^\[?(\d+[:：]\d+)\]?\s*(.*)/);
        let ref = match ? match[1] : `구절 ${i+1}`;
        let text = (match ? match[2] : vStr).replace(/\{|\}/g, "");

        const div = document.createElement('div');
        div.className = 'quiz-item';
        div.style.cssText = "margin-bottom:20px; padding:20px; background:white; border-radius:15px; border-left:5px solid #007AFF;";
        
        let headerHtml = `<div style="font-weight:900; color:#007AFF; margin-bottom:12px;">문항 ${i+1} (${ref}절)</div>`;
        
        if (Math.random() < 0.4) { // 40% 확률 전체 쓰기
            currentAnswers.push(text);
            div.innerHTML = headerHtml + `<textarea class="q-inline-input" data-ref="${ref}절" style="width:100%; min-height:80px; border-bottom:3px solid #007AFF; color:#007AFF; font-weight:bold; padding:10px;" placeholder="구절 전체를 입력하세요 (입력)"></textarea>`;
        } else {
            let words = text.split(' ');
            let quizHTML = "";
            
            // 빈칸 후보군 선정 (STOP_WORDS 제외 및 특수기호 제거 후 판단)
            let isBlankCandidate = words.map(w => {
                let cleanW = w.replace(/[.,?!]/g, "");
                return cleanW.length >= 2 && !STOP_WORDS.has(cleanW);
            });
            
            // 🚨 지능형 병합 강화: 인접한 빈칸 후보들을 최대 4단어까지 하나로 합침
            let chunks = [];
            for (let j = 0; j < words.length; j++) {
                if (isBlankCandidate[j]) {
                    let chunk = words[j];
                    let startIdx = j;
                    // 💡 [병합 강화] 다음 단어도 후보면 최대 3~4단어까지 합침
                    while (j + 1 < words.length && isBlankCandidate[j + 1] && (j - startIdx) < 3) {
                        chunk += " " + words[++j];
                    }
                    chunks.push({ text: chunk, isBlank: true });
                } else {
                    chunks.push({ text: words[j], isBlank: false });
                }
            }

            // 전체 청크 중 약 25%~30%만 실제로 빈칸 처리하여 가독성 유지
            let blankChunks = chunks.filter(c => c.isBlank);
            blankChunks.sort(() => Math.random() - 0.5);
            let targetCount = Math.ceil(blankChunks.length * 0.28) || 1;
            let finalTargets = new Set(blankChunks.slice(0, targetCount).map(c => c.text));

            chunks.forEach(chunk => {
                if (chunk.isBlank && finalTargets.has(chunk.text)) {
                    currentAnswers.push(chunk.text);
                    // 글자 수에 비례한 입력창 너비 (최대 18em으로 확장)
                    const width = Math.min(chunk.text.length * 1.2 + 2, 18);
                    quizHTML += `<input type="text" class="q-inline-input" data-ref="${ref}절" style="width:${width}em; max-width:98%; border-bottom:3px solid #007AFF; color:#007AFF; font-weight:800; text-align:center; margin: 2px 0;" placeholder="입력"> `;
                } else {
                    quizHTML += `<span style="color:#007AFF; font-weight:600; font-size:1.05rem;">${chunk.text}</span> `;
                }
            });

            div.innerHTML = headerHtml + `<div style="line-height:2.4; word-break: keep-all;">${quizHTML}</div>`;
        }
        quizText.appendChild(div);
    });
    window.scrollTo(0,0);
}