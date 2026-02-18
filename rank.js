/**
 * 👑 rank.js: 닉네임 설정 및 랭킹 시스템 통합 엔진
 * 수정 사항: 
 * 1. [Critical] updateRankingUI 내부 중복 코드 및 문법 오류 해결
 * 2. [Fix] Google Apps Script 통신 성공률을 높이기 위해 Header를 'text/plain'으로 변경
 * 3. 닉네임 20자 제한 및 중복 저장 방지 로직 통합
 */

// 랭킹 서버 URL (수정 금지)
window.RANKING_SERVER_URL = "https://script.google.com/macros/s/AKfycbwjTb5BRXO6TEEzj0pZlYqI3qwFSk4sjD9p9R_WANM2csrjBI0Ar-JOgrORZVxoXYf6_Q/exec";

// 상태 변수
let userTempNickname = "은둔 통달자";
let currentChapter = "전체";
let isSaving = false;

/**
 * 1. 🚀 닉네임 페이지 오픈 (화면 제어)
 */
function openNicknamePage(chapterData) {
    console.log("닉네임 페이지 호출됨:", chapterData);
    currentChapter = chapterData; 

    // 모든 섹션 숨기기
    if (typeof hideAllSections === 'function') {
        hideAllSections();
    } else {
        // common.js 없는 경우 대비
        ['main-menu', 'list-area', 'quiz-area', 'quarter-menu', 'result-area', 'capture-guide'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.style.display = 'none';
        });
    }

    // 닉네임 입력창 강제 노출
    const nicknameArea = document.getElementById('nickname-area');
    if (nicknameArea) {
        nicknameArea.style.display = 'flex';
        nicknameArea.style.zIndex = '9999';
        nicknameArea.style.opacity = '1';
    }

    // UI 버튼 상태 업데이트 (가림 방지)
    if (typeof updateNavUI === 'function') updateNavUI(false);
    const topPlus = document.getElementById('top-right-plus');
    if(topPlus) topPlus.style.display = 'none';

    // 입력창 초기화
    const input = document.getElementById('user-nickname');
    if(input) input.value = "";
}

/**
 * 2. 🏆 랭킹 UI 업데이트 (오류 수정됨)
 */
async function updateRankingUI() {
    const listEl = document.getElementById('ranking-list');
    if (!listEl) return;

    try {
        // 캐시 방지용 타임스탬프 추가
        const res = await fetch(`${window.RANKING_SERVER_URL}?action=getRank&t=${new Date().getTime()}`);
        const ranks = await res.json();
        
        listEl.innerHTML = "";
        if (!ranks || ranks.length === 0) {
            listEl.innerHTML = "<p style='text-align:center; padding:20px; color:#555;'>아직 랭킹이 없습니다.</p>";
            return;
        }

        // 상위 100명 표시 (오류 없이 깔끔하게 렌더링)
        ranks.slice(0, 100).forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'rank-item'; 
            
            // 닉네임 길어도 깨지지 않게 Flex 스타일 적용
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
        console.warn("랭킹 로드 실패 또는 지연:", e); 
    }
}

/**
 * 3. 🏁 실제 게임 시작
 */
function startGame() {
    document.getElementById('nickname-area').style.display = 'none';
    isSaving = false; // 저장 잠금 해제

    if (typeof startHeavenlyQuiz === 'function') {
        startHeavenlyQuiz(currentChapter);
    } else {
        alert("퀴즈 시작 함수를 찾을 수 없습니다. 새로고침 해주세요.");
    }
}

/**
 * 4. 💾 점수 저장 (통신 방식 개선)
 */
async function saveScoreToDB(score) {
    if (!window.RANKING_SERVER_URL || isSaving) return; 
    isSaving = true; // 중복 저장 방지 락 걸기

    try {
        await fetch(window.RANKING_SERVER_URL, {
            method: 'POST',
            mode: 'no-cors', // 구글 스크립트 전용 모드
            // 🚨 핵심 수정: application/json 대신 text/plain 사용 (전송 성공률 UP)
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'save',
                name: userTempNickname,
                score: score,
                chapter: currentChapter.name || currentChapter
            })
        });
        
        console.log("점수 전송 완료");
        // 약간의 딜레이 후 랭킹 갱신 (서버 반영 시간 고려)
        setTimeout(updateRankingUI, 1000);

    } catch (e) { 
        console.error("저장 실패:", e);
    } finally { 
        isSaving = false; // 락 해제
    }
}

/**
 * 5. 📸 인증 및 캡쳐 실행
 */
async function autoCaptureAndShare() {
    const scoreText = document.getElementById('score-text')?.innerText || "0";
    const finalScore = parseInt(scoreText.replace(/[^0-9]/g, "")) || 0;

    // 1. 점수 저장 먼저 실행
    await saveScoreToDB(finalScore);

    // 2. 화면 캡쳐 로직
    const target = document.getElementById('capture-target');
    if (target && typeof html2canvas !== 'undefined') {
        try {
            const canvas = await html2canvas(target, { 
                scale: 2, 
                backgroundColor: "#FFFFFF", // 투명 배경 방지
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
            console.error("이미지 생성 오류:", e); 
        }
    }
}

/**
 * 6. 기타 유틸리티
 */
function goToStart() { location.reload(); }

function goToChallengeGroup() { 
    window.open("https://t.me/+akm0mVey8WQ4OTBl", "_blank"); 
}

// [이벤트 리스너 통합]
document.addEventListener('DOMContentLoaded', () => {
    // 초기 랭킹 로드
    updateRankingUI();

    // 이름 걸고 시작하기
    const btnName = document.getElementById('btn-name-start');
    if (btnName) {
        btnName.onclick = () => {
            const input = document.getElementById('user-nickname');
            const val = input.value.trim();
            
            if (!val) {
                alert("이름을 입력해주세요! 😊");
                return;
            }
            // 🚨 20자 제한 체크 (무결성)
            if(val.length > 20) {
                alert("닉네임은 최대 20자까지만 가능합니다.");
                return;
            }
            
            userTempNickname = val;
            startGame();
        };
    }

    // 은둔 통달자로 진행
    const btnAnon = document.getElementById('btn-anon-start');
    if (btnAnon) {
        btnAnon.onclick = () => {
            userTempNickname = "은둔 통달자";
            startGame();
        };
    }
});