/**
 * 👑 rank.js: 닉네임 설정 및 화면 전환 연결 엔진
 * 수정 사항: 
 * 1. [Fix] 챕터 클릭 시 닉네임 입력창(nickname-area)이 무조건 최상단에 뜨도록 강제 설정
 * 2. z-index와 display 속성을 명확히 지정하여 빈 화면 문제 해결
 */

// 랭킹 서버 URL
window.RANKING_SERVER_URL = "https://script.google.com/macros/s/AKfycbwjTb5BRXO6TEEzj0pZlYqI3qwFSk4sjD9p9R_WANM2csrjBI0Ar-JOgrORZVxoXYf6_Q/exec";

let userTempNickname = "은둔 통달자";
let currentChapter = "전체";
let isSaving = false;

/**
 * 1. 🚀 [핵심] 챕터 선택 시 닉네임 입력창 열기 (강력 모드)
 */
function openNicknamePage(chapterData) {
    console.log("닉네임 페이지 호출됨:", chapterData); // 디버깅용 로그
    currentChapter = chapterData; 

    // 1. 모든 배경 화면 숨기기
    if (typeof hideAllSections === 'function') {
        hideAllSections();
    } else {
        // common.js가 없을 경우를 대비한 하드코딩 숨김
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('list-area').style.display = 'none';
        document.getElementById('quiz-area').style.display = 'none';
    }

    // 2. 닉네임 입력창 강제 노출
    const nicknameArea = document.getElementById('nickname-area');
    if (nicknameArea) {
        nicknameArea.style.display = 'flex'; // flex로 설정하여 중앙 정렬 유지
        nicknameArea.style.zIndex = '9999'; // 다른 요소보다 무조건 위에 뜨도록 설정
        nicknameArea.style.opacity = '1';
    } else {
        alert("오류: 닉네임 입력창(HTML ID: nickname-area)을 찾을 수 없습니다.");
        return;
    }

    // 3. UI 버튼 상태 업데이트 (버튼들이 닉네임 창을 가리지 않도록 숨김)
    if (typeof updateNavUI === 'function') {
        updateNavUI(false); 
    }
    const topPlus = document.getElementById('top-right-plus');
    if(topPlus) topPlus.style.display = 'none';
}

/**
 * 2. 랭킹 UI 업데이트
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

        ranks.slice(0, 15).forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'rank-item'; 
            div.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:12px;";
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="rank-num">${index + 1}</span>
                    <span style="font-weight:500;">${item.name}</span>
                </div>
                <span style="font-weight:bold;">${item.score}점</span>
            `;
            listEl.appendChild(div);
        });
    } catch (e) { 
        console.warn("랭킹 로드 대기 중..."); 
    }
}

/**
 * 3. 버튼 이벤트 리스너 (DOM 로드 후 실행)
 */
document.addEventListener('DOMContentLoaded', () => {
    // [이름 걸고 시작하기] 버튼
    const btnName = document.getElementById('btn-name-start');
    if (btnName) {
        btnName.onclick = () => {
            const input = document.getElementById('user-nickname');
            const val = input.value.trim();
            if (!val) {
                alert("닉네임을 입력해주세요!");
                return;
            }
            userTempNickname = val;
            startGame();
        };
    }

    // [은둔 고수로 시작하기] 버튼
    const btnAnon = document.getElementById('btn-anon-start');
    if (btnAnon) {
        btnAnon.onclick = () => {
            userTempNickname = "은둔 통달자";
            startGame();
        };
    }
});

/**
 * 4. 🏁 실제 게임 시작
 */
function startGame() {
    // 닉네임 창 숨기기
    document.getElementById('nickname-area').style.display = 'none';

    // 퀴즈 화면으로 전환
    if (typeof startHeavenlyQuiz === 'function') {
        startHeavenlyQuiz(currentChapter);
    } else {
        alert("퀴즈 시작 함수를 찾을 수 없습니다. 새로고침 해주세요.");
    }
}

/**
 * 5. 점수 저장
 */
async function saveScoreToDB(score) {
    if (isSaving) return;
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
    } catch (e) { console.error(e); } finally { isSaving = false; }
}

/**
 * 6. 캡쳐 기능
 */
async function autoCaptureAndShare() {
    const scoreText = document.getElementById('score-text')?.innerText || "0";
    const finalScore = parseInt(scoreText.replace(/[^0-9]/g, "")) || 0;
    await saveScoreToDB(finalScore);

    const target = document.getElementById('capture-target');
    if (target && typeof html2canvas !== 'undefined') {
        try {
            const canvas = await html2canvas(target, { scale: 2, backgroundColor: null });
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
        } catch (e) { console.error(e); }
    }
}

function goToStart() { location.reload(); }