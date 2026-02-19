/**
 * 👑 common.js: 오답 노트 및 단계별 UI 전환 통합 엔진
 * 업데이트: 치우침 없는 깔끔한 중앙 정렬 글래스모피즘 팝업 모션 최적화
 */
const tg = window.Telegram.WebApp;
tg.expand();

const SERVER_URL = "https://script.google.com/macros/s/AKfycbw238LQiorJpRUX_okKLvyH6EB65GSgq0D9kfiJNpWiUd35LZG_9o5sEbh0ZdJRC9TA/exec";
const GROUP_LINK = "https://t.me/+akm0mVey8WQ4OTBl"; 

let allData = []; 
let currentAnswers = []; 

// 🚨 모드 상태 관리 변수
let isRealtimeMode = false;
let isIgnoreSpaceMode = false;

async function init() {
    const loader = document.getElementById('loading');
    try {
        const res = await fetch(`${SERVER_URL}?action=list`);
        allData = await res.json();
        if (typeof updateRankingUI === 'function') updateRankingUI();
    } catch (e) {
        console.error("데이터 로드 실패");
    } finally {
        if (loader) loader.style.display = 'none';
        showMain(); 
    }
}

function updateNavUI(isMain) {
    const bottomNav = document.getElementById('bottom-action-bar');
    const topPlus = document.getElementById('top-right-plus');

    if (isMain) {
        if (bottomNav) bottomNav.style.display = 'flex';
        if (topPlus) topPlus.style.display = 'none'; 
    } else {
        if (bottomNav) bottomNav.style.display = 'none';
        if (topPlus) topPlus.style.display = 'flex';
    }
}

// 🚨 중앙에서 부드럽게 나타나는 팝업 제어
function toggleIOSSheet() {
    const overlay = document.getElementById('ios-sheet-overlay');
    if (!overlay) return;
    
    const isQuizActive = document.getElementById('quiz-area')?.style.display === 'block';
    const menuGeneral = document.getElementById('menu-general');
    const menuQuiz = document.getElementById('menu-quiz');
    
    // 상황에 맞는 메뉴 HTML 노출
    if (isQuizActive) {
        if (menuGeneral) menuGeneral.style.display = 'none';
        if (menuQuiz) menuQuiz.style.display = 'block';
    } else {
        if (menuGeneral) menuGeneral.style.display = 'block';
        if (menuQuiz) menuQuiz.style.display = 'none';
    }

    if (overlay.classList.contains('active')) {
        // 닫힐 때: 부드럽게 작아지면서 사라짐
        overlay.classList.remove('active');
        // CSS transition 시간(0.3초)이 완전히 끝난 후 display none 처리
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
    } else {
        // 열릴 때: 화면 중앙에 완벽하게 배치(flex) 후 애니메이션 발동
        overlay.style.display = 'flex';
        // 브라우저 렌더링 프레임 확보 후 클래스 추가 (매우 중요)
        setTimeout(() => { overlay.classList.add('active'); }, 20);
    }
}

// 🌟 청년회 소식 아코디언 메뉴
window.toggleNewsAccordion = function() {
    const content = document.getElementById('news-content');
    const arrow = document.getElementById('news-arrow');
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        arrow.style.transform = 'rotate(0deg)';
    } else {
        content.classList.add('expanded');
        arrow.style.transform = 'rotate(180deg)';
    }
};

// 🚨 모드 UI 텍스트 업데이트
function updateModeStatusUI() {
    const rtStatus = document.getElementById('status-realtime');
    const isStatus = document.getElementById('status-ignorespace');
    if(rtStatus) rtStatus.innerText = isRealtimeMode ? '🟢 켜짐' : '⚪ 꺼짐';
    if(isStatus) isStatus.innerText = isIgnoreSpaceMode ? '🟢 켜짐' : '⚪ 꺼짐';
}

function toggleRealtimeMode() {
    isRealtimeMode = !isRealtimeMode;
    updateModeStatusUI();
    toggleIOSSheet(); 
    applyRealtimeCheckToAll(); 
}

function toggleIgnoreSpaceMode() {
    isIgnoreSpaceMode = !isIgnoreSpaceMode;
    updateModeStatusUI();
    toggleIOSSheet(); 
    applyRealtimeCheckToAll(); 
}

function applyRealtimeCheckToAll() {
    const inputs = document.querySelectorAll('.q-inline-input');
    inputs.forEach(input => {
        if (isRealtimeMode) {
            checkInputRealtime(input);
        } else {
            input.style.color = 'var(--ios-blue)'; 
        }
    });
}

function checkInputRealtime(input) {
    if (!isRealtimeMode) return;
    let userVal = input.value;
    if (!userVal) {
        input.style.color = 'var(--ios-blue)';
        return;
    }
    
    let ans = input.dataset.ans || "";
    let checkUser = isIgnoreSpaceMode ? userVal.replace(/\s/g, '') : userVal;
    let checkAns = isIgnoreSpaceMode ? ans.replace(/\s/g, '') : ans;

    if (checkAns.startsWith(checkUser)) {
        input.style.color = '#28a745'; 
    } else {
        input.style.color = '#dc3545'; 
    }
}

function showHintModal() {
    const modal = document.getElementById('hint-modal');
    if(modal) {
        modal.style.display = 'flex'; // 중앙 정렬
        setTimeout(() => { modal.classList.add('active'); }, 10);
    }
}
function closeHintModal() {
    const modal = document.getElementById('hint-modal');
    if(modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 400);
    }
}

function hideAllSections() {
    ['main-menu', 'list-area', 'quiz-area', 'result-area', 'quarter-menu', 'capture-guide', 'nickname-area'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
}

function showMain() {
    hideAllSections();
    document.getElementById('main-menu').style.display = 'flex';
    updateNavUI(true);
}

function showQuarterMenu() {
    hideAllSections();
    document.getElementById('quarter-menu').style.display = 'block';
    updateNavUI(false);
}

function resetAllQuiz() {
    if(!confirm("모든 입력 내용을 지우고 처음부터 다시 하시겠습니까?")) return;
    
    const inputs = document.querySelectorAll('.q-inline-input');
    inputs.forEach(input => {
        input.value = '';
        input.readOnly = false;
        input.classList.remove('input-correct', 'input-wrong');
        input.style.color = 'var(--ios-blue)';
    });
    window.scrollTo(0,0);
}

function submitQuiz() {
    const inputs = document.querySelectorAll('.q-inline-input');
    if (inputs.length === 0) return;

    let correctCount = 0;
    const totalBlanks = inputs.length; 
    const reviewData = []; 

    inputs.forEach((input, index) => {
        const userVal = input.value.trim();
        const correctValRaw = currentAnswers[index] ? currentAnswers[index].trim() : "";
        const ref = input.dataset.ref || `문항 ${index + 1}`; 
        
        const normalize = (text) => {
            let t = text.replace(/찌어다/g, '지어다').trim();
            if (isIgnoreSpaceMode) {
                return t.replace(/\s/g, ''); 
            } else {
                return t.replace(/\s+/g, ' '); 
            }
        };

        const cleanUserVal = normalize(userVal);
        const cleanCorrectVal = normalize(correctValRaw);
        
        const isCorrect = (cleanUserVal === cleanCorrectVal && cleanUserVal !== "");

        if (isCorrect) {
            correctCount++;
            input.classList.add('input-correct');
            input.classList.remove('input-wrong');
            input.style.color = '#28a745'; 
        } else {
            input.classList.add('input-wrong');
            input.classList.remove('input-correct');
            input.style.color = '#dc3545'; 
            
            reviewData.push({
                ref: ref,
                user: userVal || "(미입력)",
                answer: correctValRaw
            });
        }
        input.readOnly = true; 
    });

    const finalScore = totalBlanks > 0 ? Math.round((correctCount / totalBlanks) * 100) : 0;
    
    if (typeof saveScoreToDB === 'function') {
        saveScoreToDB(finalScore);
    }

    renderReviewNoteGrouped(reviewData);

    document.getElementById('quiz-area').style.display = 'none';
    const resultArea = document.getElementById('result-area');
    resultArea.style.display = 'flex';
    
    let chapterNameDisplay = "통달 시험";
    if (typeof currentChapter !== 'undefined' && currentChapter) {
        if (typeof currentChapter === 'string') chapterNameDisplay = currentChapter;
        else if (currentChapter.name) chapterNameDisplay = currentChapter.name;
        else if (currentChapter.title) chapterNameDisplay = currentChapter.title;
    }

    const header = resultArea.querySelector('.result-header');
    if (header) {
        header.innerHTML = `
            <div class="result-chapter-badge">${chapterNameDisplay}</div>
            <h2>오늘 암송 인증</h2>
            <div id="score-text">${finalScore}점</div>
            <div id="score-msg" style="margin-bottom: 15px;">
                총 ${totalBlanks}개 빈칸 중 <b>${correctCount}개</b> 정답!
            </div>
            <button class="submit-btn primary-action-btn" onclick="autoCaptureAndShare()" data-html2canvas-ignore="true">📸 챌린지 인증하기</button>
            <p style="margin-top:10px; font-size:11px; opacity:0.5;">© 청년회 계시록 통달 챌린지</p>
        `;
    }
    
    updateNavUI(false); 
    window.scrollTo(0, 0);
}

function renderReviewNoteGrouped(reviewData) {
    const container = document.getElementById('review-list');
    container.innerHTML = "";
    
    if (reviewData.length === 0) {
        container.innerHTML = "<div style='text-align:center; padding:20px; color:#555;'>🎉 완벽합니다! 오답이 없습니다.</div>";
        return;
    }

    const groups = {};
    reviewData.forEach(item => {
        if (!groups[item.ref]) {
            groups[item.ref] = [];
        }
        groups[item.ref].push(item);
    });

    for (const [ref, items] of Object.entries(groups)) {
        const groupDiv = document.createElement('div');
        groupDiv.style.cssText = "background:white; border-radius:14px; padding:15px; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05);";
        
        let groupHTML = `<div style="font-weight:900; color:#1c1c1e; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">📖 ${ref}</div>`;
        
        items.forEach(item => {
            groupHTML += `
                <div style="margin-bottom:12px; font-size:15px;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:2px;">
                        <span style="font-size:13px; color:#FF3B30; font-weight:700;">내 답:</span>
                        <span style="color:#FF3B30; text-decoration:line-through;">${item.user}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:13px; color:#007AFF; font-weight:700;">정답:</span>
                        <span style="color:#007AFF; font-weight:700;">${item.answer}</span>
                    </div>
                </div>
            `;
        });
        
        groupDiv.innerHTML = groupHTML;
        container.appendChild(groupDiv);
    }
}

window.addEventListener('DOMContentLoaded', init);