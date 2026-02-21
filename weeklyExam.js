/**
 * 📖 weeklyExam.js: 주간 인맞음 확인 시험 전용 로직 (완전 재구축)
 * 문법 오류 원천 차단 및 독립적이고 깔끔한 실행을 보장합니다.
 */

let currentWeeklyData = null; // 재시험을 위한 원본 데이터 저장
const weeklyCache = {}; // 로딩 속도 최적화 캐시

// 1. 주간 시험 목록 열기
window.openWeeklyFolder = function() {
    // iOS 시트 닫기 (존재할 경우)
    const sheet = document.getElementById('ios-sheet-overlay');
    if (sheet && sheet.classList.contains('active')) {
        if (typeof toggleIOSSheet === 'function') toggleIOSSheet();
    }

    // 팝업이 닫히는 시간을 벌어주고 화면 전환
    setTimeout(() => {
        if (typeof hideAllSections === 'function') hideAllSections();
        
        const listArea = document.getElementById('list-area');
        if (listArea) listArea.style.display = 'block';
        
        // 상단 뒤로가기 버튼을 '홈으로' 가도록 변경
        const navBtn = document.querySelector('#list-area .quiz-nav-left');
        if (navBtn) {
            navBtn.setAttribute('onclick', 'showMain()');
            navBtn.innerHTML = '<span class="nav-btn">〈 홈으로</span>';
        }

        if (typeof updateNavUI === 'function') updateNavUI(false);

        const container = document.getElementById('file-container');
        if (!container) return;

        // 주간 시험 폴더 찾기 (이름에 '주간'이 포함되면 무조건 찾음)
        let targetFolder = null;
        if (allData && allData.length > 0) {
            targetFolder = allData.find(f => f.folderName && f.folderName.includes('주간'));
        }

        container.innerHTML = `<h3 style="text-align:center; color:#007AFF; margin-bottom:20px; font-size: 22px;">📁 주간 인맞음 확인 시험</h3>`;

        if (!targetFolder || !targetFolder.files || targetFolder.files.length === 0) {
            container.innerHTML += "<p style='text-align:center; color:#666; font-weight:600; margin-top:30px;'>아직 등록된 시험이 없습니다.</p>";
            return;
        }

        let listHtml = "";
        targetFolder.files.forEach((file, index) => {
            // 첫 번째 파일에만 NEW 뱃지 적용
            let badge = (index === 0) ? `<div class="new-badge">NEW</div>` : '';
            listHtml += `
                <div class="menu-card" onclick="loadWeeklyQuiz('${file.id}')" 
                     style="background:rgba(255,255,255,0.9); border-radius:16px; padding:18px 20px; margin-bottom:15px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; box-shadow:0 8px 20px rgba(0,0,0,0.05); position:relative; border:1px solid rgba(255,255,255,1);">
                    ${badge}
                    <span style="pointer-events:none; font-weight:800; color:#1c1c1e; font-size:16px;">${file.name || '제목 없음'}</span>
                    <span class="ios-chevron" style="pointer-events:none;">〉</span>
                </div>`;
        });
        container.innerHTML += listHtml;
        window.scrollTo(0, 0);
    }, 150);
};

// 2. 시험지 데이터 불러오기
window.loadWeeklyQuiz = async function(id) {
    document.getElementById('list-area').style.display = 'none';
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'block';

    if (weeklyCache[id]) {
        if (loadingEl) loadingEl.style.display = 'none';
        window.renderWeeklyQuiz(weeklyCache[id]);
        return;
    }

    try {
        const res = await fetch(`${SERVER_URL}?id=${id}`);
        const data = await res.json();
        weeklyCache[id] = data;
        window.renderWeeklyQuiz(data);
    } catch (e) {
        console.error(e);
        alert("시험지를 불러오지 못했습니다. 통신 상태를 확인해주세요.");
        showMain();
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
};

// 3. 시험지 텍스트 파싱 및 렌더링
window.renderWeeklyQuiz = function(data) {
    currentWeeklyData = data;
    
    if (typeof hideAllSections === 'function') hideAllSections();
    const quizArea = document.getElementById('quiz-area');
    if (quizArea) quizArea.style.display = 'block';
    
    const titleEl = document.getElementById('quiz-title');
    if (titleEl) titleEl.textContent = data.title || "주간 인맞음 시험";

    // 주간 시험 전용 설정 (띄어쓰기 무시 숨김, 버튼 변경)
    const ignoreSpaceRow = document.getElementById('row-ignorespace');
    if (ignoreSpaceRow) ignoreSpaceRow.style.display = 'none';
    isIgnoreSpaceMode = false; // 무조건 엄격 채점

    const submitBtn = document.getElementById('main-submit-btn');
    if (submitBtn) {
        submitBtn.onclick = window.submitWeeklyQuiz;
        submitBtn.innerText = "제출 및 오답 확인";
    }

    const container = document.getElementById('quiz-text');
    if (!container) return;
    container.innerHTML = '';
    currentAnswers = [];

    const rawText = (typeof data === 'string') ? data : (data.quiz || data.content || JSON.stringify(data));
    const lines = rawText.split('\n');
    
    let cardDiv = null;

    lines.forEach(line => {
        let text = line.trim();
        if (!text || text.startsWith('\s*([^)]+)\)/g;
        if (regex.test(text)) {
            htmlStr = text.replace(regex, function(match, p1) {
                const ans = p1.trim();
                currentAnswers.push(ans);
                const width = Math.min(Math.max(ans.length * 1.2 + 2, 4), 20);
                return `<input type="text" class="q-inline-input weekly-input" data-ans="${ans}" placeholder="입력" style="width:${width}em; max-width:95%; border-bottom:3px solid #007AFF; color:#007AFF; font-weight:800; text-align:center; margin: 2px 4px;">`;
            });
            htmlStr = `<div style="line-height:2.4; font-size:1.05rem; color:#1c1c1e; margin-bottom:12px; word-break:keep-all;">${htmlStr}</div>`;
        } 
        else if (text.startsWith('답>')) {
            htmlStr = `<div style="font-weight:600; color:#888; margin-bottom:8px; font-size:0.95rem;">${text}</div>`;
        } 
        else {
            const isHeading = /^(\d+~?\d*\.|:\d+)/.test(text);
            htmlStr = `<div style="${isHeading ? 'font-weight:800; font-size:1.15rem; color:#1c1c1e;' : 'font-weight:600; color:#555;'} margin-bottom:8px; word-break:keep-all;">${text}</div>`;
        }

        const lineDiv = document.createElement('div');
        lineDiv.innerHTML = htmlStr;
        cardDiv.appendChild(lineDiv);
    });

    // 실시간 정답 확인 기능 연결
    setTimeout(() => {
        const inputs = document.querySelectorAll('.weekly-input');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                if (isRealtimeMode) {
                    const uVal = this.value;
                    const cAns = this.dataset.ans || "";
                    if (!uVal) this.style.color = '#007AFF';
                    else if (cAns.startsWith(uVal)) this.style.color = '#28a745';
                    else this.style.color = '#dc3545';
                } else {
                    this.style.color = '#007AFF';
                }
            });
        });
    }, 100);

    window.scrollTo(0, 0);
};

// 4. 채점 및 오답노트 출력
window.submitWeeklyQuiz = function() {
    const inputs = document.querySelectorAll('.weekly-input');
    if (inputs.length === 0) return;

    let correct = 0;
    const total = inputs.length;
    const reviewData = [];

    inputs.forEach((input, idx) => {
        const uVal = input.value.trim();
        const ans = currentAnswers[idx] || "";
        
        // 🚨 토시 하나 안 틀려야 정답 인정
        const isCorrect = (uVal === ans && uVal !== "");

        if (isCorrect) {
            correct++;
            input.style.color = '#28a745';
        } else {
            input.style.color = '#dc3545';
            input.style.textDecoration = 'line-through';
        }

        // 오답노트를 위한 문항 번호 찾기
        let refText = `문항 ${idx + 1}`;
        let parentCard = input.closest('.quiz-item');
        if (parentCard) {
            let firstDiv = parentCard.querySelector('div');
            if (firstDiv && /^(\d+~?\d*\.|:\d+)/.test(firstDiv.innerText)) {
                refText = firstDiv.innerText.split(' ')[0] + "번";
            }
        }

        reviewData.push({
            ref: refText,
            user: uVal || "(미입력)",
            answer: ans,
            isCorrect: isCorrect
        });

        input.readOnly = true;
    });

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    // 공통 오답노트 UI 렌더링 호출
    if (typeof renderReviewNoteGrouped === 'function') {
        renderReviewNoteGrouped(reviewData);
    }

    // 화면 전환
    document.getElementById('quiz-area').style.display = 'none';
    const resultArea = document.getElementById('result-area');
    if (resultArea) resultArea.style.display = 'flex';

    // 주간 시험 전용 결과 헤더 조립 (인증 버튼 없음, 재시험 추가)
    const header = document.querySelector('.result-header');
    if (header) {
        header.innerHTML = `
            <div class="result-chapter-badge" style="background:#F0F4FF; color:#007AFF;">주간 인맞음 확인</div>
            <h2 style="font-size:24px; margin-bottom:5px;">시험 결과</h2>
            <div id="score-text" style="font-size:55px;">${score}점</div>
            <div id="score-msg" style="margin-bottom: 20px; font-weight:600; color:#555;">
                총 ${total}개 빈칸 중 <b style="color:#007AFF;">${correct}개</b> 정답!
            </div>
            
            <div style="display:flex; gap:10px; width:100%; margin-top:10px;">
                <button class="submit-btn" style="flex:1; margin:0; background:rgba(0,122,255,0.1); color:#007AFF; box-shadow:none;" onclick="showMain()">🏠 홈으로</button>
                <button class="submit-btn primary-action-btn" style="flex:1; margin:0;" onclick="window.retryWeeklyQuiz()">🔄 재시험</button>
            </div>
        `;
    }

    if (typeof updateNavUI === 'function') updateNavUI(false);
    window.scrollTo(0, 0);
};

// 5. 재시험 로직
window.retryWeeklyQuiz = function() {
    if (currentWeeklyData) {
        window.renderWeeklyQuiz(currentWeeklyData);
    }
};