/**
 * 👑 rank.js: 장 정보, 닉네임, 점수 통합 수집 및 실시간 랭킹 분석 시스템
 */

// 새로운 배포 주소를 아래에 적용했습니다.
window.RANKING_SERVER_URL = "https://script.google.com/macros/s/AKfycbwjTb5BRXO6TEEzj0pZlYqI3qwFSk4sjD9p9R_WANM2csrjBI0Ar-JOgrORZVxoXYf6_Q/exec";

let userTempNickname = "은둔 통달자";
let currentChapter = "전체";
let isSaving = false; // 중복 저장 방지 잠금장치

/**
 * 서버에서 분석된 랭킹 데이터를 가져와 UI에 표시합니다.
 */
async function updateRankingUI() {
    const listEl = document.getElementById('ranking-list');
    if (!listEl) return;

    try {
        // 캐시 방지를 위해 URL 뒤에 타임스탬프(?t=...)를 추가합니다.
        const res = await fetch(`${window.RANKING_SERVER_URL}?action=getRank&t=${new Date().getTime()}`);
        const ranks = await res.json();
        
        listEl.innerHTML = "";
        if (!ranks || ranks.length === 0) {
            listEl.innerHTML = "<p style='text-align:center; padding:20px;'>아직 등록된 랭킹이 없습니다.</p>";
            return;
        }

        // 상위 10명 표시
        ranks.slice(0, 7).forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `rank-item ${index < 3 ? 'top3' : ''}`;
            div.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee;";
            
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-weight:bold; color:#888; width:20px;">${index + 1}</span>
                    <span style="background:#e3f2fd; color:#1976d2; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; border:1px solid #bbdefb;">${item.chapter || '전체'}</span>
                    <span style="font-weight:500;">${item.name}</span>
                </div>
                <span style="font-weight:bold; color:#007AFF;">${item.score}점</span>
            `;
            listEl.appendChild(div);
        });
    } catch (e) { 
        console.warn("랭킹 로드 대기 중..."); 
    }
}

/**
 * 닉네임 페이지를 열고 선택된 장 정보를 감지합니다.
 */
function openNicknamePage(chapterData) {
    if (chapterData) {
        currentChapter = chapterData.title || chapterData.name || "전체";
    }

    const nickArea = document.getElementById('nickname-area');
    if (nickArea) nickArea.style.display = 'flex';

    isSaving = false; // 새로운 시험 시작 시 잠금 해제

    document.getElementById('btn-name-start').onclick = () => {
        const input = document.getElementById('user-nickname').value.trim();
        if(!input) return alert("이름을 정하셔야 랭킹에 기록됩니다!");
        userTempNickname = input;
        startFinalQuiz(chapterData);
    };

    document.getElementById('btn-anon-start').onclick = () => {
        userTempNickname = "은둔 통달자";
        startFinalQuiz(chapterData);
    };
}

/**
 * 시험 화면 전환
 */
function startFinalQuiz(chapterData) {
    const nickArea = document.getElementById('nickname-area');
    if (nickArea) nickArea.style.display = 'none';
    if (typeof startHeavenlyQuiz === 'function') {
        startHeavenlyQuiz(chapterData); 
    }
}

/**
 * 데이터를 드라이브에 안전하게 저장합니다.
 */
async function saveScoreToDB(score) {
    if (!window.RANKING_SERVER_URL || isSaving) return; 

    isSaving = true; // 저장 프로세스 잠금
    try {
        await fetch(window.RANKING_SERVER_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: "saveScore", 
                name: userTempNickname, 
                score: score,
                chapter: currentChapter
            })
        });
        updateRankingUI(); 
    } catch (e) { 
        console.error("저장 실패:", e); 
        isSaving = false; // 실패 시 잠금 해제
    }
}

/**
 * 인증 및 캡쳐 실행
 */
async function autoCaptureAndShare() {
    const scoreText = document.getElementById('score-text')?.innerText || "0";
    const finalScore = parseInt(scoreText.replace(/[^0-9]/g, "")) || 0;

    // 저장 실행
    await saveScoreToDB(finalScore);

    const target = document.getElementById('capture-target');
    if (target && typeof html2canvas !== 'undefined') {
        try {
            const canvas = await html2canvas(target, { scale: 2 });
            const placeholder = document.getElementById('captured-img-placeholder');
            if (placeholder) {
                placeholder.innerHTML = "";
                const img = new Image();
                img.src = canvas.toDataURL("image/png");
                img.style.width = "100%";
                placeholder.appendChild(img);
            }
            document.getElementById('result-area').style.display = 'none';
            document.getElementById('capture-guide').style.display = 'block';
        } catch (e) {
            console.error("이미지 생성 실패");
        }
    }
}

function goToStart() { location.reload(); }
function goToChallengeGroup() { window.open("https://t.me/+akm0mVey8WQ4OTBl", "_blank"); }

// 초기 실행
window.addEventListener('DOMContentLoaded', updateRankingUI);