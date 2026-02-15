/**
 * 👑 common.js: 오답 노트 및 단계별 뒤로가기 통합본
 */
const tg = window.Telegram.WebApp;
tg.expand();

// 백엔드 서버 주소
const SERVER_URL = "https://script.google.com/macros/s/AKfycbw238LQiorJpRUX_okKLvyH6EB65GSgq0D9kfiJNpWiUd35LZG_9o5sEbh0ZdJRC9TA/exec";
const GROUP_LINK = "https://t.me/+akm0mVey8WQ4OTBl"; 

let allData = []; 
let currentAnswers = []; 

/**
 * 초기화 및 데이터 로드
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
 * [핵심 로직] 시험지 제출 및 오답 노트 생성
 */
function submitQuiz() {
    const inputs = document.querySelectorAll('.q-inline-input');
    if (inputs.length === 0) return;

    let correctCount = 0;
    const total = currentAnswers.length;
    const userAnswers = []; // 오답 노트를 위해 사용자의 답을 저장

    inputs.forEach((input, index) => {
        const userVal = input.value.trim();
        userAnswers.push(userVal); // 사용자 입력값 수집
        
        const correctVal = currentAnswers[index] ? currentAnswers[index].trim().replace(/\s/g, '') : "";
        const cleanUserVal = userVal.replace(/\s/g, '');
        
        // 정답 비교 (공백 제거 후 비교)
        const isCorrect = (cleanUserVal === correctVal && cleanUserVal !== "");

        if (isCorrect) {
            correctCount++;
            input.classList.add('input-correct');
            input.classList.remove('input-wrong');
        } else {
            input.classList.add('input-wrong');
            input.classList.remove('input-correct');
        }
        input.readOnly = true; // 채점 후 수정 불가
    });

    const finalScore = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    
    // 1. 랭킹 서버에 점수 저장 (rank.js 연동)
    if (typeof saveScoreToDB === 'function') {
        saveScoreToDB(finalScore);
    }

    // 2. ✨ 오답 노트 생성 함수 호출 (이 부분이 추가되었습니다)
    renderReviewNote(currentAnswers, userAnswers);

    // 3. 결과 화면 표시
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'flex';
    document.getElementById('score-text').textContent = finalScore + "점";

    const scoreMsg = document.getElementById('score-msg');
    if (scoreMsg) {
        scoreMsg.innerHTML = `총 ${total}문제 중 <b>${correctCount}문제</b> 통달 완료!`;
    }
    window.scrollTo(0, 0);
}

/**
 * 📝 오답 노트를 화면에 그리는 함수
 */
function renderReviewNote(correctAnswers, userAnswers) {
    const listEl = document.getElementById('review-list');
    if (!listEl) return;

    listEl.innerHTML = ""; // 기존 내용 초기화

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
 * 화면 전환 함수들 (뒤로가기 포함)
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
}

function showQuarterMenu() {
    hideAllSections();
    document.getElementById('quarter-menu').style.display = 'block';
}

function backToListArea() {
    hideAllSections();
    document.getElementById('list-area').style.display = 'block';
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

// 초기 실행
window.addEventListener('DOMContentLoaded', init);