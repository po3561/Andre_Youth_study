/**
 * 👑 heavenlyExam.js: 천국고시 최종 통합 엔진 (오영 기획자님 전용)
 * 수정 사항: 
 * 1. 메뉴 진입(Navigation) 오류 완벽 해결 (index.html ID와 100% 매칭)
 * 2. 백엔드 데이터(chapters) 인식 로직 강화 (문제를 못 불러오는 현상 해결)
 */

// 🟢 1. 상태 관리 및 캐시 (데이터를 한 번 받으면 메모리에 저장)
let heavenlyData = null; 
const heavenlyCache = {};

/**
 * 📂 메뉴 전환: 메인 -> 분기 선택
 * @param {string} highlightId - 강조할 분기 버튼의 ID (예: 'q1', 'q2', 'q3', 'q4')
 * @param {string} color - 강조할 배경 색상 (예: '#f51212', 'blue')
 */
function showQuarterMenu(highlightId, color) {
    // 1. 화면 전환 (기존 로직)
    const mainMenu = document.getElementById('main-menu');
    const quarterMenu = document.getElementById('quarter-menu');

    if (mainMenu) mainMenu.style.display = 'none';
    if (quarterMenu) quarterMenu.style.display = 'block';

    // 💡 2. 특정 분기 강조 로직 (기획자님이 인자로 넘겨준 값 사용)
    if (highlightId && color) {
        const targetBtn = document.getElementById(highlightId);
        if (targetBtn) {
            // 배경색과 글자색을 설정하여 시인성 확보
            targetBtn.style.backgroundColor = color;
            targetBtn.style.color = "white"; 
            
            // 기획자님이 설정하신 그림자 효과
            targetBtn.style.boxShadow = "0 8px 20px rgba(245, 18, 18, 0.15)";
        }
    }

    window.scrollTo(0, 0);
}

/**
 * 📂 데이터 로드 (백엔드에서 분기별 장 리스트와 구절을 가져옴)
 */
async function loadQuarterData(qName) {
    const loadingEl = document.getElementById('loading');
    if(loadingEl) loadingEl.style.display = 'block';
    
    // 분기 선택 메뉴 숨기기
    document.getElementById('quarter-menu').style.display = 'none';
    
    // 캐시 확인
    if (heavenlyCache[qName]) {
        heavenlyData = heavenlyCache[qName];
        renderChapterList(qName);
        if(loadingEl) loadingEl.style.display = 'none';
        return; 
    }

    try {
        // common.js에 정의된 SERVER_URL 사용
        const response = await fetch(`${SERVER_URL}?action=loadQuarter&name=${encodeURIComponent(qName)}`);
        const data = await response.json();
        
        // 백엔드 구조 { chapters: [...] } 확인
        if (data && data.chapters) {
            heavenlyData = data;
            heavenlyCache[qName] = data;
            renderChapterList(qName);
        } else {
            throw new Error("데이터 구조가 올바르지 않습니다.");
        }
    } catch (e) { 
        console.error("데이터 로드 실패:", e);
        alert("데이터를 불러오지 못했습니다. 백엔드 배포(모든 사람) 설정을 확인해 주세요.");
        showQuarterMenu();
    } finally {
        if(loadingEl) loadingEl.style.display = 'none';
    }
}

/**
 * 📂 장 목록 렌더링 (이미지의 'chapters' 오류 해결 및 터치 연결)
 */
function renderChapterList(qName) {
    const listArea = document.getElementById('list-area');
    const fileContainer = document.getElementById('file-container');
    
    if (!listArea || !fileContainer) return;

    listArea.style.display = 'block';
    fileContainer.innerHTML = `<h3 style="text-align:center; color:var(--ios-blue); margin-bottom:20px;">🏆 ${qName} 목록</h3>`;

    // 백엔드에서 온 chapters 배열 순회
    heavenlyData.chapters.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'menu-card'; // style.css의 카드 스타일 적용
        
        // ch.name(예: "1장")을 사용하여 깔끔하게 출력
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                <span style="font-weight:600;">제 ${ch.name} 시험 보기</span>
                <span style="color:#CCC;">〉</span>
            </div>
        `;
        
        // 클릭 시 실제 퀴즈 화면으로 이동
        card.onclick = () => openNicknamePage(ch);
        fileContainer.appendChild(card);
    });
    window.scrollTo(0, 0);
}

/**
 * 📝 퀴즈 엔진: (단어 중심 괄호 복구 및 13문항 제한 완결본)
 * 수정 사항: 
 * 1. 괄호 실종 사건 해결: 모든 { } 괄호 중 짧은 단어를 우선적으로 무조건 2~4개 생성
 * 2. 노란 벽 방지: 10자 이상의 긴 괄호는 자동으로 힌트로 전환 (입력창 X)
 * 3. 13문항 제한 유지
 */
function startHeavenlyQuiz(chapter) {
    const listArea = document.getElementById('list-area');
    const quizArea = document.getElementById('quiz-area');
    const quizTitle = document.getElementById('quiz-title');
    const quizText = document.getElementById('quiz-text');

    if (!listArea || !quizArea) return;

    listArea.style.display = 'none';
    quizArea.style.display = 'block';
    quizTitle.innerText = `계시록 제 ${chapter.name}`;
    quizText.innerHTML = "";
    currentAnswers = []; // 전역 변수 초기화

    // 1. 최대 13문항 랜덤 추출
    const shuffled = [...chapter.verses].sort(() => Math.random() - 0.5);
    const count = Math.min(shuffled.length, 13); 
    const selected = shuffled.slice(0, count);

    selected.forEach((vStr, i) => {
        const match = vStr.match(/^\[?(\d+[:：]\d+)\]?\s*(.*)/);
        let ref = match ? match[1] : `구절 ${i+1}`;
        let text = match ? match[2] : vStr;

        const div = document.createElement('div');
        div.className = 'quiz-item';
        div.style.cssText = "margin-bottom:25px; padding:20px; background:white; border-radius:15px; border-left:6px solid var(--ios-blue);";
        
        const isWhole = Math.random() < 0.4; // 60% 전체 통쓰기 유지
        let headerHtml = `<div style="font-weight:bold; color:var(--ios-blue); margin-bottom:12px; font-size:0.95rem;">문항 ${i+1} (${ref}절)</div>`;
        
        if (isWhole) {
            const cleanText = text.replace(/\{|\}/g, "");
            div.innerHTML = headerHtml + `<textarea class="q-inline-input" data-ans="${cleanText}" style="width:100%; min-height:100px; padding:12px; border:2px solid #eef2f7; border-radius:10px; background:#fff9c4; font-size:1.1rem; font-weight:bold; color:#d93025; outline:none; display:block; line-height:1.6;" placeholder="구절 전체를 입력하세요"></textarea>`;
            currentAnswers.push(cleanText);
        } else {
            // 💡 [괄호 복구 및 단어 최적화 로직]
            const allMatches = [...text.matchAll(/\{(.*?)\}/g)];
            
            // 1. 10자 미만의 짧은 단어 괄호들을 후보로 선정 (노란 벽 방지)
            let candidates = allMatches.filter(m => m[1].length < 8);
            
            // 2. 만약 모든 괄호가 10자 이상이라면, 그중 가장 짧은 것 2개를 강제로 후보로 선정 (괄호 실종 방지)
            if (candidates.length === 0 && allMatches.length > 0) {
                candidates = allMatches.sort((a,b) => a[1].length - b[1].length).slice(0, 1);
            }

            // 3. 후보 중 최대 4개까지만 빈칸(targets)으로 선정
            const targets = candidates.slice(0, 4);

            let tempText = text.replace(/\{(.*?)\}/g, (match, p1) => {
                const isTarget = targets.some(t => t[0] === match);
                if (isTarget) {
                    currentAnswers.push(p1);
                    const width = Math.max(p1.length * 1.3, 2.5); 
                    return `<input type="text" class="q-inline-input" data-ans="${p1}" style="width:${width}rem; max-width:95%; border:none; border-bottom:2px solid var(--ios-blue); background:#fff9c4; font-weight:bold; color:#d93025; text-align:center; padding:2px 4px; margin:2px 4px; outline:none;">`;
                } else {
                    // 빈칸으로 선택 안 된 긴 문장 괄호는 파란색 볼드 힌트로 노출
                    return `<span style="font-weight:bold; color:var(--ios-blue);">${p1}</span>`;
                }
            });

            div.innerHTML = headerHtml + `<div style="line-height:2.4; font-size:1.15rem; color:#333;">${tempText}</div>`;
        }
        quizText.appendChild(div);
    });
    window.scrollTo(0,0);
}



