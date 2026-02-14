/**
 * 👑 common.js: 이미지 생성 없이 인증서 원본 그대로 전달하는 최종본
 */
const tg = window.Telegram.WebApp;
tg.expand();

// [원본 유지] 서버 및 그룹 링크
const SERVER_URL = "https://script.google.com/macros/s/AKfycbw238LQiorJpRUX_okKLvyH6EB65GSgq0D9kfiJNpWiUd35LZG_9o5sEbh0ZdJRC9TA/exec";
const GROUP_LINK = "https://t.me/+akm0mVey8WQ4OTBl"; 

let allData = []; 
let currentAnswers = []; 

/**
 * 🚀 초기화
 */
async function init() {
    const loader = document.getElementById('loading');
    try {
        const res = await fetch(`${SERVER_URL}?action=list`);
        allData = await res.json();
    } catch (e) {
        console.error("데이터 로드 실패");
    } finally {
        if (loader) loader.style.display = 'none';
        showMain();
    }
}

/**
 * 🏠 화면 전환
 */
function showMain() {
    ['main-menu', 'list-area', 'quiz-area', 'result-area', 'quarter-menu', 'capture-guide'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
    document.getElementById('main-menu').style.display = 'block';
    window.scrollTo(0, 0);
}

/**
 * ✅ [복구] 시험지 제출 (성취도 문구 유지)
 */
function submitQuiz() {
    const inputs = document.querySelectorAll('.q-inline-input');
    if (inputs.length === 0) return;

    let correctCount = 0;
    const total = currentAnswers.length;

    inputs.forEach((input, index) => {
        const userVal = input.value.trim().replace(/\s/g, '');
        const correctVal = currentAnswers[index] ? currentAnswers[index].trim().replace(/\s/g, '') : "";
        
        if (userVal === correctVal && userVal !== "") {
            correctCount++;
            input.style.backgroundColor = 'rgba(52, 199, 89, 0.15)'; 
        } else {
            input.style.backgroundColor = 'rgba(255, 59, 48, 0.15)'; 
        }
    });

    const finalScore = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'flex';
    document.getElementById('score-text').textContent = finalScore;

    const scoreMsg = document.getElementById('score-msg');
    if (scoreMsg) {
        scoreMsg.innerHTML = `총 ${total}문항 중 <b>${correctCount}문항</b> 통달!`;
    }
    
    window.scrollTo(0, 0);
}

/**
 * 📸 [핵심 수정] 인증하기 버튼 클릭 시 로직
 * 이미지를 생성하지 않고, 보고 있던 인증서를 그대로 복사해서 가져옵니다.
 */
function autoCaptureAndShare() {
    // 1. 현재 보고 있는 인증서 원본(흰색 카드 박스)을 찾습니다.
    const sourceCertificate = document.querySelector('#result-area .result-header');
    // 2. 이미지가 들어가기로 했던 빈 자리(태그)를 찾습니다.
    const targetPlaceholder = document.getElementById('captured-img');

    // 두 요소가 모두 정상적으로 있을 때만 실행합니다.
    if (sourceCertificate && targetPlaceholder) {
        // 3. 인증서를 똑같이 하나 복제합니다 (clone).
        const clonedCertificate = sourceCertificate.cloneNode(true);

        // 💡 복제한 인증서의 스타일을 가이드 화면에 맞게 살짝 다듬습니다.
        // (기존 마진 제거 및 너비 최적화)
        clonedCertificate.style.margin = '0 auto 20px auto';
        clonedCertificate.style.width = '100%';
        clonedCertificate.style.boxShadow = 'none'; // 가이드 박스 안이라 그림자 제거

        // 4. 빈 이미지 태그 자리를 복제한 인증서 HTML로 교체합니다.
        targetPlaceholder.replaceWith(clonedCertificate);
    }

    // 5. 화면을 전환합니다 (멈춤 없이 즉시 실행됨).
    document.getElementById('result-area').style.display = 'none';
    document.getElementById('capture-guide').style.display = 'block';

    window.scrollTo(0, 0);
    console.log("인증서 원본 그대로 전달 완료! 🚀");
}

/**
 * 🔄 문답 전체 초기화
 */
function resetAllQuiz() {
    const inputs = document.querySelectorAll('.q-inline-input');
    inputs.forEach(input => {
        input.value = '';
        input.style.backgroundColor = 'rgba(255, 249, 196, 0.5)';
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
/**
 * 🔗 챌린지 방 바로가기
 * 텔레그램 내 웹앱 환경과 일반 브라우저 모두에서 즉시 연결되도록 최적화했습니다.
 */
function goToChallengeGroup() {
    // 💡 오영 님의 실제 챌린지 방 초대 링크입니다.
    const CHALLENGE_URL = "https://t.me/+akm0mVey8WQ4OTBl"; 

    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
        // 텔레그램 공식 앱 내에서 가장 빠르게 방으로 이동하는 방식
        window.Telegram.WebApp.openTelegramLink(CHALLENGE_URL);
    } else {
        // 일반 브라우저 환경에서 열기
        window.open(CHALLENGE_URL, '_blank');
    }
}

/**
 * 🏠 처음으로
 */
function goToStart() {
    // 가이드 화면에서 '처음으로' 누를 때, 복제해서 넣어둔 인증서를 다시 이미지 태그로 원복 (초기화)
    const guideBox = document.querySelector('#capture-guide .guide-box');
    const currentCertificate = guideBox.querySelector('.result-header');
    if (currentCertificate) {
        const newImgPlaceholder = document.createElement('img');
        newImgPlaceholder.id = 'captured-img';
        newImgPlaceholder.alt = "인증샷 영역";
        // 기존 스타일 유지 (style.css에 정의된 것)
        newImgPlaceholder.style.width = '100%';
        newImgPlaceholder.style.borderRadius = '18px';
        newImgPlaceholder.style.marginBottom = '20px';
        currentCertificate.replaceWith(newImgPlaceholder);
    }

    // 화면 전환
    ['capture-guide', 'result-area', 'quiz-area', 'list-area', 'main-menu'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const qm = document.getElementById('quarter-menu');
    if (qm) qm.style.display = 'block';
    window.scrollTo(0, 0);
}

init();