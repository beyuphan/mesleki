// TEMA AYARLARI
const toggleButton = document.getElementById('t_mode');
const modeToggle = document.getElementById('mode_toggle'); // HTML'e buton eklemen lazım

let isQuizMode = false; // Varsayılan: Yazma modu
let options = []; // Şıklar için dizi


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

// UYGULAMA DEĞİŞKENLERİ
let abbreviations = [];
let currentIndex = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let correctAnswersList = [];
let wrongAnswersList = [];

// DOM ELEMENTLERİ
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
const correctAnswersListElement = document.getElementById('correct-answers-list');
const wrongAnswersListElement = document.getElementById('wrong-answers-list');


// ŞIKLARI OLUŞTUR
function generateOptions(correctAnswer) {
    const options = [correctAnswer];
    
    // 2 yanlış şık ekle (rastgele)
    while(options.length < 3) {
        const randomIndex = Math.floor(Math.random() * abbreviations.length);
        const wrongOption = abbreviations[randomIndex].long;
        if(!options.includes(wrongOption)) {
            options.push(wrongOption);
        }
    }
    
    // Karıştır
    return options.sort(() => Math.random() - 0.5);
}

// TEST MODU ARAYÜZÜ
function showQuizMode() {
    document.getElementById('user-answer').style.display = 'none';
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.style.display = 'block';
    
    const correctAnswer = abbreviations[currentIndex].long;
    options = generateOptions(correctAnswer);
    
    optionsContainer.innerHTML = '';
    options.forEach((option, i) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => {
            // Tüm butonlardan active classını kaldır
            document.querySelectorAll('#options-container button').forEach(btn => {
                btn.classList.remove('selected', 'wrong-selected');
            });
            
            // Seçilen butonu işaretle
            const isCorrect = option.toLowerCase() === correctAnswer.toLowerCase();
            button.classList.add(isCorrect ? 'selected' : 'wrong-selected');
            
            // Cevabı kontrol et
            userAnswerInput.value = option;
            checkAnswer(option);
        };
        optionsContainer.appendChild(button);
    });
}

// YAZMA MODU ARAYÜZÜ
function showWriteMode() {
    document.getElementById('user-answer').style.display = 'block';
    document.getElementById('options-container').style.display = 'none';
}

function toggleMode() {
    isQuizMode = !isQuizMode;
    modeToggle.textContent = isQuizMode ? "Yazma Moduna Geç" : "Test Moduna Geç";
    saveCurrentMode();
    
    // Mevcut soruyu yeni modda göster
    if (currentIndex < abbreviations.length) {
        if (isQuizMode) {
            showQuizMode();
        } else {
            showWriteMode();
        }
    }
}

// MODU KAYDET
function saveCurrentMode() {
    localStorage.setItem('quizMode', JSON.stringify(isQuizMode));
}

// MODU YÜKLE
function loadCurrentMode() {
    const savedMode = localStorage.getItem('quizMode');
    if (savedMode !== null) {
        isQuizMode = JSON.parse(savedMode);
        modeToggle.textContent = isQuizMode ? "Yazma Moduna Geç" : "Test Moduna Geç";
    }
}



// UYGULAMA BAŞLATMA
async function initializeApp() {
    try {
        checkTheme();
        loadCurrentMode(); // Modu yükle
        await loadAbbreviations();
        initEventListeners();
        loadProgress();
        showNextAbbreviation();
    } catch (error) {
        console.error('Uygulama başlatılamadı:', error);
        showError(error);
    }

     // Moda göre arayüzü ayarla
     if(isQuizMode) {
        showQuizMode();
    } else {
        showWriteMode();
    }
}

// HATA GÖSTERİMİ
function showError(error) {
    document.getElementById('quiz-card').innerHTML = `
        <h2>Uygulama başlatılamadı</h2>
        <p>${error.message}</p>
        <button onclick="location.reload()">Tekrar Dene</button>
    `;
}

// VERİ YÜKLEME
async function loadAbbreviations() {
    const response = await fetch('abbreviations.json');
    if (!response.ok) throw new Error('Veriler yüklenemedi');
    abbreviations = await response.json();
    if (abbreviations.length === 0) throw new Error('Kısaltma listesi boş');
}

// EVENT LİSTENER'LAR
function initEventListeners() {
    toggleButton.addEventListener('click', toggleTheme);
    modeToggle.addEventListener('click', toggleMode); // Bu satırı ekledik
    checkAnswerButton.addEventListener('click', function(){
        if(!isQuizMode){
            checkAnswer();
        }
    });
    userAnswerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
    document.getElementById('reset-button').addEventListener('click', resetProgress);
}

// İLERLEME YÜKLEME
function loadProgress() {
    const progress = JSON.parse(localStorage.getItem('abbreviationProgress')) || {
        index: 0,
        correct: 0,
        wrong: 0,
        correctAnswersList: [],
        wrongAnswersList: []
    };
    
    currentIndex = progress.index;
    correctAnswers = progress.correct;
    wrongAnswers = progress.wrong;
    correctAnswersList = progress.correctAnswersList;
    wrongAnswersList = progress.wrongAnswersList;

    updateProgress();
    updateAnswersLists();
}

// İLERLEME KAYDETME
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

// İLERLEME ÇUBUĞU GÜNCELLEME
function updateProgress() {
    if (abbreviations.length === 0) return;
    
    const progress = (currentIndex / abbreviations.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${currentIndex}/${abbreviations.length}`;
    
    totalAnsweredElement.textContent = currentIndex;
    correctCountElement.textContent = correctAnswers;
    wrongCountElement.textContent = wrongAnswers;
}

// SONRAKİ KISALTAYI GÖSTER
function showNextAbbreviation() {
    if (currentIndex >= abbreviations.length) {
        showCompletionMessage();
        return;
    }
    
    abbreviationElement.textContent = abbreviations[currentIndex].short;
    userAnswerInput.value = '';
    resultMessage.textContent = '';
    userAnswerInput.focus();
}

// CEVAP KONTROLÜ
function checkAnswer(answer = null) {
    // Eğer tüm sorular bitmişse devam etme
    if (currentIndex >= abbreviations.length) return;
    
    const correctAnswer = abbreviations[currentIndex].long;
    let userAnswer;
    
    // Kullanıcı cevabını al
    if (isQuizMode && answer !== null) {
        // Test modunda parametre olarak gelen cevabı kullan
        userAnswer = answer;
    } else {
        // Yazma modunda input alanındaki cevabı kullan
        userAnswer = userAnswerInput.value.trim();
    }
    
    const currentAbbr = abbreviations[currentIndex].short;
    
    // Cevap kontrolü
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
    
    // Sonucu işle
    if (isCorrect) {
        handleCorrectAnswer(currentAbbr, correctAnswer);
    } else {
        handleWrongAnswer(currentAbbr, userAnswer, correctAnswer);
    }
    
    // İlerlemeyi güncelle
    currentIndex++;
    saveProgress();
    updateProgress();
    
    // Sonraki soruya geç veya tamamlandı mesajı göster
    if (currentIndex < abbreviations.length) {
        setTimeout(() => {
            showNextAbbreviation();
            if (isQuizMode) {
                showQuizMode();
            }
        }, 1500);
    } else {
        showCompletionMessage();
    }
}


// DOĞRU CEVAP İŞLEMLERİ
function handleCorrectAnswer(abbr, answer) {
    resultMessage.textContent = "Doğru!";
    resultMessage.className = "correct";
    correctAnswers++;
    correctAnswersList.push({ abbreviation: abbr, answer: answer });
    updateAnswersLists();
}

// YANLIŞ CEVAP İŞLEMLERİ
function handleWrongAnswer(abbr, userAnswer, correctAnswer) {
    resultMessage.innerHTML = `Yanlış! Doğru cevap: <strong>${correctAnswer}</strong>`;
    resultMessage.className = "wrong";
    wrongAnswers++;
    wrongAnswersList.unshift({
        abbreviation: abbr,
        userAnswer: userAnswer || 'Boş',
        correctAnswer: correctAnswer
    });
    updateAnswersLists();
}

// CEVAP LİSTELERİNİ GÜNCELLE
function updateAnswersLists() {
    updateList(correctAnswersListElement, correctAnswersList, true);
    updateList(wrongAnswersListElement, wrongAnswersList, false);
}

function updateList(element, list, isCorrect) {
    element.innerHTML = '';
    list.forEach(item => {
        const li = document.createElement('li');
        if (isCorrect) {
            li.innerHTML = `<span>${item.abbreviation}</span> <span class="correct-answer">✓</span>`;
        } else {
            li.innerHTML = `
                <span>${item.abbreviation}</span>
                <div>
                    <span class="wrong-answer">${item.userAnswer}</span> →
                    <span class="correct-answer">${item.correctAnswer}</span>
                </div>
            `;
        }
        element.appendChild(li);
    });
}

// TAMAMLAMA MESAJI
function showCompletionMessage() {
    abbreviationElement.textContent = "Tebrikler! Tüm kısaltmaları tamamladınız!";
    userAnswerInput.style.display = 'none';
    checkAnswerButton.style.display = 'none';
    statsElement.classList.remove('hidden');
}

// SIFIRLAMA İŞLEMİ
function resetProgress() {
    if (confirm("Tüm ilerlemeniz silinecek. Emin misiniz?")) {
        localStorage.removeItem('abbreviationProgress');
        currentIndex = 0;
        correctAnswers = 0;
        wrongAnswers = 0;
        correctAnswersList = [];
        wrongAnswersList = [];
        
        updateProgress();
        updateAnswersLists();
        showNextAbbreviation();
        
        resultMessage.textContent = '';
        userAnswerInput.style.display = 'block';
        checkAnswerButton.style.display = 'block';
        statsElement.classList.add('hidden');
    }
}

// UYGULAMAYI BAŞLAT
document.addEventListener('DOMContentLoaded', initializeApp);