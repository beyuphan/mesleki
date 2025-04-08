const toggleButton = document.getElementById('t_mode');

function updateTheme() {
    const isDarkMode = document.body.classList.contains('dark-theme');
    toggleButton.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    updateTheme();
}

function checkTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    updateTheme();
}

toggleButton.addEventListener('click', toggleTheme);
window.addEventListener('load', checkTheme);


let abbreviations = [];

// Uygulama başlangıcında verileri yükle
async function loadAbbreviations() {
    try {
        const response = await fetch('abbreviations.json');
        const data = await response.json(); // Direkt dizi olarak gelecek
        abbreviations = data; // data.abbreviations yerine direkt data
    } catch (error) {
        console.error('Hata:', error);
        document.getElementById('quiz-card').innerHTML = `
            <h2>Veriler yüklenirken hata oluştu</h2>
            <p>${error.message}</p>
            <button onclick="location.reload()">Tekrar Dene</button>
        `;
    }
}



let currentIndex = 0;
let correctAnswers = 0;
let wrongAnswers = 0;

// DOM Elements
const abbreviationElement = document.getElementById('abbreviation');
const userAnswerInput = document.getElementById('user-answer');
const checkAnswerButton = document.getElementById('check-answer');
const resultMessage = document.getElementById('result-message');
const progressBar = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
const statsElement = document.getElementById('stats');
const totalAnsweredElement = document.getElementById('total-answered');
const correctCountElement = document.getElementById('correct-count');
const wrongCountElement = document.getElementById('wrong-count');

// Load user progress from cookies
function loadProgress() {
    const progress = JSON.parse(localStorage.getItem('abbreviationProgress')) || {
        index: 0,
        correct: 0,
        wrong: 0,
        wrongAnswers: [],
        correctAnswersList: [],
    };
    
    currentIndex = progress.index;
    correctAnswers = progress.correct;
    wrongAnswers = progress.wrong;
    wrongAnswersList = progress.wrongAnswers || [];
    correctAnswersList = progress.correctAnswersList || [];

    updateProgress();
    showNextAbbreviation();
    updateCorrectAnswersList();
    updateWrongAnswersList();
}
// Uygulama başlangıç fonksiyonunu değiştir
    document.addEventListener('DOMContentLoaded', () => {
    checkTheme();
    loadAbbreviations(); // Verileri yükle ve uygulamayı başlat
});

// Save progress to cookies
function saveProgress() {
    const progress = {
        index: currentIndex,
        correct: correctAnswers,
        wrong: wrongAnswers,
        correctAnswersList: correctAnswersList,
        wrongAnswersList: wrongAnswersList
    };
    
    localStorage.setItem('abbreviationProgress', JSON.stringify(progress));
}

// Update progress bar and text
function updateProgress() {
    const progress = (currentIndex / abbreviations.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${currentIndex}/${abbreviations.length}`;
    
    totalAnsweredElement.textContent = currentIndex;
    correctCountElement.textContent = correctAnswers;
    wrongCountElement.textContent = wrongAnswers;
}

// Show next abbreviation
function showNextAbbreviation() {
    if (currentIndex < abbreviations.length) {
        abbreviationElement.textContent = abbreviations[currentIndex].short;
        userAnswerInput.value = '';
        resultMessage.textContent = '';
        userAnswerInput.focus();
    } 
}
let wrongAnswersList = [];
// Check user's answer
function checkAnswer() {
    const correctAnswer = abbreviations[currentIndex].long;
    const userAnswer = userAnswerInput.value.trim();
    const currentAbbr = abbreviations[currentIndex].short;
    
    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        resultMessage.textContent = "Doğru!";
        resultMessage.className = "correct";
        correctAnswers++;

          // Doğru cevabı listeye ekle
          correctAnswersList.push({
            abbreviation: currentAbbr,
            answer: correctAnswer
        });
        updateCorrectAnswersList();
    } else {
        resultMessage.innerHTML = `Yanlış! Doğru cevap: <strong>${correctAnswer}</strong>`;
        resultMessage.className = "wrong";
        wrongAnswers++;
        // Yanlış cevabı listeye ekle
        wrongAnswersList.push({
            abbreviation: abbreviations[currentIndex].short,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer
        });
        updateWrongAnswersList();
    }

    
    currentIndex++;
    saveProgress();
    updateProgress();
    
     
    if (currentIndex < abbreviations.length) {
        setTimeout(showNextAbbreviation, 1500);
    } else {
        showCompletionMessage();
    }
}

// Yeni fonksiyonlar ekle
function showCompletedScreen() {
    document.getElementById('quiz-card').classList.add('hidden');
    document.getElementById('completed-screen').classList.remove('hidden');
    document.getElementById('stats').classList.remove('hidden');
    
    const wrongAnswersListElement = document.getElementById('wrong-answers-list');
    wrongAnswersListElement.innerHTML = '';
    
    wrongAnswersList.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.abbreviation}:</strong> 
                       Senin cevabın: <span class="wrong">${item.userAnswer || 'Boş'}</span>, 
                       Doğrusu: <span class="correct">${item.correctAnswer}</span>`;
        wrongAnswersListElement.appendChild(li);
    });
}

function resetProgress() {
    if (confirm("Tüm ilerlemeniz silinecek. Emin misiniz?")) {
        localStorage.removeItem('abbreviationProgress');
        currentIndex = 0;
        correctAnswers = 0;
        wrongAnswers = 0;
        correctAnswersList = [];
        wrongAnswersList = [];
        
        updateProgress();
        updateCorrectAnswersList();
        updateWrongAnswersList();
        showNextAbbreviation();
        
        resultMessage.textContent = '';
        userAnswerInput.value = '';
    }
}
// Listeleri güncelleyen fonksiyonlar
function updateCorrectAnswersList() {
    const listElement = document.getElementById('correct-answers-list');
    listElement.innerHTML = '';
    
    correctAnswersList.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${item.abbreviation}</span> <span class="correct-answer">✓</span>`;
        listElement.appendChild(li);
    });
}

function updateWrongAnswersList() {
    const listElement = document.getElementById('wrong-answers-list');
    listElement.innerHTML = '';
    
    wrongAnswersList.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.abbreviation}</span>
            <div>
                <span class="wrong-answer">${item.userAnswer}</span> →
                <span class="correct-answer">${item.correctAnswer}</span>
            </div>
        `;
        listElement.appendChild(li);
    });
}


// Reset butonu event listener'ı ekle
document.getElementById('reset-button').addEventListener('click', resetProgress);


// Event listeners
checkAnswerButton.addEventListener('click', checkAnswer);
userAnswerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

// Initialize
loadProgress();
