// common.js 기존 내용 아래에 이 함수를 추가하거나, 덮어쓰기 하세요.

/**
 * 👑 common.js: 오답 노트 및 단계별 UI 전환 통합 엔진
 */
const tg = window.Telegram.WebApp;
tg.expand();

// 백엔드 서버 주소
const SERVER_URL = "https://script.google.com/macros/s/AKfycbw238LQiorJpRUX_okKLvyH6EB65GSgq0D9kfiJNpWiUd35LZG_9o5sEbh0ZdJRC9TA/exec";
const GROUP_LINK = "https://t.me/+akm0mVey8WQ4OTBl"; 

let allData = []; 
let currentAnswers = []; 

/**
 * 1. 초기화 및 데이터 로드
 */
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

/**
 * 2. 네비게이션 UI 업데이트 (화면 전환 시 버튼 자동 제어)
 */
function updateNavUI(isMain) {
    const bottomNav = document.getElementById('bottom-action-bar');
    const topPlus = document.getElementById('top-right-plus');

    if (isMain) {
        if (bottomNav) bottomNav.style.display = 'flex';
        if (topPlus) topPlus.style.display = 'none'; // 메인에서는 상단바 버튼 숨김
    } else {
        if (bottomNav) bottomNav.style.display = 'none';
        // 퀴즈 화면이 아닐 때만 공통 플러스 버튼 표시 (퀴즈 화면엔 전용 버튼 있음)
        const quizArea = document.getElementById('quiz-area');
        if (quizArea && quizArea.style.display === 'block') {
            if (topPlus) topPlus.style.display = 'none';
        } else {
            if (topPlus) topPlus.style.display = 'flex';
        }
    }
}

// 팝업(시트) 토글
function toggleIOSSheet() {
    const overlay = document.getElementById('ios-sheet-overlay');
    if (!overlay) return;
    if (overlay.style.display === 'block') {
        overlay.classList.remove('active');
        setTimeout(() => { overlay.style.display = 'none'; }, 400);
    } else {
        overlay.style.display = 'block';
        setTimeout(() => { overlay.classList.add('active'); }, 10);
    }
}

/**
 * 3. 화면 전환 함수들
 */
function hideAllSections() {
    ['main-menu', 'list-area', 'quiz-area', 'result-area', 'quarter-menu', 'capture-guide', 'nickname-area'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
}

function showMain() {
    hideAllSections();
    document.getElementById('main-menu').style.display = 'block';
    updateNavUI(true);
}

function showQuarterMenu() {
    hideAllSections();
    document.getElementById('quarter-menu').style.display = 'block';
    updateNavUI(false);
}

function backToListArea() {
    hideAllSections();
    document.getElementById('list-area').style.display = 'block';
    updateNavUI(false);
}

// 🚨 [신규] 퀴즈 초기화 함수 (우측 상단 버튼 연결)
function resetAllQuiz() {
    if(!confirm("모든 입력 내용을 지우고 처음부터 다시 하시겠습니까?")) return;
    
    const inputs = document.querySelectorAll('.q-inline-input');
    inputs.forEach(input => {
        input.value = '';
        input.readOnly = false;
        input.classList.remove('input-correct', 'input-wrong');
    });
    
    // 스크롤 맨 위로
    window.scrollTo(0,0);
}


/**
 * 4. 결과 화면 및 오답 노트
 */
function submitQuiz() {
    const inputs = document.querySelectorAll('.q-inline-input');
    if (inputs.length === 0) return;

    let correctCount = 0;
    const total = currentAnswers.length;
    const userAnswers = []; 

    inputs.forEach((input, index) => {
        const userVal = input.value.trim();
        userAnswers.push(userVal); 
        
        const correctVal = currentAnswers[index] ? currentAnswers[index].trim().replace(/\s/g, '') : "";
        const cleanUserVal = userVal.replace(/\s/g, '');
        const isCorrect = (cleanUserVal === correctVal && cleanUserVal !== "");

        if (isCorrect) {
            correctCount++;
            input.classList.add('input-correct');
            input.classList.remove('input-wrong');
        } else {
            input.classList.add('input-wrong');
            input.classList.remove('input-correct');
        }
        input.readOnly = true; 
    });

    const finalScore = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    
    if (typeof saveScoreToDB === 'function') {
        saveScoreToDB(finalScore);
    }

    renderReviewNote(currentAnswers, userAnswers);

    document.getElementById('quiz-area').style.display = 'none';
    const resultArea = document.getElementById('result-area');
    resultArea.style.display = 'flex';
    
    // 챕터 뱃지 렌더링
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
                총 ${total}문제 중 <b>${correctCount}문제</b> 정답!
            </div>
            <button class="submit-btn primary-action-btn" onclick="autoCaptureAndShare()" data-html2canvas-ignore="true">📸 챌린지 인증하기</button>
            <p style="margin-top:10px; font-size:11px; opacity:0.5;">© 청년회 계시록 통달 챌린지</p>
        `;
    }
    
    updateNavUI(false); 
    window.scrollTo(0, 0);
}

function renderReviewNote(correctList, userList) {
    const container = document.getElementById('review-list');
    container.innerHTML = "";
    
    correctList.forEach((ans, idx) => {
        const userVal = userList[idx] || "";
        const cleanUser = userVal.replace(/\s/g, '');
        const cleanAns = ans.replace(/\s/g, '');
        
        if (cleanUser !== cleanAns) {
            const div = document.createElement('div');
            div.className = 'review-item';
            div.innerHTML = `
                <div style="font-size:14px; color:#555; margin-bottom:4px;">${idx + 1}번 문제</div>
                <div style="color:#FF3B30; text-decoration:line-through; font-size:15px; margin-bottom:2px;">${userVal || "(미입력)"}</div>
                <div style="color:#007AFF; font-weight:700; font-size:16px;">${ans}</div>
            `;
            container.appendChild(div);
        }
    });

    if (container.innerHTML === "") {
        container.innerHTML = "<div style='text-align:center; padding:20px; color:#555;'>🎉 완벽합니다! 오답이 없습니다.</div>";
    }
}

// 초기 실행
window.addEventListener('DOMContentLoaded', init);