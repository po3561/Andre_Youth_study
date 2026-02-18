/**
 * 👑 common.js: 오답 노트 및 단계별 UI 전환 통합 엔진
 * 최종 수정: 오답노트 절(Verse)별 그룹화 기능 추가
 */
const tg = window.Telegram.WebApp;
tg.expand();

const SERVER_URL = "https://script.google.com/macros/s/AKfycbw238LQiorJpRUX_okKLvyH6EB65GSgq0D9kfiJNpWiUd35LZG_9o5sEbh0ZdJRC9TA/exec";
const GROUP_LINK = "https://t.me/+akm0mVey8WQ4OTBl"; 

let allData = []; 
let currentAnswers = []; 

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
        const quizArea = document.getElementById('quiz-area');
        if (quizArea && quizArea.style.display === 'block') {
            if (topPlus) topPlus.style.display = 'none';
        } else {
            if (topPlus) topPlus.style.display = 'flex';
        }
    }
}

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

function resetAllQuiz() {
    if(!confirm("모든 입력 내용을 지우고 처음부터 다시 하시겠습니까?")) return;
    
    const inputs = document.querySelectorAll('.q-inline-input');
    inputs.forEach(input => {
        input.value = '';
        input.readOnly = false;
        input.classList.remove('input-correct', 'input-wrong');
    });
    window.scrollTo(0,0);
}


/**
 * 4. 결과 화면 및 오답 노트 처리
 */
function submitQuiz() {
    const inputs = document.querySelectorAll('.q-inline-input');
    if (inputs.length === 0) return;

    let correctCount = 0;
    const totalBlanks = inputs.length; 
    
    // 오답노트 생성을 위한 데이터 수집
    const reviewData = []; 

    inputs.forEach((input, index) => {
        const userVal = input.value.trim();
        const correctValRaw = currentAnswers[index] ? currentAnswers[index].trim() : "";
        const ref = input.dataset.ref || `문항 ${index + 1}`; // 구절 정보 가져오기
        
        const normalize = (text) => text.replace(/\s/g, '').replace(/찌어다/g, '지어다');
        const cleanUserVal = normalize(userVal);
        const cleanCorrectVal = normalize(correctValRaw);
        
        const isCorrect = (cleanUserVal === cleanCorrectVal && cleanUserVal !== "");

        if (isCorrect) {
            correctCount++;
            input.classList.add('input-correct');
            input.classList.remove('input-wrong');
        } else {
            input.classList.add('input-wrong');
            input.classList.remove('input-correct');
            
            // 틀린 것만 오답 데이터에 추가
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

    // 🚨 변경된 오답노트 렌더링 함수 호출
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

/**
 * 🚨 [신규] 절별로 그룹화하여 오답노트 렌더링
 */
function renderReviewNoteGrouped(reviewData) {
    const container = document.getElementById('review-list');
    container.innerHTML = "";
    
    if (reviewData.length === 0) {
        container.innerHTML = "<div style='text-align:center; padding:20px; color:#555;'>🎉 완벽합니다! 오답이 없습니다.</div>";
        return;
    }

    // 1. 데이터를 절(Ref)별로 그룹화
    const groups = {};
    reviewData.forEach(item => {
        if (!groups[item.ref]) {
            groups[item.ref] = [];
        }
        groups[item.ref].push(item);
    });

    // 2. 그룹별로 카드 생성
    for (const [ref, items] of Object.entries(groups)) {
        // 구절 헤더
        const groupDiv = document.createElement('div');
        groupDiv.style.cssText = "background:white; border-radius:14px; padding:15px; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05);";
        
        let groupHTML = `<div style="font-weight:900; color:#1c1c1e; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">📖 ${ref}</div>`;
        
        // 해당 구절의 틀린 문제들 나열
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