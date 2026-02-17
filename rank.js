/**
 * 👑 rank.js: 닉네임 설정 및 랭킹 시스템 통합 엔진
 * 수정 사항: 
 * 1. 닉네임 20자 제한 및 레이아웃 밀림 방지 적용
 * 2. 머지 충돌로 인한 중복 함수 제거 및 로직 단일화
 * 3. 저장 잠금(isSaving)을 통한 중복 데이터 생성 방지
 */

// [1]Constants & State
window.RANKING_SERVER_URL = "https://script.google.com/macros/s/AKfycbwjTb5BRXO6TEEzj0pZlYqI3qwFSk4sjD9p9R_WANM2csrjBI0Ar-JOgrORZVxoXYf6_Q/exec";

let userTempNickname = "은둔 통달자";
let currentChapter = "전체";
let isSaving = false;

/**
 * 🚀 닉네임 페이지 오픈 (강력 모드)
 */
function openNicknamePage(chapterData) {
    console.log("닉네임 페이지 호출됨:", chapterData);
    currentChapter = chapterData; 

    // 모든 섹션 숨기기
    if (typeof hideAllSections === 'function') {
        hideAllSections();
    } else {
        ['main-menu', 'list-area', 'quiz-area', 'quarter-menu', 'result-area', 'capture-guide'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.style.display = 'none';
        });
    }

    // 닉네임 입력창 노출 및 설정
    const nicknameArea = document.getElementById('nickname-area');
    if (nicknameArea) {
        nicknameArea.style.display = 'flex';
        nicknameArea.style.zIndex = '9999';
        nicknameArea.style.opacity = '1';
    }

    // 하단 바 및 상단 플러스 버튼 숨김
    if (typeof updateNavUI === 'function') updateNavUI(false);
    const topPlus = document.getElementById('top-right-plus');
    if(topPlus) topPlus.style.display = 'none';

    // 입력창 초기화
    const input = document.getElementById('user-nickname');
    if(input) input.value = "";
}

/**
 * 🏆 랭킹 UI 업데이트 (20자 닉네임 레이아웃 대응)
 */
async function updateRankingUI() {
    const listEl = document.getElementById('ranking-list');
    if (!listEl) return;

    try {
        const res = await fetch(`${window.RANKING_SERVER_URL}?action=getRank&t=${new Date().getTime()}`);
        const ranks = await res.json();
        
        listEl.innerHTML = "";
        if (!ranks || ranks.length === 0) {
            listEl.innerHTML = "<p style='text-align:center; padding:20px; color:#555;'>아직 랭킹이 없습니다.</p>";
            return;
        }

        // 상위 15명 표시
        ranks.slice(0, 100).forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'rank-item'; 
            
            // 🚨 무결성 포인트: 닉네임이 길어도 레이아웃이 깨지지 않도록 Flexbox 및 생략(...) 처리 적용
            div.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid rgba(0,0,0,0.05); gap:10px;";
            
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; flex: 1; min-width: 0;">
                    <span class="rank-num" style="width:22px; flex-shrink:0;">${index + 1}</span>
                    <span style="background:#e3f2fd; color:#1976d2; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; border:1px solid #bbdefb; flex-shrink:0;">
                        ${item.chapter || '전체'}
                    </span>
                    <span style="font-weight:600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; color:#333;">
                        ${item.name}
                    </span>
                </div>
                <span style="font-weight:bold; color:#007AFF; flex-shrink:0; text-align:right;">${item.score}점</span>
            `;
            listEl.appendChild(div);
        });
    } catch (e) { 
        console.warn("랭킹 데이터를 동기화 중입니다..."); 
    }
}

/**
 * 🏁 실제 게임 시작 로직
 */
function startGame() {
    document.getElementById('nickname-area').style.display = 'none';
    isSaving = false; // 잠금 초기화

    if (typeof startHeavenlyQuiz === 'function') {
        startHeavenlyQuiz(currentChapter);
    } else {
        alert("시험을 시작할 수 없습니다. 새로고침 해주세요.");
    }
}

/**
 * 💾 점수 저장 (중복 방지 락 적용)
 */
async function saveScoreToDB(score) {
    if (!window.RANKING_SERVER_URL || isSaving) return; 
    isSaving = true;

    try {
        await fetch(window.RANKING_SERVER_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save',
                name: userTempNickname,
                score: score,
                chapter: currentChapter.name || currentChapter
            })
        });
        updateRankingUI(); 
    } catch (e) { 
        console.error("저장 실패:", e);
        isSaving = false; 
    }
}

/**
 * 📸 인증 및 캡쳐 실행
 */
async function autoCaptureAndShare() {
    const scoreText = document.getElementById('score-text')?.innerText || "0";
    const finalScore = parseInt(scoreText.replace(/[^0-9]/g, "")) || 0;

    // 점수 DB 저장 실행
    await saveScoreToDB(finalScore);

    const target = document.getElementById('capture-target');
    if (target && typeof html2canvas !== 'undefined') {
        try {
            const canvas = await html2canvas(target, { 
                scale: 2, 
                backgroundColor: "#FFFFFF",
                logging: false,
                useCORS: true 
            });
            const placeholder = document.getElementById('captured-img-placeholder');
            if (placeholder) {
                placeholder.innerHTML = "";
                const img = new Image();
                img.src = canvas.toDataURL("image/png");
                img.style.width = "100%";
                img.style.borderRadius = "15px";
                placeholder.appendChild(img);
            }
            document.getElementById('result-area').style.display = 'none';
            document.getElementById('capture-guide').style.display = 'block';
            if(typeof updateNavUI === 'function') updateNavUI(false);
        } catch (e) { 
            console.error("이미지 생성 실패:", e); 
        }
    }
}

/**
 * 🔗 기타 유틸리티 함수
 */
function goToStart() { location.reload(); }

function goToChallengeGroup() { 
    window.open("https://t.me/+akm0mVey8WQ4OTBl", "_blank"); 
}

// [이벤트 리스너 통합]
document.addEventListener('DOMContentLoaded', () => {
    // 랭킹 초기 로드
    updateRankingUI();

    // 1. 이름 걸고 시작하기 버튼
    const btnName = document.getElementById('btn-name-start');
    if (btnName) {
        btnName.onclick = () => {
            const input = document.getElementById('user-nickname');
            const val = input.value.trim();
            if (!val) {
                alert("이름을 정하셔야 랭킹에 기록됩니다! 😊");
                return;
            }
            // 🚨 20자 제한 무결성 검사
            if(val.length > 20) {
                alert("닉네임은 최대 20자까지만 가능합니다.");
                return;
            }
            userTempNickname = val;
            startGame();
        };
    }

    // 2. 은둔 통달자로 진행 버튼
    const btnAnon = document.getElementById('btn-anon-start');
    if (btnAnon) {
        btnAnon.onclick = () => {
            userTempNickname = "은둔 통달자";
            startGame();
        };
    }
});