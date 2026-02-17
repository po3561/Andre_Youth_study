/**
 * 👑 common.js: 오답 노트 및 단계별 UI 전환 통합 엔진
 */
const tg = window.Telegram.WebApp;
tg.expand();

// 백엔드 서버 주소 및 텔레그램 링크
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
        showMain(); // 초기 로드 후 메인 화면으로
    }
}

/**
 * 2. ✨ 네비게이션 UI 업데이트 (버튼 위치 자동 조정)
 * 메인 화면에서는 하단 바 노출, 다른 화면에서는 상단 플러스 버튼 노출
 */
function updateNavUI(isMain) {
    const bottomBar = document.getElementById('bottom-action-bar');
    const topPlus = document.getElementById('top-right-plus');
    
    if (isMain) {
        if (bottomBar) bottomBar.style.display = 'flex';
        if (topPlus) topPlus.style.display = 'none';
    } else {
        if (bottomBar) bottomBar.style.display = 'none';
        if (topPlus) topPlus.style.display = 'flex';
    }
}

/**
 * 3. [핵심 로직] 시험지 제출 및 오답 노트 생성
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
    document.getElementById('result-area').style.display = 'flex';
    document.getElementById('score-text').textContent = finalScore + "점";
    
    updateNavUI(false); // 결과 화면에서도 상단 버튼으로 전환

    const scoreMsg = document.getElementById('score-msg');
    if (scoreMsg) {
        scoreMsg.innerHTML = `총 ${total}문제 중 <b>${correctCount}문제</b> 통달 완료!`;
    }
    window.scrollTo(0, 0);
}

/**
 * 4. 📝 오답 노트를 화면에 그리는 함수
 */
function renderReviewNote(correctAnswers, userAnswers) {
    const listEl = document.getElementById('review-list');
    if (!listEl) return;
    listEl.innerHTML = ""; 

    correctAnswers.forEach((correctVal, index) => {
        const uAns = (userAnswers[index] || "").trim();
        const cAns = correctVal.trim();
        const isCorrect = (uAns.replace(/\s/g, '') === cAns.replace(/\s/g, ''));

        const div = document.createElement('div');
        div.className = 'review-item';
        div.style.cssText = "background:#fff; border-radius:10px; padding:15px; margin-bottom:12px; border:1px solid #eee; text-align:left;";
        
        div.innerHTML = `
            <div class="review-q" style="font-weight:bold; margin-bottom:5px;">${index + 1}번 문제</div>
            <div class="review-user-ans" style="font-size:0.9em; color:${isCorrect ? '#2e7d32' : '#f44336'}">
                ${isCorrect ? '✅ 통달!' : '❌ 미흡'} (작성: ${uAns || '빈칸'})
            </div>
            ${!isCorrect ? `<div class="review-correct-ans" style="color:#f44336; font-weight:bold; font-size:0.9em; margin-top:5px;">💡 정답: ${cAns}</div>` : ''}
        `;
        listEl.appendChild(div);
    });
}

/**
 * 5. ✨ 바텀 시트 팝업 토글 함수 (모션 버그 해결)
 * display와 opacity의 충돌을 방지하기 위해 setTimeout을 사용합니다.
 */
function toggleIOSSheet() {
    const overlay = document.getElementById('ios-sheet-overlay');
    if (!overlay) return;

    if (overlay.classList.contains('active')) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 400); // CSS transition 시간과 동기화
    } else {
        overlay.style.display = 'block';
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10); // 렌더링 지연 후 애니메이션 시작
    }
}

/**
 * 6. 화면 전환 함수들 (UI 업데이트 연동)
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
    updateNavUI(true); // 메인 화면이므로 하단 바 노출
}

function showQuarterMenu() {
    hideAllSections();
    document.getElementById('quarter-menu').style.display = 'block';
    updateNavUI(false); // 분기 선택부터는 상단 플러스 버튼으로 전환
}

function backToListArea() {
    hideAllSections();
    document.getElementById('list-area').style.display = 'block';
    updateNavUI(false);
}

function resetAllQuiz() {
    if(confirm("작성 중인 내용을 초기화하고 다시 풀겠습니까?")) {
        const inputs = document.querySelectorAll('.q-inline-input');
        inputs.forEach(input => {
            input.value = "";
            input.classList.remove('input-correct', 'input-wrong');
            input.readOnly = false;
        });
    }
}

function goToChallengeGroup() {
    window.open(GROUP_LINK, '_blank');
}

window.addEventListener('DOMContentLoaded', init);