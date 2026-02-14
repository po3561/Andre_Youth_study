/**
 * 📖 weeklyExam.js: 지능형 그룹화 및 초고속 캐싱 버전
 */
const weeklyCache = {}; // ⚡ 로딩 속도 0.5초 달성 캐시

/**
 * 📁 폴더 내 파일 목록 표시
 */
async function showFolder(folderName) {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('list-area').style.display = 'block';
    const container = document.getElementById('file-container');
    container.innerHTML = `<h3 style="text-align:center; color:var(--primary); margin-bottom:20px;">📁 ${folderName}</h3>`;

    const folderData = allData.find(f => f.folderName === folderName);
    if (!folderData || folderData.files.length === 0) {
        container.innerHTML += "<p style='text-align:center;'>파일이 없습니다.</p>";
        return;
    }

    let listHtml = "";
    folderData.files.forEach(file => {
        // 💡 클릭 영역(onclick)이 확실히 작동하도록 인라인 스타일 보강
        listHtml += `
            <div class="menu-card" onclick="loadWeeklyQuiz('${file.id}')" 
                 style="background:white; border-radius:12px; padding:18px; margin-bottom:12px; cursor:pointer; display:flex; justify-content:space-between; box-shadow:0 4px 10px rgba(0,0,0,0.05); position:relative; z-index:10;">
                <span style="pointer-events:none;">${file.name}</span><span style="pointer-events:none;">〉</span>
            </div>`;
    });
    container.innerHTML += listHtml;
}

/**
 * 🚀 주간 시험 로드 (캐시 적용)
 */
async function loadWeeklyQuiz(id) {
    document.getElementById('list-area').style.display = 'none';
    const loadingEl = document.getElementById('loading');

    if (weeklyCache[id]) {
        renderWeeklyQuiz(weeklyCache[id]);
        return;
    }

    loadingEl.style.display = 'block';
    try {
        const res = await fetch(`${SERVER_URL}?id=${id}`);
        const data = await res.json();
        weeklyCache[id] = data;
        renderWeeklyQuiz(data);
    } catch (e) { 
        alert("시험지를 불러오지 못했습니다.");
        showMain();
    } finally { 
        loadingEl.style.display = 'none';
    }
}

/**
 * 🎨 다문항(①, ②) 및 복합 양식 지능형 렌더링
 */
function renderWeeklyQuiz(data) {
    document.getElementById('quiz-area').style.display = 'block';
    document.getElementById('quiz-title').textContent = data.title;
    
    const quizContainer = document.getElementById('quiz-text');
    quizContainer.innerHTML = '';
    currentAnswers = [];
    let answerCursor = 0;

    const lines = data.quiz.split('\n');
    let currentCard = null;

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // 💡 문항 번호(숫자.) 인식 시에만 새 카드 생성
        if (trimmed.match(/^\d+\./)) {
            currentCard = document.createElement('div');
            currentCard.className = 'quiz-item';
            currentCard.style.cssText = "margin-bottom:20px; padding:20px; background:white; border-radius:15px; box-shadow:0 4px 12px rgba(0,0,0,0.05); border-left:6px solid var(--primary);";
            quizContainer.appendChild(currentCard);
        }

        // 카드가 없는 상태 방지
        if (!currentCard) {
            currentCard = document.createElement('div');
            currentCard.className = 'quiz-item';
            currentCard.style.cssText = "margin-bottom:20px; padding:20px; background:white; border-radius:15px; border-left:6px solid var(--primary);";
            quizContainer.appendChild(currentCard);
        }

        let htmlLine = trimmed;

        // 💡 비고(※) 처리
        if (trimmed.startsWith('※')) {
            htmlLine = `<div style="font-size:0.85rem; color:#888; margin-top:5px; padding-left:10px; line-height:1.4;">${trimmed}</div>`;
        } 
        // 💡 빈칸 처리 (다문항 지원)
        else if (trimmed.includes('[[INPUT_FIELD]]')) {
            const fieldCount = (trimmed.match(/\[\[INPUT_FIELD\]\]/g) || []).length;
            for (let i = 0; i < fieldCount; i++) {
                const currentAns = data.answers[answerCursor++];
                currentAnswers.push(currentAns);
                const width = Math.max(currentAns.length * 1.3, 4);
                const inputHtml = `<input type="text" class="q-inline-input" data-ans="${currentAns}" 
                                   style="width:${width}rem; max-width:95%; border:none; border-bottom:2px solid var(--primary); background:#fff9c4; font-weight:bold; color:#d93025; text-align:center; outline:none; border-radius:4px; margin:2px 4px;">`;
                htmlLine = htmlLine.replace('[[INPUT_FIELD]]', inputHtml);
            }
            htmlLine = `<div style="line-height:2.4; font-size:1.1rem; color:#333;">${htmlLine}</div>`;
        } 
        // 💡 일반 질문/텍스트 처리
        else {
            const isQuestion = trimmed.match(/^\d+\./);
            htmlLine = `<div style="${isQuestion ? 'font-weight:bold; font-size:1.15rem; color:#222;' : 'color:#444;'} margin-bottom:8px;">${trimmed}</div>`;
        }

        const lineDiv = document.createElement('div');
        lineDiv.innerHTML = htmlLine;
        currentCard.appendChild(lineDiv);
    });

    window.scrollTo(0, 0);
}

