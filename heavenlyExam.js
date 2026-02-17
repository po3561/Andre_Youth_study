/**
 * 👑 heavenlyExam.js: 천국고시 최종 통합 엔진 (무결성 검증 완료)
 * 수정 사항: 
 * 1. [Critical Fix] showQuarterMenu 진입 시 하단 바 숨김(false) 강제 적용
 * 2. 챕터 리스트 및 퀴즈 로직 데이터 연동 검증 완료
 */

// 🟢 1. 상태 관리 및 캐시
let heavenlyData = null; 
const heavenlyCache = {};

/**
 * 📂 메뉴 전환: 메인 -> 분기 선택
 * [Fix] 메인을 벗어나므로 하단 바를 숨기고 상단 버튼을 활성화합니다.
 */
function showQuarterMenu(highlightId, color) {
    // 1. 모든 섹션 숨기기
    if (typeof hideAllSections === 'function') {
        hideAllSections(); 
    }

    // 2. 분기 선택 메뉴 노출
    const quarterMenu = document.getElementById('quarter-menu');
    if (quarterMenu) quarterMenu.style.display = 'block';
    
    // 🚨 [무결성 수정] 메인이 아니므로 하단 바 숨김 (false)
    if (typeof updateNavUI === 'function') {
        updateNavUI(false); 
    }

    // 💡 3. 특정 분기 강조 로직
    if (highlightId && color) {
        const targetBtn = document.getElementById(highlightId);
        if (targetBtn) {
            targetBtn.style.backgroundColor = color;
            targetBtn.style.color = "white"; 
            targetBtn.style.boxShadow = "0 8px 20px rgba(245, 18, 18, 0.15)";
        }
    }

    window.scrollTo(0, 0);
}

/**
 * 📂 데이터 로드 (백엔드 통신)
 */
async function loadQuarterData(qName) {
    const loadingEl = document.getElementById('loading');
    if(loadingEl) loadingEl.style.display = 'block';
    
    // 분기 선택 메뉴 숨김
    const quarterMenu = document.getElementById('quarter-menu');
    if (quarterMenu) quarterMenu.style.display = 'none';
    
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
        } else {
            throw new Error("데이터 구조가 올바르지 않습니다.");
        }
    } catch (e) { 
        console.error("데이터 로드 실패:", e);
        alert("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        showQuarterMenu();
    } finally {
        if(loadingEl) loadingEl.style.display = 'none';
    }
}

/**
 * 📂 장 목록 렌더링
 */
function renderChapterList(qName) {
    const listArea = document.getElementById('list-area');
    const fileContainer = document.getElementById('file-container');
    
    if (!listArea || !fileContainer) return;

    if (typeof hideAllSections === 'function') hideAllSections();

    listArea.style.display = 'block';
    
    // 서브 페이지이므로 하단 바 숨김
    if (typeof updateNavUI === 'function') updateNavUI(false);
    
    fileContainer.innerHTML = `<h3 style="text-align:center; color:#007AFF; margin-bottom:20px; font-weight:800;">🏆 ${qName} 목록</h3>`;

    heavenlyData.chapters.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'glass-card'; 
        card.style.cssText = "padding: 20px; margin-bottom: 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: white; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);";
        
        card.innerHTML = `
            <span style="font-weight:700; font-size:16px; color:#1c1c1e;">제 ${ch.name} 시험 보기</span>
            <span style="color:#C7C7CC; font-weight:600;">〉</span>
        `;
        
        // rank.js의 openNicknamePage 호출
        card.onclick = () => {
            if(typeof openNicknamePage === 'function') {
                openNicknamePage(ch);
            } else {
                alert("랭킹 모듈(rank.js)이 로드되지 않았습니다.");
            }
        };
        fileContainer.appendChild(card);
    });
    window.scrollTo(0, 0);
}

/**
 * 📝 퀴즈 엔진
 */
function startHeavenlyQuiz(chapter) {
    if (typeof hideAllSections === 'function') hideAllSections();
    
    const quizArea = document.getElementById('quiz-area');
    const quizTitle = document.getElementById('quiz-title');
    const quizText = document.getElementById('quiz-text');

    if (!quizArea) return;

    quizArea.style.display = 'block';
    // 퀴즈 화면에서도 하단 바 숨김
    if (typeof updateNavUI === 'function') updateNavUI(false);
    
    quizTitle.innerText = `계시록 제 ${chapter.name}`;
    quizText.innerHTML = "";
    currentAnswers = []; 

    const shuffled = [...chapter.verses].sort(() => Math.random() - 0.5);
    const count = Math.min(shuffled.length, 10); 
    const selected = shuffled.slice(0, count);

    selected.forEach((vStr, i) => {
        const match = vStr.match(/^\[?(\d+[:：]\d+)\]?\s*(.*)/);
        let ref = match ? match[1] : `구절 ${i+1}`;
        let text = match ? match[2] : vStr;

        const div = document.createElement('div');
        div.className = 'quiz-item';
        div.style.cssText = "margin-bottom:20px; padding:20px; background:white; border-radius:15px; border-left:5px solid #007AFF; box-shadow: 0 4px 12px rgba(0,0,0,0.05);";
        
        const isWhole = Math.random() < 0.4; 
        let headerHtml = `<div style="font-weight:bold; color:#007AFF; margin-bottom:10px; font-size:0.95rem;">문항 ${i+1} (${ref}절)</div>`;
        
        if (isWhole) {
            const cleanText = text.replace(/\{|\}/g, "");
            div.innerHTML = headerHtml + `<textarea class="q-inline-input" data-ans="${cleanText}" style="width:100%; min-height:80px; padding:12px; border:1px solid #E5E5EA; border-radius:10px; background:#F9F9F9; font-size:1rem; color:#333; outline:none; display:block; line-height:1.5; resize:none;" placeholder="구절 전체를 입력하세요"></textarea>`;
            currentAnswers.push(cleanText);
        } else {
            const allMatches = [...text.matchAll(/\{(.*?)\}/g)];
            let candidates = allMatches.filter(m => m[1].length < 8);
            
            if (candidates.length === 0 && allMatches.length > 0) {
                candidates = allMatches.sort((a,b) => a[1].length - b[1].length).slice(0, 1);
            }

            const targets = candidates.slice(0, 4);

            let tempText = text.replace(/\{(.*?)\}/g, (match, p1) => {
                const isTarget = targets.some(t => t[0] === match);
                if (isTarget) {
                    currentAnswers.push(p1);
                    const width = Math.max(p1.length * 1.2, 3); 
                    return `<input type="text" class="q-inline-input" data-ans="${p1}" style="width:${width}em; border:none; border-bottom:2px solid #007AFF; background:#F2F7FF; font-weight:bold; color:#d93025; text-align:center; padding:2px 4px; margin:0 4px; outline:none; border-radius:4px;">`;
                } else {
                    return `<span style="font-weight:bold; color:#007AFF;">${p1}</span>`;
                }
            });

            div.innerHTML = headerHtml + `<div style="line-height:2.0; font-size:1.05rem; color:#333;">${tempText}</div>`;
        }
        quizText.appendChild(div);
    });
    window.scrollTo(0,0);
}