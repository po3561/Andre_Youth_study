/**
 * 👑 rank.js: 20자 닉네임 대응 및 최신순 정렬 최적화 버전
 */

// 최신 배포 주소 적용
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
        // 캐시 방지를 위해 타임스탬프를 추가하여 호출합니다.
        const res = await fetch(`${window.RANKING_SERVER_URL}?action=getRank&t=${new Date().getTime()}`);
        const ranks = await res.json();
        
        listEl.innerHTML = "";
        if (!ranks || ranks.length === 0) {
            listEl.innerHTML = "<p style='text-align:center; padding:20px;'>아직 등록된 랭킹이 없습니다.</p>";
            return;
        }

        // 상위 8명 표시 (기획자님 설정 반영)
        ranks.slice(0, 8).forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `rank-item ${index < 3 ? 'top3' : ''}`;
            
            // 레이아웃 최적화: 닉네임 20자 대응을 위한 Flexbox 설정
            div.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee; gap:10px;";
            
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; flex: 1; min-width: 0;">
                    <span style="font-weight:bold; color:#888; width:22px; flex-shrink:0;">${index + 1}</span>
                    <span style="background:#e3f2fd; color:#1976d2; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; border:1px solid #bbdefb; flex-shrink:0;">${item.chapter || '전체'}</span>
                    
                    <span style="font-weight:500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
                        ${item.name}
                    </span>
                </div>
                <span style="font-weight:bold; color:#007AFF; flex-shrink:0; text-align:right; width:50px;">${item.score}점</span>
            `;
            listEl.appendChild(div);
        });
    } catch (e) { 
        console.warn("랭킹 데이터를 동기화 중입니다..."); 
    }
}

/**
 * 닉네임 설정 페이지를 열고 선택된 장 정보를 감지합니다.
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
        if(!input) return alert("이름을 정하셔야 랭킹에 기록됩니다! 😊");
        
        // 20자 제한 확인
        if(input.length > 20) {
            return alert("닉네임은 최대 20자까지만 가능합니다.");
        }
        
        userTempNickname = input;
        startFinalQuiz(chapterData);
    };

    document.getElementById('btn-anon-start').onclick = () => {
        userTempNickname = "은둔 통달자";
        startFinalQuiz(chapterData);
    };
}

/**
 * 시험 화면으로 전환합니다.
 */
function startFinalQuiz(chapterData) {
    const nickArea = document.getElementById('nickname-area');
    if (nickArea) nickArea.style.display = 'none';
    if (typeof startHeavenlyQuiz === 'function') {
        startHeavenlyQuiz(chapterData); 
    }
}

/**
 * 점수를 드라이브에 안전하게 저장합니다 (중복 방지 포함).
 */
async function saveScoreToDB(score) {
    if (!window.RANKING_SERVER_URL || isSaving) return; 

    isSaving = true; // 저장 프로세스 시작 (잠금)
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
        isSaving = false; // 실패 시 재시도 가능하도록 잠금 해제
    }
}

/**
 * 인증 및 캡쳐 실행 (index.html 버튼 연동)
 */
async function autoCaptureAndShare() {
    const scoreText = document.getElementById('score-text')?.innerText || "0";
    const finalScore = parseInt(scoreText.replace(/[^0-9]/g, "")) || 0;

    // 1. 점수 저장 실행
    await saveScoreToDB(finalScore);

    // 2. 캡쳐 영역 처리
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
            console.error("이미지 생성 중 오류 발생");
        }
    }
}

function goToStart() { location.reload(); }

/**
 * 챌린지 방 바로가기: 텔레그램 링크 적용
 */
function goToChallengeGroup() { 
    window.open("https://t.me/+akm0mVey8WQ4OTBl", "_blank"); 
}

// 페이지 로드 시 초기 실행
window.addEventListener('DOMContentLoaded', updateRankingUI);