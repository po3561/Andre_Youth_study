/**
 * 👑 rank.js: 닉네임 설정, 랭킹 시스템, 데이터 전송 엔진
 * 최종 수정: 
 * 1. [Critical] 한 판당 점수 저장이 단 1번만 수행되도록 '저장 완료 플래그(isScoreSaved)' 추가
 * 2. 버튼 연타 및 중복 전송 원천 차단
 */

// 보내주신 최신 구글 앱스 스크립트 배포 주소
window.RANKING_SERVER_URL = "https://script.google.com/macros/s/AKfycbwZaRN7hi_RZEhLOaK7OuR00DiuGQpLxp0k1_pcvm4ncg3Cwn_5O7kOELmzlqBOmmAoVg/exec";

// 상태 변수
let userTempNickname = "은둔 통달자";
let currentChapter = "전체";
let isSaving = false;      // 저장 중인지 확인 (통신 중 중복 클릭 방지)
let isScoreSaved = false;  // 🚨 [핵심] 이번 판에서 저장이 완료되었는지 확인 (2번 저장 방지)

/**
 * 1. 🚀 닉네임 페이지 오픈
 */
function openNicknamePage(chapterData) {
    console.log("닉네임 페이지 호출됨, 데이터:", chapterData);
    
    // 챕터 데이터 초기화
    if (chapterData) {
        currentChapter = chapterData;
    } else {
        currentChapter = "전체";
    }

    // 🚨 새 게임 준비: 저장 플래그 초기화 (다시 저장 가능하도록)
    isScoreSaved = false;
    isSaving = false;

    // UI 제어: 모든 섹션 숨기기
    if (typeof hideAllSections === 'function') {
        hideAllSections();
    } else {
        ['main-menu', 'list-area', 'quiz-area', 'quarter-menu', 'result-area', 'capture-guide'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.style.display = 'none';
        });
    }

    // 닉네임 입력창 노출
    const nicknameArea = document.getElementById('nickname-area');
    if (nicknameArea) {
        nicknameArea.style.display = 'flex';
        nicknameArea.style.zIndex = '9999';
        nicknameArea.style.opacity = '1';
    }

    // 네비게이션 정리
    if (typeof updateNavUI === 'function') updateNavUI(false);
    const topPlus = document.getElementById('top-right-plus');
    if(topPlus) topPlus.style.display = 'none';

    // 입력창 초기화
    const input = document.getElementById('user-nickname');
    if(input) input.value = "";
}

/**
 * 2. 🏆 랭킹 UI 업데이트
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

        ranks.slice(0, 100).forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'rank-item'; 
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
        console.warn("랭킹 로드 중...", e); 
    }
}

/**
 * 3. 🏁 실제 게임 시작
 */
function startGame() {
    document.getElementById('nickname-area').style.display = 'none';
    
    // 🚨 게임 시작 시에도 플래그 확실하게 초기화
    isSaving = false;
    isScoreSaved = false;

    if (!currentChapter) currentChapter = "전체";

    if (typeof startHeavenlyQuiz === 'function') {
        startHeavenlyQuiz(currentChapter);
    } else {
        alert("퀴즈 시스템을 불러오지 못했습니다. 새로고침 해주세요.");
    }
}

/**
 * 4. 💾 점수 저장 (중복 차단 로직 강화)
 */
async function saveScoreToDB(score) {
    // 🚨 [핵심] 이미 저장된 판이면 즉시 종료 (중복 저장 원천 차단)
    if (isScoreSaved) {
        console.log("🚫 이미 저장된 점수입니다. 중복 저장을 방지합니다.");
        return;
    }
    
    // 통신 중이면 대기
    if (!window.RANKING_SERVER_URL || isSaving) return; 
    
    isSaving = true; // 통신 시작 잠금

    // 챕터 이름 처리
    let chapterName = "전체";
    if (currentChapter) {
        if (typeof currentChapter === 'string') {
            chapterName = currentChapter;
        } else if (currentChapter.name) {
            chapterName = currentChapter.name;
        } else if (currentChapter.title) {
            chapterName = currentChapter.title;
        }
    }

    const formData = new URLSearchParams();
    formData.append('action', 'save');
    formData.append('name', userTempNickname);
    formData.append('score', score);
    formData.append('chapter', chapterName);

    console.log("💾 저장 시도...", userTempNickname, score);

    try {
        await fetch(window.RANKING_SERVER_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        
        console.log("✅ 점수 전송 완료");
        
        // 🚨 [핵심] 저장 성공 처리: 이제 이 판에서는 다시 저장 안 함
        isScoreSaved = true; 
        
        setTimeout(updateRankingUI, 1500); 

    } catch (e) { 
        console.error("❌ 저장 실패:", e);
        // 실패했을 경우에만 다시 시도할 수 있게 플래그를 두지 않음 (isScoreSaved = false 유지)
    } finally { 
        isSaving = false; // 통신 잠금 해제
    }
}

/**
 * 5. 📸 인증 및 캡쳐 실행
 */
async function autoCaptureAndShare() {
    const scoreText = document.getElementById('score-text')?.innerText || "0";
    const finalScore = parseInt(scoreText.replace(/[^0-9]/g, "")) || 0;

    // 1. 점수 저장 실행 (이미 저장했으면 내부에서 알아서 무시함)
    await saveScoreToDB(finalScore);

    // 2. 캡쳐 실행 (저장 여부와 상관없이 캡쳐는 계속 가능)
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
    updateRankingUI();

    const btnName = document.getElementById('btn-name-start');
    if (btnName) {
        btnName.onclick = () => {
            const input = document.getElementById('user-nickname');
            const val = input.value.trim();
            
            if (!val) {
                alert("이름을 입력해주세요! 😊");
                return;
            }
            if(val.length > 20) {
                alert("닉네임은 최대 20자까지만 가능합니다.");
                return;
            }
            
            userTempNickname = val;
            startGame();
        };
    }

    const btnAnon = document.getElementById('btn-anon-start');
    if (btnAnon) {
        btnAnon.onclick = () => {
            userTempNickname = "은둔 통달자";
            startGame();
        };
    }
});