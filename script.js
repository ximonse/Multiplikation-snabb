let questions = [];
let currentQuestionIndex = 0;
let requiredRepetitions = {};
let selectedTables = [];
let startTime;
let totalTime;
let questionStartTime;

// Initiera checkboxar för tabellval
window.onload = function() {
  const checkboxesContainer = document.getElementById('tablesCheckboxes');
  for (let i = 2; i <= 10; i++) {
    const div = document.createElement('div');
    div.innerHTML = `
      <label>
        <input type="checkbox" value="${i}" onchange="updateSelectedTables()">
        ${i}-ans tabell
      </label>
    `;
    checkboxesContainer.appendChild(div);
  }
  
  // Aktivera Enter-tangenten för svar
  document.getElementById('answerInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && this.value !== '') {
      checkAnswer();
    }
  });
  
  // Aktivera namn-input
  document.getElementById('nameInput').addEventListener('input', updateStartButton);
};

function updateSelectedTables() {
  const checkboxes = document.querySelectorAll('#tablesCheckboxes input[type="checkbox"]');
  selectedTables = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => parseInt(cb.value));
  updateStartButton();
}

function updateStartButton() {
  const name = document.getElementById('nameInput').value.trim();
  const startButton = document.getElementById('startButton');
  startButton.disabled = !name || selectedTables.length === 0;
}

// Generera unika multiplikationer och deras omvända version
function generateQuestions() {
  const uniquePairs = new Set();
  const questions = [];
  
  // Generera alla unika kombinationer
  selectedTables.forEach(table1 => {
    for (let i = 1; i <= 10; i++) {
      // Sortera talen för att undvika dubletter
      const pair = [Math.min(table1, i), Math.max(table1, i)].join('x');
      if (!uniquePairs.has(pair)) {
        uniquePairs.add(pair);
        // Lägg till båda versionerna av multiplikationen
        const [a, b] = pair.split('x').map(Number);
        questions.push({
          num1: a,
          num2: b,
          answer: a * b,
          id: `${a}x${b}`
        });
        // Lägg till omvänd version om talen är olika
        if (a !== b) {
          questions.push({
            num1: b,
            num2: a,
            answer: a * b,
            id: `${a}x${b}`  // Samma ID för att hantera repetitioner tillsammans
          });
        }
      }
    }
  });
  
  // Blanda frågorna
  return questions.sort(() => Math.random() - 0.5);
}

function startPractice() {
  const name = document.getElementById('nameInput').value.trim();
  document.getElementById('studentName').textContent = name;
  document.getElementById('setupScreen').classList.remove('active');
  document.getElementById('practiceScreen').classList.add('active');
  
  questions = generateQuestions();
  requiredRepetitions = {};
  currentQuestionIndex = 0;
  startTime = new Date();
  showCurrentQuestion();
}

function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function showCurrentQuestion() {
  const question = questions[currentQuestionIndex];
  document.getElementById('questionText').textContent = 
    `${question.num1} × ${question.num2} = ?`;
  document.getElementById('answerInput').value = '';
  document.getElementById('feedback').textContent = '';
  document.getElementById('answerInput').focus();
  questionStartTime = new Date();
}

function getRandomErrorMessage(num1, num2, answer) {
  // Visa alltid uträkningen först, sedan svaret
  return Math.random() < 0.5 ? 
    `Fel svar. ${num1} × ${num2} = ${answer}` :
    `Fel svar. ${num2} × ${num1} = ${answer}`;
}

function handleIncorrectAnswer(question) {
  requiredRepetitions[question.id] = 2;
  
  // Lägg till frågan senare i kön
  const currentQuestion = questions.splice(currentQuestionIndex, 1)[0];
  const newPosition = Math.min(
    currentQuestionIndex + 3,
    questions.length
  );
  questions.splice(newPosition, 0, currentQuestion);
}

function checkAnswer() {
  const answerInput = document.getElementById('answerInput');
  const answer = parseInt(answerInput.value);
  const question = questions[currentQuestionIndex];
  const feedback = document.getElementById('feedback');
  
  // Beräkna svarstid
  const timeSpent = new Date() - questionStartTime;
  const isTooSlow = timeSpent > 2000; // 2 sekunder

  if (answer === question.answer) {
    // Alltid visa "Rätt!" när svaret är korrekt
    feedback.textContent = 'Rätt!';
    feedback.className = 'feedback correct';
    
    if (isTooSlow || requiredRepetitions[question.id]) {
      // Hantera långsamma svar och repetitioner i bakgrunden
      if (isTooSlow) {
        requiredRepetitions[question.id] = 2;
      } else {
        requiredRepetitions[question.id]--;
      }
      
      if (requiredRepetitions[question.id] > 0) {
        questions.splice(
          Math.min(currentQuestionIndex + 3, questions.length),
          0,
          questions[currentQuestionIndex]
        );
      } else {
        delete requiredRepetitions[question.id];
      }
    }
    
    currentQuestionIndex++;
    if (currentQuestionIndex >= questions.length) {
      totalTime = new Date() - startTime;
      showCertificate();
    } else {
      setTimeout(showCurrentQuestion, 1000);
    }
  } else {
    // När svaret är fel
    feedback.textContent = getRandomErrorMessage(question.num1, question.num2, question.answer);
    feedback.className = 'feedback incorrect';
    handleIncorrectAnswer(question);
    setTimeout(showCurrentQuestion, 1500);
  }
}

function showCertificate() {
  document.getElementById('practiceScreen').classList.remove('active');
  document.getElementById('certificateScreen').classList.add('active');
  document.getElementById('certificateName').textContent = 
    document.getElementById('nameInput').value;
  document.getElementById('completedTables').textContent = 
    selectedTables.join(', ');
  document.getElementById('totalTime').textContent = 
    formatTime(totalTime);
  document.getElementById('dateCompleted').textContent = 
    new Date().toLocaleDateString();
}

function resetGame() {
  document.getElementById('certificateScreen').classList.remove('active');
  document.getElementById('setupScreen').classList.add('active');
  document.getElementById('nameInput').value = '';
  const checkboxes = document.querySelectorAll('#tablesCheckboxes input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);
  selectedTables = [];
  updateStartButton();
}

function takeScreenshot() {
  const certificateElement = document.getElementById('certificateScreen');
  html2canvas(certificateElement).then(canvas => {
    const link = document.createElement('a');
    link.download = 'multiplikationsdiplom.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}
