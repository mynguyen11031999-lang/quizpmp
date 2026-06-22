/**
 * QuizMaster App Logic
 * Pure Client-side Javascript
 */

// ==========================================================================
// APPLICATION STATE
// ==========================================================================
let state = {
    questions: [],        // Raw parsed questions: { id, question, options[], correctIndex, correctKey, explanation }
    starred: [],          // Starred question IDs (which correspond to question raw indices)
    history: [],          // Exam history: { id, title, score, total, percentage, timeSpent, date }
    answeredStats: {},    // Study progress: { [questionId]: 'correct' | 'incorrect' }
    currentFile: null,    // Uploaded file name
    columnMapping: null,  // Saved column mappings
};

// Runtime states for screens
let currentScreen = 'screen-upload';
let excelDataRaw = null;  // Stores parsed workbook sheet row arrays before mapping

// Study Mode State
let studyState = {
    filteredIndices: [],  // Indices of questions matching filters
    currentIndex: 0,      // Position in filteredIndices
    order: 'sequential',  // 'sequential' or 'random'
    filter: 'all',        // 'all', 'unanswered', 'incorrect', 'starred'
    stats: { correct: 0, incorrect: 0 },
    timeLimit: 'unlimited', // 'unlimited' or minutes (number)
    timeRemaining: 0,     // seconds remaining (if countdown) or elapsed (if count-up)
    timerInterval: null
};

// Exam Mode State
let examState = {
    questions: [],        // Sub-array of questions in the exam (can be shuffled)
    answers: {},          // Selected answers: { [examIndex]: optionIndex }
    currentIndex: 0,
    timeLimit: 50,        // minutes
    timeRemaining: 0,     // seconds
    timerInterval: null,
    totalSeconds: 0       // total duration of exam
};

// Review Mode State (Exam review)
let reviewState = {
    questions: [],
    answers: {},
    currentIndex: 0,
    filter: 'all',         // 'all', 'correct', 'incorrect', 'skipped'
    backScreen: null
};

// All Questions Viewer Screen State
let questionsScreenState = {
    currentPage: 1,
    pageSize: 50,
    searchQuery: ''
};

// LocalStorage Keys
const STORAGE_KEY = 'quizmaster_local_state';

// ==========================================================================
// SAMPLE DATA DEFINITION
// ==========================================================================
const SAMPLE_QUESTIONS = [
    {
        id: 1,
        question: "Đâu là giao thức mạng hoạt động ở tầng ứng dụng (Application Layer) trong mô hình TCP/IP?",
        options: ["TCP", "IP", "HTTP", "UDP"],
        correctIndex: 2,
        correctKey: "C",
        explanation: "HTTP (Hypertext Transfer Protocol) hoạt động ở tầng ứng dụng. TCP và UDP hoạt động ở tầng giao vận (Transport Layer), còn IP hoạt động ở tầng mạng (Internet/Network Layer)."
    },
    {
        id: 2,
        question: "Trong HTML, thẻ nào được sử dụng để tạo một danh sách có thứ tự?",
        options: ["<ul>", "<li>", "<ol>", "<list>"],
        correctIndex: 2,
        correctKey: "C",
        explanation: "<ol> viết tắt của Ordered List, dùng để tạo danh sách có đánh số thứ tự (1, 2, 3...). <ul> dùng cho danh sách không thứ tự (dấu chấm tròn)."
    },
    {
        id: 3,
        question: "Thủ đô của nước Pháp là thành phố nào?",
        options: ["London", "Berlin", "Paris", "Rome"],
        correctIndex: 2,
        correctKey: "C",
        explanation: "Paris là thủ đô của nước Pháp, đồng thời là trung tâm kinh tế, văn hóa lớn nhất đất nước này."
    },
    {
        id: 4,
        question: "Số tự nhiên nhỏ nhất có hai chữ số là số nào?",
        options: ["0", "1", "10", "99"],
        correctIndex: 2,
        correctKey: "C",
        explanation: "Số tự nhiên nhỏ nhất có hai chữ số là số 10. Số 0 và 1 chỉ có một chữ số, còn 99 là số lớn nhất có hai chữ số."
    },
    {
        id: 5,
        question: "Hệ điều hành nào được phát triển trên mã nguồn mở và nhân Linux?",
        options: ["Windows", "macOS", "Android", "iOS"],
        correctIndex: 2,
        correctKey: "C",
        explanation: "Android được phát triển bởi Google dựa trên nền tảng nhân Linux mã nguồn mở, chủ yếu dùng cho các thiết bị di động."
    },
    {
        id: 6,
        question: "Ai là tác giả của tác phẩm văn học nổi tiếng 'Truyện Kiều'?",
        options: ["Nguyễn Trãi", "Nguyễn Du", "Xuân Diệu", "Nam Cao"],
        correctIndex: 1,
        correctKey: "B",
        explanation: "Truyện Kiều (tên gốc: Đoạn trường tân thanh) là một kiệt tác văn học chữ Nôm của Đại thi hào Nguyễn Du."
    },
    {
        id: 7,
        question: "Trái Đất mất khoảng bao lâu để tự quay quanh trục của nó được một vòng?",
        options: ["12 giờ", "24 giờ", "365 ngày", "30 ngày"],
        correctIndex: 1,
        correctKey: "B",
        explanation: "Trái Đất tự quay quanh trục từ Tây sang Đông hết khoảng 24 giờ, tạo ra chu kỳ ngày và đêm liên tục."
    },
    {
        id: 8,
        question: "Trong ngôn ngữ lập trình JavaScript, khai báo biến nào cho phép bạn gán lại giá trị nhưng không được khai báo lại biến trong cùng một phạm vi?",
        options: ["const", "var", "let", "ảll"],
        correctIndex: 2,
        correctKey: "C",
        explanation: "Từ khóa 'let' cho phép gán lại giá trị cho biến nhưng không cho phép khai báo lại biến đó trong cùng một block scope. 'const' không cho gán lại, còn 'var' cho phép khai báo lại thoải mái."
    },
    {
        id: 9,
        question: "Quốc gia nào có diện tích lớn nhất thế giới?",
        options: ["Trung Quốc", "Hoa Kỳ", "Canada", "Nga"],
        correctIndex: 3,
        correctKey: "D",
        explanation: "Liên bang Nga có diện tích lớn nhất thế giới với hơn 17 triệu km², trải dài cả hai lục địa Á và Âu."
    },
    {
        id: 10,
        question: "Công thức hóa học của muối ăn thông thường hàng ngày là gì?",
        options: ["H2O", "CO2", "NaCl", "HCl"],
        correctIndex: 2,
        correctKey: "C",
        explanation: "NaCl (Natri Clorua) là công thức hóa học của muối ăn."
    },
    {
        id: 11,
        question: "Dãy núi nào được mệnh danh là nóc nhà của thế giới?",
        options: ["Andes", "Alps", "Himalaya", "Rocky"],
        correctIndex: 2,
        correctKey: "C",
        explanation: "Himalaya chứa những đỉnh núi cao nhất thế giới, bao gồm đỉnh Everest (8.848m), được gọi là 'mái nhà thế giới'."
    },
    {
        id: 12,
        question: "Đơn vị đo cường độ dòng điện trong hệ đo lường quốc tế (SI) là gì?",
        options: ["Volt (V)", "Ampere (A)", "Ohm (Ω)", "Watt (W)"],
        correctIndex: 1,
        correctKey: "B",
        explanation: "Ampere (ký hiệu: A) là đơn vị đo cường độ dòng điện. Volt đo hiệu điện thế, Ohm đo điện trở, và Watt đo công suất."
    },
    {
        id: 13,
        question: "Hành tinh nào gần Mặt Trời nhất trong Hệ Mặt Trời?",
        options: ["Kim tinh (Venus)", "Thủy tinh (Mercury)", "Hỏa tinh (Mars)", "Trái Đất (Earth)"],
        correctIndex: 1,
        correctKey: "B",
        explanation: "Sao Thủy (Thủy tinh - Mercury) là hành tinh có quỹ đạo gần Mặt Trời nhất."
    },
    {
        id: 14,
        question: "Loại vitamin nào cơ thể có thể tự tổng hợp được thông qua việc tiếp xúc trực tiếp với ánh nắng mặt trời buổi sáng?",
        options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"],
        correctIndex: 3,
        correctKey: "D",
        explanation: "Vitamin D được cơ thể tự sản xuất dưới da khi tiếp xúc với tia UVB trong ánh sáng mặt trời."
    },
    {
        id: 15,
        question: "Bộ nhớ RAM viết tắt của cụm từ tiếng Anh nào?",
        options: ["Read Access Memory", "Random Access Memory", "Rapid Action Memory", "Run Active Memory"],
        correctIndex: 1,
        correctKey: "B",
        explanation: "RAM là viết tắt của Random Access Memory (Bộ nhớ truy cập ngẫu nhiên), dùng để lưu trữ dữ liệu tạm thời khi thiết bị đang hoạt động."
    }
];

// ==========================================================================
// DOCUMENT READY & SETUP
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    loadStateFromLocalStorage();
    setupEventListeners();
    setupTheme();
    updateUIHeaderStatus();
    
    // Switch to dashboard if questions are already loaded
    if (state.questions.length > 0) {
        showScreen('screen-dashboard');
        renderDashboard();
    } else {
        showScreen('screen-upload');
    }
}

// ==========================================================================
// LOCAL STORAGE MANAGEMENT
// ==========================================================================
function saveStateToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Không thể ghi LocalStorage: Có thể do dung lượng câu hỏi quá lớn vượt quá giới hạn trình duyệt.", e);
        // Note: With 1500 questions, JSON string size is ~1MB-2MB, which easily fits in 5MB limit of localStorage.
    }
}

function loadStateFromLocalStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            const parsed = JSON.parse(data);
            state = {
                questions: (parsed.questions || []).map(ensureQuestionFields),
                starred: parsed.starred || [],
                history: parsed.history || [],
                answeredStats: parsed.answeredStats || {},
                currentFile: parsed.currentFile || null,
                columnMapping: parsed.columnMapping || null
            };
        } catch (e) {
            console.error("Lỗi đọc dữ liệu từ LocalStorage:", e);
        }
    }
}

// ==========================================================================
// THEME SWITCHER (LIGHT / DARK)
// ==========================================================================
function setupTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    // Get saved theme or detect system settings
    let savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
        savedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    setTheme(savedTheme);
    
    themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeBtnIcon = document.querySelector('#theme-toggle i');
    if (theme === 'dark') {
        themeBtnIcon.className = 'fa-solid fa-sun';
    } else {
        themeBtnIcon.className = 'fa-solid fa-moon';
    }
}

// ==========================================================================
// EVENT LISTENERS BINDING
// ==========================================================================
function setupEventListeners() {
    // Screen Navigation Hooks
    const showUploadScreen = () => { showScreen('screen-upload'); };
    
    // --- SCREEN 1: UPLOAD EXCEL ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const btnBrowse = document.getElementById('btn-browse');
    const btnLoadSample = document.getElementById('btn-load-sample');
    
    btnBrowse.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    // Drag and Drop
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        }, false);
    });
    
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    btnLoadSample.addEventListener('click', () => {
        loadSampleData();
    });

    const btnDownloadTemplate = document.getElementById('btn-download-template');
    if (btnDownloadTemplate) {
        btnDownloadTemplate.addEventListener('click', () => {
            downloadExcelTemplate();
        });
    }
    
    // --- SCREEN 2: MAPPING WIZARD ---
    document.getElementById('btn-mapping-back').addEventListener('click', () => {
        showScreen('screen-upload');
    });
    
    document.getElementById('btn-add-map-option').addEventListener('click', () => {
        addNewOptionMappingSelect();
    });
    
    document.getElementById('btn-import-confirm').addEventListener('click', () => {
        confirmAndImportQuestions();
    });
    
    // Update preview when selects change
    document.getElementById('screen-mapping').addEventListener('change', (e) => {
        if (e.target.classList.contains('map-select') || e.target.id === 'select-sheet') {
            if (e.target.id === 'select-sheet') {
                // Change sheet data
                const selectedSheet = e.target.value;
                const sheet = excelDataRaw.workbook.Sheets[selectedSheet];
                excelDataRaw.rows = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ''});
                populateMappingSelects();
            }
            updateMappingPreviewTable();
        }
    });
    
    // --- SCREEN 3: DASHBOARD ---
    document.getElementById('btn-clear-data').addEventListener('click', () => {
        showConfirmModal("Xác nhận xóa dữ liệu", "Bạn có chắc chắn muốn xóa toàn bộ câu hỏi hiện tại và lịch sử học tập? Hành động này không thể hoàn tác.", () => {
            clearAllData();
        });
    });
    
    document.getElementById('btn-start-study').addEventListener('click', () => {
        startStudyMode();
    });
    
    document.getElementById('btn-start-exam').addEventListener('click', () => {
        startExamMode();
    });
    
    // --- SCREEN 4: STUDY PLAYING ---
    document.getElementById('btn-study-back').addEventListener('click', () => {
        showScreen('screen-dashboard');
        renderDashboard();
    });
    
    document.getElementById('btn-study-prev').addEventListener('click', () => navigateStudyQuestion(-1));
    document.getElementById('btn-study-next').addEventListener('click', () => navigateStudyQuestion(1));
    document.getElementById('btn-study-show-answer').addEventListener('click', () => revealStudyAnswer());
    document.getElementById('btn-study-confirm-answer').addEventListener('click', () => {
        handleMultipleStudyAnswers();
    });
    
    document.getElementById('btn-study-star').addEventListener('click', () => {
        toggleStarQuestion(studyState.filteredIndices[studyState.currentIndex]);
        updateStudyStarButton();
    });
    
    // Drawer toggle
    const btnStudyDrawer = document.getElementById('btn-study-drawer-toggle');
    const studyDrawer = document.getElementById('study-grid-drawer');
    btnStudyDrawer.addEventListener('click', () => {
        studyDrawer.classList.toggle('open');
        const icon = btnStudyDrawer.querySelector('i');
        if (studyDrawer.classList.contains('open')) {
            icon.className = 'fa-solid fa-chevron-down';
        } else {
            icon.className = 'fa-solid fa-chevron-up';
        }
    });
    
    // Keyboard navigation shortcuts
    document.addEventListener('keydown', handleGlobalKeydown);
    
    // --- SCREEN 5: EXAM PLAYING ---
    document.getElementById('btn-exam-prev').addEventListener('click', () => navigateExamQuestion(-1));
    document.getElementById('btn-exam-next').addEventListener('click', () => navigateExamQuestion(1));
    
    document.getElementById('btn-exam-star').addEventListener('click', () => {
        const rawQuestionId = examState.questions[examState.currentIndex].id - 1; // Since id is 1-indexed in raw array
        toggleStarQuestion(rawQuestionId);
        updateExamStarButton();
    });
    
    document.getElementById('btn-submit-exam').addEventListener('click', () => {
        promptSubmitExam();
    });
    
    // --- SCREEN 6: RESULTS SCREEN ---
    document.getElementById('btn-results-dashboard').addEventListener('click', () => {
        showScreen('screen-dashboard');
        renderDashboard();
    });
    
    document.getElementById('btn-results-review').addEventListener('click', () => {
        reviewState.backScreen = null; // back to results screen
        startReviewExamMode();
    });
    
    document.getElementById('btn-results-retake').addEventListener('click', () => {
        retakeExam();
    });
    
    // --- SCREEN 7: EXAM REVIEW SCREEN ---
    document.getElementById('btn-review-back').addEventListener('click', () => {
        if (reviewState.backScreen) {
            showScreen(reviewState.backScreen);
            if (reviewState.backScreen === 'screen-history') {
                renderFullHistoryScreen();
            } else {
                renderDashboard();
            }
        } else {
            showScreen('screen-results');
        }
    });
    document.getElementById('btn-review-prev').addEventListener('click', () => navigateReviewQuestion(-1));
    document.getElementById('btn-review-next').addEventListener('click', () => navigateReviewQuestion(1));
    
    document.getElementById('review-question-filter').addEventListener('change', (e) => {
        reviewState.filter = e.target.value;
        renderReviewQuestionGrid();
        // Reset review index to first matching question
        const validIndices = getValidReviewIndices();
        if (validIndices.length > 0) {
            reviewState.currentIndex = 0;
            loadReviewQuestion(validIndices[0]);
        } else {
            // No question matching filter
            document.getElementById('review-question-text').innerHTML = `<div class="text-center text-muted">Không có câu hỏi nào khớp với bộ lọc.</div>`;
            document.getElementById('review-options-list').innerHTML = '';
            document.getElementById('review-explanation-panel').classList.add('hidden');
        }
    });

    // --- SCREEN 8: FULL EXAM HISTORY SCREEN ---
    const btnViewAllHistory = document.getElementById('btn-view-all-history');
    if (btnViewAllHistory) {
        btnViewAllHistory.addEventListener('click', () => {
            showScreen('screen-history');
            renderFullHistoryScreen();
        });
    }

    const btnHistoryBack = document.getElementById('btn-history-back');
    if (btnHistoryBack) {
        btnHistoryBack.addEventListener('click', () => {
            showScreen('screen-dashboard');
            renderDashboard();
        });
    }

    const btnClearHistoryOnly = document.getElementById('btn-clear-history-only');
    if (btnClearHistoryOnly) {
        btnClearHistoryOnly.addEventListener('click', () => {
            showConfirmModal("Xác nhận xóa lịch sử", "Bạn có chắc chắn muốn xóa toàn bộ lịch sử thi thử? Tiến trình ôn tập câu hỏi vẫn sẽ được giữ lại.", () => {
                state.history = [];
                saveStateToLocalStorage();
                showScreen('screen-dashboard');
                renderDashboard();
            });
        });
    }

    // --- SCREEN 9: ALL QUESTIONS VIEWER SCREEN ---
    const cardTotalQuestions = document.getElementById('card-total-questions');
    if (cardTotalQuestions) {
        cardTotalQuestions.addEventListener('click', () => {
            if (state.questions.length === 0) {
                alert("Chưa có dữ liệu câu hỏi nào được tải lên!");
                return;
            }
            questionsScreenState.currentPage = 1;
            questionsScreenState.searchQuery = '';
            const searchInput = document.getElementById('questions-search-input');
            if (searchInput) searchInput.value = '';
            showScreen('screen-all-questions');
            renderQuestionsScreen();
        });
    }

    const btnAllQuestionsBack = document.getElementById('btn-all-questions-back');
    if (btnAllQuestionsBack) {
        btnAllQuestionsBack.addEventListener('click', () => {
            showScreen('screen-dashboard');
            renderDashboard();
        });
    }

    const questionsSearchInput = document.getElementById('questions-search-input');
    if (questionsSearchInput) {
        questionsSearchInput.addEventListener('input', (e) => {
            questionsScreenState.searchQuery = e.target.value;
            questionsScreenState.currentPage = 1;
            renderQuestionsScreen();
        });
    }

    const btnQuestionsPrev = document.getElementById('btn-questions-prev-page');
    if (btnQuestionsPrev) {
        btnQuestionsPrev.addEventListener('click', () => {
            if (questionsScreenState.currentPage > 1) {
                questionsScreenState.currentPage--;
                renderQuestionsScreen();
            }
        });
    }

    const btnQuestionsNext = document.getElementById('btn-questions-next-page');
    if (btnQuestionsNext) {
        btnQuestionsNext.addEventListener('click', () => {
            const filtered = getFilteredQuestions();
            const totalPages = Math.ceil(filtered.length / questionsScreenState.pageSize);
            if (questionsScreenState.currentPage < totalPages) {
                questionsScreenState.currentPage++;
                renderQuestionsScreen();
            }
        });
    }

    // Toggle Range inputs display
    const studyToggleRange = document.getElementById('study-toggle-range');
    const studyRangeInputs = document.getElementById('study-range-inputs');
    if (studyToggleRange && studyRangeInputs) {
        studyToggleRange.addEventListener('change', () => {
            studyRangeInputs.style.display = studyToggleRange.checked ? 'flex' : 'none';
        });
    }

    const examToggleRange = document.getElementById('exam-toggle-range');
    const examRangeInputs = document.getElementById('exam-range-inputs');
    if (examToggleRange && examRangeInputs) {
        examToggleRange.addEventListener('change', () => {
            examRangeInputs.style.display = examToggleRange.checked ? 'flex' : 'none';
        });
    }
}

// ==========================================================================
// EXCEL FILE PARSING
// ==========================================================================
function handleFileUpload(file) {
    state.currentFile = file.name;
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            
            if (workbook.SheetNames.length === 0) {
                alert("File Excel trống hoặc không hợp lệ!");
                return;
            }
            
            // Default select the first sheet
            const firstSheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ''});
            
            if (rows.length < 2) {
                alert("File Excel cần chứa ít nhất một dòng tiêu đề và một dòng dữ liệu!");
                return;
            }
            
            // Store workbook raw data in global variable to parse in Mapping Screen
            excelDataRaw = {
                filename: file.name,
                workbook: workbook,
                activeSheet: firstSheetName,
                rows: rows
            };
            
            // Prepare Mapping Wizard
            setupMappingWizardScreen();
            showScreen('screen-mapping');
            
        } catch (err) {
            console.error(err);
            alert("Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file!");
        }
    };
    
    reader.readAsArrayBuffer(file);
}

function downloadExcelTemplate() {
    // Define headers and some sample rows
    const data = [
        ["Nội dung câu hỏi", "Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D", "Đáp án đúng", "Giải thích chi tiết"],
        ["Đâu là thủ đô của Việt Nam?", "Hồ Chí Minh", "Đà Nẵng", "Hà Nội", "Hải Phòng", "C", "Hà Nội là thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam."],
        ["Số lượng hành tinh trong Hệ Mặt Trời là bao nhiêu?", "7", "8", "9", "10", "B", "Hệ Mặt Trời hiện tại được công nhận có 8 hành tinh quay quanh Mặt Trời."],
        ["CPU viết tắt của cụm từ nào trong tiếng Anh?", "Central Processing Unit", "Computer Processing Unit", "Control Process Unit", "Core Processing Unit", "A", "CPU viết tắt của Central Processing Unit - Bộ xử lý trung tâm."]
    ];

    try {
        // Create a worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        
        // Create a new workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Câu hỏi");
        
        // Write and trigger download
        XLSX.writeFile(workbook, "mau_cau_hoi_trac_nghiem.xlsx");
    } catch (err) {
        console.error("Lỗi khi tạo và tải file mẫu:", err);
        alert("Có lỗi xảy ra khi tạo file mẫu Excel!");
    }
}

// ==========================================================================
// COLUMN MAPPING WIZARD LOGIC
// ==========================================================================
function setupMappingWizardScreen() {
    const sheetSelectWrapper = document.getElementById('sheet-select-wrapper');
    const selectSheet = document.getElementById('select-sheet');
    
    // Handle multiple sheets
    if (excelDataRaw.workbook.SheetNames.length > 1) {
        sheetSelectWrapper.style.display = 'block';
        selectSheet.innerHTML = '';
        excelDataRaw.workbook.SheetNames.forEach(sheetName => {
            const opt = document.createElement('option');
            opt.value = sheetName;
            opt.textContent = sheetName;
            selectSheet.appendChild(opt);
        });
        selectSheet.value = excelDataRaw.activeSheet;
    } else {
        sheetSelectWrapper.style.display = 'none';
    }
    
    populateMappingSelects();
    updateMappingPreviewTable();
}

function populateMappingSelects() {
    const headers = excelDataRaw.rows[0];
    const selects = document.querySelectorAll('.map-select');
    
    // Clear dynamic options list first
    const optionsList = document.getElementById('options-mapping-list');
    optionsList.innerHTML = '';
    
    // Create options mapping. Let's auto-detect columns mapping
    let questionCol = -1;
    let correctCol = -1;
    let explanationCol = -1;
    let optionCols = [];
    
    headers.forEach((header, idx) => {
        const text = String(header).trim().toLowerCase();
        if (text.includes('câu hỏi') || text.includes('question') || text.includes('nội dung')) {
            if (questionCol === -1) questionCol = idx;
        } else if (text.includes('đáp án đúng') || text.includes('dap an dung') || text.includes('chính xác') || text.includes('key') || text.includes('correct')) {
            if (correctCol === -1) correctCol = idx;
        } else if (text.includes('giải thích') || text.includes('giai thich') || text.includes('explanation') || text.includes('hướng dẫn')) {
            if (explanationCol === -1) explanationCol = idx;
        } else if (text.includes('đáp án a') || text.includes('dap an a') || text === 'a' || text === 'đáp án 1' || text === 'option a') {
            optionCols[0] = idx;
        } else if (text.includes('đáp án b') || text.includes('dap an b') || text === 'b' || text === 'đáp án 2' || text === 'option b') {
            optionCols[1] = idx;
        } else if (text.includes('đáp án c') || text.includes('dap an c') || text === 'c' || text === 'đáp án 3' || text === 'option c') {
            optionCols[2] = idx;
        } else if (text.includes('đáp án d') || text.includes('dap an d') || text === 'd' || text === 'đáp án 4' || text === 'option d') {
            optionCols[3] = idx;
        }
    });
    
    // Fallbacks if auto-detection failed
    if (questionCol === -1) questionCol = 0;
    if (optionCols.length === 0) {
        // Assume column 1, 2, 3, 4 are A, B, C, D
        for (let i = 1; i <= 4; i++) {
            if (headers.length > i) optionCols.push(i);
        }
    }
    if (correctCol === -1) {
        // Assume the next column after options
        const maxOptCol = Math.max(...optionCols, 0);
        correctCol = headers.length > maxOptCol + 1 ? maxOptCol + 1 : headers.length - 1;
    }
    
    // Set values to standard dropdown selects
    populateSingleSelect('map-question', headers, questionCol);
    populateSingleSelect('map-correct', headers, correctCol);
    populateSingleSelect('map-explanation', headers, explanationCol, true); // Allow empty
    
    // Add option selects
    const finalOptionCols = optionCols.filter(x => x !== undefined && x !== -1);
    if (finalOptionCols.length > 0) {
        finalOptionCols.forEach((colIdx, letterIdx) => {
            const letter = String.fromCharCode(65 + letterIdx); // A, B, C...
            createOptionMappingRow(letter, colIdx, headers);
        });
    } else {
        // Add 4 default empty option fields
        for (let i = 0; i < 4; i++) {
            createOptionMappingRow(String.fromCharCode(65 + i), -1, headers);
        }
    }
}

function populateSingleSelect(elementId, headers, selectedIdx, allowNone = false) {
    const select = document.getElementById(elementId);
    select.innerHTML = '';
    
    if (allowNone) {
        const opt = document.createElement('option');
        opt.value = '-1';
        opt.textContent = '-- Không sử dụng --';
        select.appendChild(opt);
    }
    
    headers.forEach((header, idx) => {
        const opt = document.createElement('option');
        opt.value = idx.toString();
        opt.textContent = `${header || `Cột ${idx + 1}`} (Cột ${idx + 1})`;
        select.appendChild(opt);
    });
    
    if (selectedIdx !== -1) {
        select.value = selectedIdx.toString();
    }
}

function createOptionMappingRow(label, selectedIdx, headers) {
    const optionsList = document.getElementById('options-mapping-list');
    const container = document.createElement('div');
    container.className = 'option-map-row';
    
    const tag = document.createElement('span');
    tag.className = 'option-map-tag';
    tag.textContent = label;
    
    const select = document.createElement('select');
    select.className = 'form-control map-select option-map-select';
    
    headers.forEach((header, idx) => {
        const opt = document.createElement('option');
        opt.value = idx.toString();
        opt.textContent = `${header || `Cột ${idx + 1}`} (Cột ${idx + 1})`;
        select.appendChild(opt);
    });
    
    if (selectedIdx !== -1) {
        select.value = selectedIdx.toString();
    } else {
        // select default if there are enough columns
        const childCount = optionsList.children.length;
        if (childCount < headers.length) {
            select.value = childCount.toString();
        }
    }
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove-map-option';
    removeBtn.innerHTML = '<i class="fa-solid fa-circle-minus"></i>';
    removeBtn.addEventListener('click', () => {
        container.remove();
        renameOptionTags();
        updateMappingPreviewTable();
    });
    
    container.appendChild(tag);
    container.appendChild(select);
    container.appendChild(removeBtn);
    optionsList.appendChild(container);
}

function addNewOptionMappingSelect() {
    const headers = excelDataRaw.rows[0];
    const optionsList = document.getElementById('options-mapping-list');
    const nextIdx = optionsList.children.length;
    const label = String.fromCharCode(65 + nextIdx);
    
    createOptionMappingRow(label, -1, headers);
    updateMappingPreviewTable();
}

function renameOptionTags() {
    const rows = document.querySelectorAll('.option-map-row');
    rows.forEach((row, idx) => {
        const tag = row.querySelector('.option-map-tag');
        tag.textContent = String.fromCharCode(65 + idx);
    });
}

function updateMappingPreviewTable() {
    const headers = excelDataRaw.rows[0];
    const rows = excelDataRaw.rows.slice(1, 4); // Preview first 3 data rows
    
    const tableHead = document.querySelector('#preview-table thead');
    const tableBody = document.querySelector('#preview-table tbody');
    
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    
    // Get currently mapped columns to highlight or only show them
    const qCol = parseInt(document.getElementById('map-question').value);
    const correctCol = parseInt(document.getElementById('map-correct').value);
    const explanationCol = parseInt(document.getElementById('map-explanation').value);
    
    const optionSelects = document.querySelectorAll('.option-map-select');
    const optCols = Array.from(optionSelects).map(select => parseInt(select.value));
    
    // Filter active columns to show
    const activeColumns = [qCol, ...optCols, correctCol, explanationCol].filter(col => col !== -1 && !isNaN(col));
    const uniqueActiveCols = [...new Set(activeColumns)].sort((a, b) => a - b);
    
    if (uniqueActiveCols.length === 0) return;
    
    // Build Header
    const trHead = document.createElement('tr');
    uniqueActiveCols.forEach(colIdx => {
        const th = document.createElement('th');
        let badgeType = '';
        let label = '';
        
        if (colIdx === qCol) { label = '🔍 Câu hỏi'; badgeType = 'badge-success'; }
        else if (colIdx === correctCol) { label = '✅ Đáp án đúng'; badgeType = 'badge-warning'; }
        else if (colIdx === explanationCol) { label = '💡 Giải thích'; badgeType = 'badge-danger'; }
        else if (optCols.includes(colIdx)) {
            const letterIdx = optCols.indexOf(colIdx);
            label = `Option ${String.fromCharCode(65 + letterIdx)}`;
            badgeType = 'badge-success';
        } else {
            label = headers[colIdx] || `Cột ${colIdx + 1}`;
        }
        
        th.innerHTML = `${headers[colIdx] || `Cột ${colIdx + 1}`} <br><span class="badge ${badgeType}">${label}</span>`;
        trHead.appendChild(th);
    });
    tableHead.appendChild(trHead);
    
    // Build Rows
    rows.forEach(row => {
        const tr = document.createElement('tr');
        uniqueActiveCols.forEach(colIdx => {
            const td = document.createElement('td');
            td.textContent = row[colIdx] !== undefined ? String(row[colIdx]) : '';
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

function ensureQuestionFields(q) {
    if (!q) return q;
    if (!q.correctIndices) {
        q.correctIndices = [q.correctIndex !== undefined ? q.correctIndex : 0];
    }
    if (q.isMultipleChoice === undefined) {
        q.isMultipleChoice = q.correctIndices.length > 1;
    }
    if (!q.correctKey) {
        q.correctKey = q.correctIndices.map(idx => String.fromCharCode(65 + idx)).join(', ');
    }
    return q;
}

function normalizeCorrectAnswers(val, options) {
    if (val === undefined || val === null) return [0];
    const rawStr = String(val).trim();
    if (rawStr === '') return [0];

    // Try exact match of option text first
    for (let i = 0; i < options.length; i++) {
        if (options[i].trim().toLowerCase() === rawStr.toLowerCase()) {
            return [i];
        }
    }

    // Split by common delimiters: comma, semicolon, ampersand, or words 'và' / 'and'
    let tokens = rawStr.split(/[,;&|/\\]+|và|and/i).map(t => t.trim()).filter(t => t !== '');
    
    // If only one token and it contains spaces, check if it's multiple letter options (e.g. "A B" or "A C")
    if (tokens.length === 1 && /\s+/.test(tokens[0])) {
        const spaceTokens = tokens[0].split(/\s+/).map(t => t.trim()).filter(t => t !== '');
        const areAllShort = spaceTokens.every(t => t.length === 1 || /^[A-Z0-9][\.\)\-\:]?$/i.test(t));
        if (areAllShort) {
            tokens = spaceTokens;
        }
    }

    const indices = [];
    tokens.forEach(tok => {
        const cleanTok = tok.toUpperCase();
        
        // 1. Single character A-Z
        if (cleanTok.length === 1) {
            const code = cleanTok.charCodeAt(0);
            if (code >= 65 && code <= 90) {
                const idx = code - 65;
                if (idx < options.length && !indices.includes(idx)) {
                    indices.push(idx);
                    return;
                }
            }
        }
        
        // 2. Format like "A.", "B)", "1.", "2."
        const regexMatch = cleanTok.match(/^([A-Z0-9])[\.\)\-\:\s]/);
        if (regexMatch) {
            const prefix = regexMatch[1];
            const code = prefix.charCodeAt(0);
            if (code >= 65 && code <= 90) {
                const idx = code - 65;
                if (idx < options.length && !indices.includes(idx)) {
                    indices.push(idx);
                    return;
                }
            } else {
                const numIdx = parseInt(prefix) - 1;
                if (numIdx >= 0 && numIdx < options.length && !indices.includes(numIdx)) {
                    indices.push(numIdx);
                    return;
                }
            }
        }
        
        // 3. Exact matching of option text (case-insensitive)
        for (let i = 0; i < options.length; i++) {
            if (options[i].trim().toLowerCase() === tok.toLowerCase()) {
                if (!indices.includes(i)) indices.push(i);
                return;
            }
        }
        
        // 4. Direct index number (1-based index)
        const intVal = parseInt(cleanTok);
        if (!isNaN(intVal) && intVal >= 1 && intVal <= options.length) {
            const idx = intVal - 1;
            if (!indices.includes(idx)) indices.push(idx);
            return;
        }
        
        // 5. Match starting substring of options
        for (let i = 0; i < options.length; i++) {
            if (options[i].toLowerCase().startsWith(tok.toLowerCase().substring(0, 10))) {
                if (!indices.includes(i)) indices.push(i);
                return;
            }
        }
    });

    if (indices.length === 0) {
        return [0];
    }
    
    return indices.sort((a, b) => a - b);
}

function isAnswerCorrect(userAns, q) {
    if (!q) return false;
    const correct = q.correctIndices || [q.correctIndex || 0];
    if (q.isMultipleChoice) {
        if (!Array.isArray(userAns)) return false;
        if (userAns.length !== correct.length) return false;
        return userAns.every(val => correct.includes(val));
    } else {
        // Single choice
        const singleUserAns = Array.isArray(userAns) ? userAns[0] : userAns;
        return singleUserAns === q.correctIndex;
    }
}

function normalizeCorrectAnswer(val, options) {
    if (val === undefined || val === null) return 0;
    const cleanVal = String(val).trim().toUpperCase();
    
    if (cleanVal === '') return 0;
    
    // Try A, B, C, D, E, F
    if (cleanVal.length === 1) {
        const code = cleanVal.charCodeAt(0);
        if (code >= 65 && code <= 90) { // A-Z
            const idx = code - 65;
            if (idx < options.length) return idx;
        }
    }
    
    // Try matching formats like "A.", "B)", "1.", "2."
    const regexMatch = cleanVal.match(/^([A-Z0-9])[\.\)\-\:\s]/);
    if (regexMatch) {
        const prefix = regexMatch[1];
        const code = prefix.charCodeAt(0);
        if (code >= 65 && code <= 90) {
            const idx = code - 65;
            if (idx < options.length) return idx;
        } else {
            // Is a number digit
            const numIdx = parseInt(prefix) - 1;
            if (numIdx >= 0 && numIdx < options.length) return numIdx;
        }
    }
    
    // Try matching exact text of options
    for (let i = 0; i < options.length; i++) {
        if (options[i].trim().toLowerCase() === String(val).trim().toLowerCase()) {
            return i;
        }
    }
    
    // Check if it's a direct index number (1-based index)
    const intVal = parseInt(cleanVal);
    if (!isNaN(intVal) && intVal >= 1 && intVal <= options.length) {
        return intVal - 1;
    }
    
    // Default fallback: match starting substring
    for (let i = 0; i < options.length; i++) {
        if (options[i].toLowerCase().startsWith(String(val).toLowerCase().substring(0, 10))) {
            return i;
        }
    }
    
    return 0; // fallback to A
}

function confirmAndImportQuestions() {
    const qCol = parseInt(document.getElementById('map-question').value);
    const correctCol = parseInt(document.getElementById('map-correct').value);
    const explanationCol = parseInt(document.getElementById('map-explanation').value);
    
    const optionSelects = document.querySelectorAll('.option-map-select');
    const optCols = Array.from(optionSelects).map(select => parseInt(select.value));
    
    // Validation
    if (qCol === -1 || isNaN(qCol)) { alert("Vui lòng chọn cột chứa câu hỏi!"); return; }
    if (correctCol === -1 || isNaN(correctCol)) { alert("Vui lòng chọn cột chứa đáp án đúng!"); return; }
    if (optCols.some(col => col === -1 || isNaN(col))) { alert("Vui lòng thiết lập các cột đáp án lựa chọn hợp lệ!"); return; }
    
    // Parse Questions
    const parsedQuestions = [];
    const rows = excelDataRaw.rows.slice(1); // skip header row
    
    let validId = 1;
    rows.forEach(row => {
        const questionText = String(row[qCol] || '').trim();
        if (questionText === '') return; // Skip empty question rows
        
        // Grab options
        const options = optCols.map(colIdx => String(row[colIdx] || '').trim()).filter(text => text !== '');
        if (options.length < 2) return; // Skip if options are too few
        
        const correctRaw = row[correctCol];
        const correctIndices = normalizeCorrectAnswers(correctRaw, options);
        const correctIndex = correctIndices[0];
        const correctKey = correctIndices.map(idx => String.fromCharCode(65 + idx)).join(', ');
        const isMultipleChoice = correctIndices.length > 1;
        
        const explanationText = explanationCol !== -1 ? String(row[explanationCol] || '').trim() : '';
        
        parsedQuestions.push({
            id: validId++,
            question: questionText,
            options: options,
            correctIndex: correctIndex,
            correctIndices: correctIndices,
            correctKey: correctKey,
            isMultipleChoice: isMultipleChoice,
            explanation: explanationText
        });
    });
    
    if (parsedQuestions.length === 0) {
        alert("Không tìm thấy câu hỏi hợp lệ nào dựa trên thiết lập ánh xạ!");
        return;
    }
    
    // Save to state
    state.questions = parsedQuestions;
    state.answeredStats = {}; // Reset stats for new file
    state.starred = [];
    state.columnMapping = {
        sheet: excelDataRaw.activeSheet,
        question: qCol,
        correct: correctCol,
        explanation: explanationCol,
        options: optCols,
        headers: excelDataRaw.rows[0] || []
    };
    
    saveStateToLocalStorage();
    updateUIHeaderStatus();
    
    alert(`Đã nhập thành công ${state.questions.length} câu hỏi vào hệ thống!`);
    showScreen('screen-dashboard');
    renderDashboard();
}

function loadSampleData() {
    state.questions = SAMPLE_QUESTIONS.map(ensureQuestionFields);
    state.starred = [];
    state.answeredStats = {};
    state.currentFile = "Dữ liệu mẫu QuizMaster.xlsx";
    state.columnMapping = null;
    
    saveStateToLocalStorage();
    updateUIHeaderStatus();
    
    alert("Đã tải dữ liệu ôn tập mẫu (15 câu hỏi).");
    showScreen('screen-dashboard');
    renderDashboard();
}

function clearAllData() {
    state.questions = [];
    state.starred = [];
    state.answeredStats = {};
    state.history = [];
    state.currentFile = null;
    state.columnMapping = null;
    
    localStorage.removeItem(STORAGE_KEY);
    updateUIHeaderStatus();
    
    showScreen('screen-upload');
}

// ==========================================================================
// INTERFACE DECORATORS & NAVIGATION HELPERS
// ==========================================================================
function showScreen(screenId) {
    const screens = document.querySelectorAll('.app-screen');
    screens.forEach(s => s.classList.remove('active'));
    
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
    
    // Close Drawer when shifting screens
    document.getElementById('study-grid-drawer').classList.remove('open');
    
    // Stop timers if leaving exam or study
    if (screenId !== 'screen-exam') {
        clearInterval(examState.timerInterval);
    }
    if (screenId !== 'screen-study') {
        stopStudyTimer();
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateUIHeaderStatus() {
    const fileInfo = document.getElementById('current-file-info');
    if (state.questions.length > 0) {
        fileInfo.innerHTML = `<i class="fa-solid fa-file-excel"></i> ${state.currentFile || 'Dữ liệu đã nạp'} (${state.questions.length} câu)`;
    } else {
        fileInfo.innerHTML = `<i class="fa-solid fa-file-excel"></i> Chưa có dữ liệu`;
    }
}

// ==========================================================================
// SCREEN 3: DASHBOARD RENDERER
// ==========================================================================
function renderDashboard() {
    const totalQ = state.questions.length;
    const answeredCount = Object.keys(state.answeredStats).length;
    
    let correctCount = 0;
    Object.values(state.answeredStats).forEach(status => {
        if (status === 'correct') correctCount++;
    });
    
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    const progressPercent = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;
    
    // Render Stat Cards
    document.getElementById('stat-total-questions').textContent = totalQ;
    document.getElementById('stat-completed-questions').textContent = `${answeredCount} / ${totalQ}`;
    document.getElementById('stat-completed-progress').style.width = `${progressPercent}%`;
    document.getElementById('stat-accuracy-rate').textContent = `${accuracy}%`;
    document.getElementById('stat-correct-details').textContent = `Đúng ${correctCount} / Làm ${answeredCount}`;
    document.getElementById('stat-starred-questions').textContent = state.starred.length;
    
    // Set limits inside selects based on question count
    adjustExamSelectOption(totalQ);

    // Set default limits for range selectors
    if (totalQ > 0) {
        document.getElementById('study-range-from').max = totalQ;
        document.getElementById('study-range-to').max = totalQ;
        document.getElementById('study-range-to').value = totalQ;
        
        document.getElementById('exam-range-from').max = totalQ;
        document.getElementById('exam-range-to').max = totalQ;
        document.getElementById('exam-range-to').value = totalQ;
    }
    
    // Render History List
    renderHistoryList();
}

function adjustExamSelectOption(totalQ) {
    const select = document.getElementById('exam-count');
    // Remove "all" or specific values if they are too big
    // Or we can rebuild standard options dynamically
    select.innerHTML = '';
    
    const options = [10, 20, 30, 40, 50, 100, 150, 180, 200];
    options.forEach(opt => {
        if (totalQ >= opt) {
            const el = document.createElement('option');
            el.value = opt.toString();
            el.textContent = `${opt} câu`;
            if (opt === 40) el.selected = true;
            select.appendChild(el);
        }
    });
    
    // Add "All" option
    const allEl = document.createElement('option');
    allEl.value = 'all';
    allEl.textContent = `Tất cả (${totalQ} câu)`;
    if (totalQ < 40) allEl.selected = true;
    select.appendChild(allEl);
}

function renderHistoryList() {
    const wrapper = document.getElementById('history-list-wrapper');
    const btnViewAll = document.getElementById('btn-view-all-history');
    
    if (state.history.length === 0) {
        wrapper.innerHTML = `<div class="empty-history">Chưa có bài thi thử nào được thực hiện. Hãy bắt đầu bài thi thử đầu tiên!</div>`;
        if (btnViewAll) btnViewAll.style.display = 'none';
        return;
    }
    
    if (btnViewAll) btnViewAll.style.display = 'inline-block';
    
    // Build Table
    let html = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Thời gian</th>
                    <th>Đề thi</th>
                    <th>Điểm số</th>
                    <th>Tỷ lệ</th>
                    <th>Thời gian làm</th>
                    <th>Kết quả</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Show top 5 history records, reversed chronologically
    const historyList = [...state.history].reverse().slice(0, 5);
    
    historyList.forEach(item => {
        const isPass = item.percentage >= 70;
        const passClass = isPass ? 'score-pass' : 'score-fail';
        const passText = isPass ? 'ĐẠT' : 'KHÔNG ĐẠT';
        
        const hasQuestions = !!item.questions;
        const actionHtml = hasQuestions 
            ? `<button class="btn btn-sm btn-outline-primary" onclick="reviewHistoricalExam(${item.id})"><i class="fa-solid fa-magnifying-glass"></i> Xem lại</button>` 
            : `<span class="text-muted" style="font-size: 0.85rem;">Không hỗ trợ</span>`;
            
        html += `
            <tr>
                <td>${item.date}</td>
                <td>${item.title}</td>
                <td><strong>${item.score} / ${item.total}</strong></td>
                <td>${item.percentage}%</td>
                <td>${item.timeSpent}</td>
                <td><span class="history-score-badge ${passClass}">${passText}</span></td>
                <td>${actionHtml}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    wrapper.innerHTML = html;
}

function renderFullHistoryScreen() {
    const summaryText = document.getElementById('history-summary-text');
    const table = document.getElementById('full-history-table');
    const tbody = document.getElementById('full-history-table-body');
    const emptyDiv = document.getElementById('empty-history-full');
    const tableWrapper = document.getElementById('full-history-table-wrapper');
    
    const totalExams = state.history.length;
    if (totalExams === 0) {
        if (tableWrapper) tableWrapper.style.display = 'none';
        if (emptyDiv) emptyDiv.style.display = 'block';
        if (summaryText) summaryText.textContent = 'Tổng số bài thi: 0 | Tỷ lệ đỗ: 0%';
        return;
    }
    
    if (tableWrapper) tableWrapper.style.display = 'block';
    if (emptyDiv) emptyDiv.style.display = 'none';
    
    // Calculate statistics
    let passedCount = 0;
    state.history.forEach(item => {
        if (item.percentage >= 70) passedCount++;
    });
    const passRate = Math.round((passedCount / totalExams) * 100);
    if (summaryText) {
        summaryText.innerHTML = `Tổng số bài thi: <strong>${totalExams}</strong> | Đạt: <span class="text-success"><strong>${passedCount}</strong></span> | Không đạt: <span class="text-danger"><strong>${totalExams - passedCount}</strong></span> | Tỷ lệ đỗ: <strong>${passRate}%</strong>`;
    }
    
    // Render rows
    let html = '';
    // Render all, reversed chronologically
    const allHistory = [...state.history].reverse();
    allHistory.forEach(item => {
        const isPass = item.percentage >= 70;
        const passClass = isPass ? 'score-pass' : 'score-fail';
        const passText = isPass ? 'ĐẠT' : 'KHÔNG ĐẠT';
        
        const hasQuestions = !!item.questions;
        const actionHtml = hasQuestions 
            ? `<button class="btn btn-sm btn-outline-primary" onclick="reviewHistoricalExam(${item.id})"><i class="fa-solid fa-magnifying-glass"></i> Xem lại</button>` 
            : `<span class="text-muted" style="font-size: 0.85rem;">Không hỗ trợ</span>`;
            
        html += `
            <tr>
                <td>${item.date}</td>
                <td>${item.title}</td>
                <td><strong>${item.score} / ${item.total}</strong></td>
                <td>${item.percentage}%</td>
                <td>${item.timeSpent}</td>
                <td><span class="history-score-badge ${passClass}">${passText}</span></td>
                <td>${actionHtml}</td>
            </tr>
        `;
    });
    if (tbody) tbody.innerHTML = html;
}

// ==========================================================================
// SCREEN 4: STUDY MODE LOGIC
// ==========================================================================
function startStudyMode() {
    studyState.filter = document.getElementById('study-filter').value;
    studyState.order = document.getElementById('study-order').value;
    
    // Check range selection
    const useRange = document.getElementById('study-toggle-range').checked;
    let rangeFrom = 1;
    let rangeTo = state.questions.length;
    
    if (useRange) {
        rangeFrom = parseInt(document.getElementById('study-range-from').value) || 1;
        rangeTo = parseInt(document.getElementById('study-range-to').value) || state.questions.length;
        
        // Validation
        if (isNaN(rangeFrom) || isNaN(rangeTo) || rangeFrom < 1 || rangeTo > state.questions.length || rangeFrom > rangeTo) {
            alert(`Khoảng câu hỏi không hợp lệ! Vui lòng chọn trong khoảng từ 1 đến ${state.questions.length} và đảm bảo 'Từ câu' <= 'Đến câu'.`);
            return;
        }
    }
    
    // Apply filters
    let indices = [];
    state.questions.forEach((q, idx) => {
        let match = false;
        const lastResult = state.answeredStats[idx]; // 0-based
        
        if (studyState.filter === 'all') {
            match = true;
        } else if (studyState.filter === 'unanswered') {
            match = (lastResult === undefined);
        } else if (studyState.filter === 'incorrect') {
            match = (lastResult === 'incorrect');
        } else if (studyState.filter === 'starred') {
            match = state.starred.includes(idx);
        }
        
        // Check range limits
        if (match && useRange) {
            const questionNumber = idx + 1;
            if (questionNumber < rangeFrom || questionNumber > rangeTo) {
                match = false;
            }
        }
        
        if (match) {
            indices.push(idx);
        }
    });
    
    if (indices.length === 0) {
        let filterText = "chưa trả lời";
        if (studyState.filter === 'incorrect') filterText = "làm sai";
        if (studyState.filter === 'starred') filterText = "đã lưu";
        alert(`Không tìm thấy câu hỏi nào thỏa mãn bộ lọc: [${filterText}]`);
        return;
    }
    
    // Apply order
    if (studyState.order === 'random') {
        indices = shuffleArray(indices);
    }
    
    studyState.filteredIndices = indices;
    studyState.currentIndex = 0;
    studyState.stats.correct = 0;
    studyState.stats.incorrect = 0;
    
    // Read and configure study timer
    const timeVal = document.getElementById('study-time').value;
    if (timeVal === 'unlimited') {
        studyState.timeLimit = 'unlimited';
        studyState.timeRemaining = 0;
    } else {
        studyState.timeLimit = parseInt(timeVal);
        studyState.timeRemaining = studyState.timeLimit * 60;
    }
    
    showScreen('screen-study');
    loadStudyQuestion();
    renderStudyGridDrawer();
    startStudyTimer();
}

function startStudyTimer() {
    clearInterval(studyState.timerInterval);
    updateStudyTimerUI();
    
    studyState.timerInterval = setInterval(() => {
        if (studyState.timeLimit === 'unlimited') {
            studyState.timeRemaining++; // Counting up
        } else {
            studyState.timeRemaining--; // Counting down
            if (studyState.timeRemaining <= 0) {
                clearInterval(studyState.timerInterval);
                updateStudyTimerUI();
                handleStudyTimeUp();
                return;
            }
        }
        updateStudyTimerUI();
    }, 1000);
}

function updateStudyTimerUI() {
    const timerDisplay = document.getElementById('study-timer');
    const timerBadge = document.getElementById('study-timer-badge');
    if (!timerDisplay) return;
    
    let hours, minutes, seconds;
    if (studyState.timeLimit === 'unlimited') {
        hours = Math.floor(studyState.timeRemaining / 3600);
        minutes = Math.floor((studyState.timeRemaining % 3600) / 60);
        seconds = studyState.timeRemaining % 60;
        
        if (hours > 0) {
            timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        if (timerBadge) {
            timerBadge.classList.remove('timer-warning');
        }
    } else {
        minutes = Math.floor(studyState.timeRemaining / 60);
        seconds = studyState.timeRemaining % 60;
        
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        if (timerBadge) {
            if (studyState.timeRemaining < 300) {
                timerBadge.classList.add('timer-warning');
            } else {
                timerBadge.classList.remove('timer-warning');
            }
        }
    }
}

function stopStudyTimer() {
    clearInterval(studyState.timerInterval);
    studyState.timerInterval = null;
}

function handleStudyTimeUp() {
    const correctCount = studyState.stats.correct || 0;
    const incorrectCount = studyState.stats.incorrect || 0;
    const totalAttempted = correctCount + incorrectCount;
    
    alert(`Hết giờ ôn tập!\n\nKết quả phiên học của bạn:\n- Số câu đã làm: ${totalAttempted}\n- Trả lời Đúng: ${correctCount}\n- Trả lời Sai: ${incorrectCount}`);
    
    showScreen('screen-dashboard');
    renderDashboard();
}

function loadStudyQuestion() {
    const rawIdx = studyState.filteredIndices[studyState.currentIndex];
    const q = state.questions[rawIdx];
    
    // Update Question tag
    document.getElementById('study-q-tag').textContent = `Câu số ${q.id}`;
    document.getElementById('study-progress-text').textContent = `Câu ${studyState.currentIndex + 1} / ${studyState.filteredIndices.length}`;
    
    // Update Progress bar
    const percent = Math.round(((studyState.currentIndex + 1) / studyState.filteredIndices.length) * 100);
    document.getElementById('study-progress-bar-fill').style.width = `${percent}%`;
    
    // Update Star button
    updateStudyStarButton();
    
    // Set Question Text
    document.getElementById('study-question-text').textContent = q.question;
    
    // Generate Options
    const optionsContainer = document.getElementById('study-options-list');
    optionsContainer.innerHTML = '';
    
    studyState.selectedIndices = [];
    const confirmContainer = document.getElementById('study-confirm-container');
    if (confirmContainer) {
        confirmContainer.style.display = q.isMultipleChoice ? 'block' : 'none';
    }
    
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        
        const letter = String.fromCharCode(65 + idx);
        btn.innerHTML = `
            <span class="option-prefix">${letter}</span>
            <span class="option-text">${opt}</span>
        `;
        
        if (q.isMultipleChoice) {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                if (studyState.selectedIndices.includes(idx)) {
                    studyState.selectedIndices = studyState.selectedIndices.filter(i => i !== idx);
                    btn.classList.remove('selected');
                } else {
                    studyState.selectedIndices.push(idx);
                    btn.classList.add('selected');
                }
            });
        } else {
            btn.addEventListener('click', () => handleStudyAnswer(idx));
        }
        optionsContainer.appendChild(btn);
    });
    
    // Hide explanation panel initially
    const explanationPanel = document.getElementById('study-explanation-panel');
    explanationPanel.classList.add('hidden');
    
    // Highlight cells in grid drawer
    updateStudyGridActiveCell();
}

function updateStudyStarButton() {
    const rawIdx = studyState.filteredIndices[studyState.currentIndex];
    const btn = document.getElementById('btn-study-star');
    const isStarred = state.starred.includes(rawIdx);
    
    if (isStarred) {
        btn.className = 'btn btn-icon-only btn-warning';
        btn.innerHTML = '<i class="fa-solid fa-star"></i>';
    } else {
        btn.className = 'btn btn-icon-only btn-outline-warning';
        btn.innerHTML = '<i class="fa-regular fa-star"></i>';
    }
}

function handleStudyAnswer(selectedOptionIndex) {
    const rawIdx = studyState.filteredIndices[studyState.currentIndex];
    const q = state.questions[rawIdx];
    const optionButtons = document.querySelectorAll('#study-options-list .option-btn');
    
    // Disable all options to prevent double answer click
    optionButtons.forEach(btn => btn.disabled = true);
    
    const isCorrect = (selectedOptionIndex === q.correctIndex);
    
    // Update Stats
    if (isCorrect) {
        state.answeredStats[rawIdx] = 'correct';
        studyState.stats.correct++;
    } else {
        state.answeredStats[rawIdx] = 'incorrect';
        studyState.stats.incorrect++;
    }
    
    saveStateToLocalStorage();
    
    // Update Header Score stats in Study mode
    document.getElementById('study-score-indicator').textContent = `Đúng: ${studyState.stats.correct} | Sai: ${studyState.stats.incorrect}`;
    
    // Apply styling
    optionButtons.forEach((btn, idx) => {
        if (idx === q.correctIndex) {
            btn.classList.add('correct');
        } else if (idx === selectedOptionIndex) {
            btn.classList.add('incorrect');
        }
    });
    
    // Show Explanation
    const explanationPanel = document.getElementById('study-explanation-panel');
    const statusHeader = document.getElementById('study-explanation-status');
    const statusMsg = statusHeader.querySelector('.status-msg');
    const statusIcon = statusHeader.querySelector('i');
    
    explanationPanel.classList.remove('hidden');
    
    if (isCorrect) {
        statusHeader.className = 'explanation-status correct';
        statusMsg.textContent = 'CHÍNH XÁC!';
        statusIcon.className = 'fa-solid fa-circle-check';
    } else {
        statusHeader.className = 'explanation-status incorrect';
        statusMsg.textContent = `SAI RỒI! (Đáp án đúng là ${q.correctKey})`;
        statusIcon.className = 'fa-solid fa-circle-xmark';
    }
    
    const explanationText = document.getElementById('study-explanation-text');
    explanationText.textContent = q.explanation || `Đáp án đúng là ${q.correctKey}.`;
    
    // Update drawer grid cell
    const cell = document.getElementById(`study-cell-${studyState.currentIndex}`);
    if (cell) {
        cell.className = `grid-cell ${isCorrect ? 'correct' : 'incorrect'}`;
    }
    
    // Auto next logic
    const isAutoNext = document.getElementById('toggle-auto-next').checked;
    if (isCorrect && isAutoNext) {
        setTimeout(() => {
            if (currentScreen === 'screen-study' && studyState.currentIndex < studyState.filteredIndices.length - 1) {
                navigateStudyQuestion(1);
            }
        }, 1200);
    }
}

function handleMultipleStudyAnswers() {
    const rawIdx = studyState.filteredIndices[studyState.currentIndex];
    const q = state.questions[rawIdx];
    const optionButtons = document.querySelectorAll('#study-options-list .option-btn');
    
    if (studyState.selectedIndices.length === 0) {
        alert("Vui lòng chọn ít nhất một đáp án trước khi xác nhận!");
        return;
    }
    
    optionButtons.forEach(btn => btn.disabled = true);
    
    const confirmContainer = document.getElementById('study-confirm-container');
    if (confirmContainer) confirmContainer.style.display = 'none';
    
    const correctIndices = q.correctIndices || [q.correctIndex || 0];
    const isCorrect = (studyState.selectedIndices.length === correctIndices.length) &&
                      studyState.selectedIndices.every(idx => correctIndices.includes(idx));
                      
    if (isCorrect) {
        state.answeredStats[rawIdx] = 'correct';
        studyState.stats.correct++;
    } else {
        state.answeredStats[rawIdx] = 'incorrect';
        studyState.stats.incorrect++;
    }
    
    saveStateToLocalStorage();
    
    document.getElementById('study-score-indicator').textContent = `Đúng: ${studyState.stats.correct} | Sai: ${studyState.stats.incorrect}`;
    
    optionButtons.forEach((btn, idx) => {
        const isOptCorrect = correctIndices.includes(idx);
        const isOptSelected = studyState.selectedIndices.includes(idx);
        if (isOptCorrect) {
            btn.classList.add('correct');
        } else if (isOptSelected) {
            btn.classList.add('incorrect');
        }
    });
    
    const explanationPanel = document.getElementById('study-explanation-panel');
    const statusHeader = document.getElementById('study-explanation-status');
    const statusMsg = statusHeader.querySelector('.status-msg');
    const statusIcon = statusHeader.querySelector('i');
    
    explanationPanel.classList.remove('hidden');
    
    if (isCorrect) {
        statusHeader.className = 'explanation-status correct';
        statusMsg.textContent = 'CHÍNH XÁC!';
        statusIcon.className = 'fa-solid fa-circle-check';
    } else {
        statusHeader.className = 'explanation-status incorrect';
        statusMsg.textContent = `SAI RỒI! (Đáp án đúng là ${q.correctKey})`;
        statusIcon.className = 'fa-solid fa-circle-xmark';
    }
    
    const explanationText = document.getElementById('study-explanation-text');
    explanationText.textContent = q.explanation || `Đáp án đúng là ${q.correctKey}.`;
    
    const cell = document.getElementById(`study-cell-${studyState.currentIndex}`);
    if (cell) {
        cell.className = `grid-cell ${isCorrect ? 'correct' : 'incorrect'}`;
    }
    
    const isAutoNext = document.getElementById('toggle-auto-next').checked;
    if (isCorrect && isAutoNext) {
        setTimeout(() => {
            if (currentScreen === 'screen-study' && studyState.currentIndex < studyState.filteredIndices.length - 1) {
                navigateStudyQuestion(1);
            }
        }, 1200);
    }
}

function revealStudyAnswer() {
    const rawIdx = studyState.filteredIndices[studyState.currentIndex];
    const q = state.questions[rawIdx];
    const optionButtons = document.querySelectorAll('#study-options-list .option-btn');
    
    const correctIndices = q.correctIndices || [q.correctIndex || 0];
    optionButtons.forEach((btn, idx) => {
        btn.disabled = true;
        const isOptCorrect = q.isMultipleChoice ? correctIndices.includes(idx) : (idx === q.correctIndex);
        if (isOptCorrect) {
            btn.classList.add('correct');
        }
    });
    
    const confirmContainer = document.getElementById('study-confirm-container');
    if (confirmContainer) confirmContainer.style.display = 'none';
    
    const explanationPanel = document.getElementById('study-explanation-panel');
    const statusHeader = document.getElementById('study-explanation-status');
    statusHeader.className = 'explanation-status';
    statusHeader.querySelector('.status-msg').textContent = `Đáp án đúng: ${q.correctKey}`;
    statusHeader.querySelector('i').className = 'fa-solid fa-eye';
    
    const explanationText = document.getElementById('study-explanation-text');
    explanationText.textContent = q.explanation || "Không có giải thích chi tiết.";
    explanationPanel.classList.remove('hidden');
}

function navigateStudyQuestion(direction) {
    const targetIdx = studyState.currentIndex + direction;
    if (targetIdx >= 0 && targetIdx < studyState.filteredIndices.length) {
        studyState.currentIndex = targetIdx;
        loadStudyQuestion();
    }
}

function renderStudyGridDrawer() {
    const grid = document.getElementById('study-question-grid');
    grid.innerHTML = '';
    
    studyState.filteredIndices.forEach((rawIdx, idx) => {
        const cell = document.createElement('div');
        cell.id = `study-cell-${idx}`;
        cell.textContent = idx + 1;
        
        // Base color coding based on previous answered status
        const status = state.answeredStats[rawIdx];
        let statusClass = '';
        if (status === 'correct') statusClass = 'correct';
        else if (status === 'incorrect') statusClass = 'incorrect';
        
        cell.className = `grid-cell ${statusClass}`;
        
        cell.addEventListener('click', () => {
            studyState.currentIndex = idx;
            loadStudyQuestion();
            // Optional: close drawer on mobile after clicking
            if (window.innerWidth < 576) {
                document.getElementById('study-grid-drawer').classList.remove('open');
                document.querySelector('#btn-study-drawer-toggle i').className = 'fa-solid fa-chevron-up';
            }
        });
        
        grid.appendChild(cell);
    });
}

function updateStudyGridActiveCell() {
    const cells = document.querySelectorAll('#study-question-grid .grid-cell');
    cells.forEach(cell => cell.classList.remove('active'));
    
    const activeCell = document.getElementById(`study-cell-${studyState.currentIndex}`);
    if (activeCell) {
        activeCell.classList.add('active');
        activeCell.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function toggleStarQuestion(rawIndex) {
    const starIdx = state.starred.indexOf(rawIndex);
    if (starIdx > -1) {
        state.starred.splice(starIdx, 1);
    } else {
        state.starred.push(rawIndex);
    }
    saveStateToLocalStorage();
}

// ==========================================================================
// SCREEN 5: EXAM MODE LOGIC
// ==========================================================================
function startExamMode() {
    const countSelect = document.getElementById('exam-count').value;
    const timeSelect = parseInt(document.getElementById('exam-time').value);
    const scopeSelect = document.getElementById('exam-scope').value;
    const orderSelect = document.getElementById('exam-order').value; // 'random' or 'sequential'
    
    // Check range selection
    const useRange = document.getElementById('exam-toggle-range').checked;
    let rangeFrom = 1;
    let rangeTo = state.questions.length;
    
    if (useRange) {
        rangeFrom = parseInt(document.getElementById('exam-range-from').value) || 1;
        rangeTo = parseInt(document.getElementById('exam-range-to').value) || state.questions.length;
        
        // Validation
        if (isNaN(rangeFrom) || isNaN(rangeTo) || rangeFrom < 1 || rangeTo > state.questions.length || rangeFrom > rangeTo) {
            alert(`Khoảng câu hỏi không hợp lệ! Vui lòng chọn trong khoảng từ 1 đến ${state.questions.length} và đảm bảo 'Từ câu' <= 'Đến câu'.`);
            return;
        }
    }
    
    let poolIndices = [];
    state.questions.forEach((q, idx) => {
        const questionNumber = idx + 1;
        
        // 1. Check range limits
        if (useRange && (questionNumber < rangeFrom || questionNumber > rangeTo)) {
            return;
        }
        
        // 2. Check scope filter (strict filtering)
        const lastResult = state.answeredStats[idx];
        let match = false;
        
        if (scopeSelect === 'all') {
            match = true;
        } else if (scopeSelect === 'unanswered') {
            match = (lastResult === undefined);
        } else if (scopeSelect === 'incorrect') {
            match = (lastResult === 'incorrect');
        } else if (scopeSelect === 'starred') {
            match = state.starred.includes(idx);
        }
        
        if (match) {
            poolIndices.push(idx);
        }
    });
    
    if (poolIndices.length === 0) {
        alert("Không tìm thấy câu hỏi nào thỏa mãn cấu hình phạm vi và khoảng câu hỏi đã chọn!");
        return;
    }
    
    // Determine exam size
    let examSize = countSelect === 'all' ? poolIndices.length : parseInt(countSelect);
    examSize = Math.min(examSize, poolIndices.length);
    
    let examIndices;
    if (orderSelect === 'sequential') {
        // Keep original file order, take the first N from pool
        examIndices = poolIndices.slice(0, examSize);
    } else {
        // Shuffle pool to get random subset, then shuffle again for display order
        poolIndices = shuffleArray(poolIndices);
        examIndices = poolIndices.slice(0, examSize);
        examIndices = shuffleArray(examIndices);
    }
    
    // Map to actual question data objects (copies)
    examState.questions = examIndices.map(idx => ({...state.questions[idx]}));
    examState.answers = {};
    examState.currentIndex = 0;
    examState.timeLimit = timeSelect;
    examState.timeRemaining = timeSelect * 60;
    examState.totalSeconds = timeSelect * 60;
    
    showScreen('screen-exam');
    loadExamQuestion();
    renderExamGrid();
    startExamTimer();
}

function startExamTimer() {
    clearInterval(examState.timerInterval);
    updateExamTimerUI();
    
    examState.timerInterval = setInterval(() => {
        examState.timeRemaining--;
        updateExamTimerUI();
        
        if (examState.timeRemaining <= 0) {
            clearInterval(examState.timerInterval);
            alert("Hết giờ làm bài! Hệ thống tự động nộp bài.");
            submitExam();
        }
    }, 1000);
}

function updateExamTimerUI() {
    const timerDisplay = document.getElementById('exam-timer');
    const fill = document.getElementById('timer-progress-fill');
    
    const minutes = Math.floor(examState.timeRemaining / 60);
    const seconds = examState.timeRemaining % 60;
    
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Width fill percentage
    const fillPercent = (examState.timeRemaining / examState.totalSeconds) * 100;
    fill.style.width = `${fillPercent}%`;
    
    // Danger status when remaining time < 5 minutes
    if (examState.timeRemaining < 300) {
        timerDisplay.classList.add('timer-warning');
    } else {
        timerDisplay.classList.remove('timer-warning');
    }
}

function loadExamQuestion() {
    const q = examState.questions[examState.currentIndex];
    
    // Tag count
    document.getElementById('exam-q-tag').textContent = `Câu số ${examState.currentIndex + 1} / ${examState.questions.length}`;
    
    // Star indicator
    updateExamStarButton();
    
    // Question text
    document.getElementById('exam-question-text').textContent = q.question;
    
    // Options
    const container = document.getElementById('exam-options-list');
    container.innerHTML = '';
    
    const selectedOpt = examState.answers[examState.currentIndex];
    
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        const isSelected = Array.isArray(selectedOpt) ? selectedOpt.includes(idx) : (selectedOpt === idx);
        btn.className = `option-btn ${isSelected ? 'selected' : ''}`;
        
        const letter = String.fromCharCode(65 + idx);
        btn.innerHTML = `
            <span class="option-prefix">${letter}</span>
            <span class="option-text">${opt}</span>
        `;
        
        btn.addEventListener('click', () => selectExamOption(idx));
        container.appendChild(btn);
    });
    
    // Progress Dots (Show subset dots around current index to avoid flooding if exam is 100 Qs)
    renderProgressDots();
    
    // Highlight sidebar active cell
    updateExamSidebarActiveCell();
}

function updateExamStarButton() {
    const q = examState.questions[examState.currentIndex];
    const rawIdx = q.id - 1;
    const btn = document.getElementById('btn-exam-star');
    const isStarred = state.starred.includes(rawIdx);
    
    if (isStarred) {
        btn.className = 'btn btn-icon-only btn-warning';
        btn.innerHTML = '<i class="fa-solid fa-star"></i>';
    } else {
        btn.className = 'btn btn-icon-only btn-outline-warning';
        btn.innerHTML = '<i class="fa-regular fa-star"></i>';
    }
}

function renderProgressDots() {
    const wrapper = document.getElementById('exam-progress-dots');
    wrapper.innerHTML = '';
    
    const total = examState.questions.length;
    const current = examState.currentIndex;
    
    // Display maximum of 10 dots centered around current index
    let start = Math.max(0, current - 5);
    let end = Math.min(total, start + 10);
    if (end === total) {
        start = Math.max(0, end - 10);
    }
    
    for (let i = start; i < end; i++) {
        const dot = document.createElement('span');
        dot.className = `progress-dot ${i === current ? 'active' : ''}`;
        wrapper.appendChild(dot);
    }
}

function selectExamOption(optionIdx) {
    const q = examState.questions[examState.currentIndex];
    if (q.isMultipleChoice) {
        let currentAns = examState.answers[examState.currentIndex];
        if (!Array.isArray(currentAns)) {
            currentAns = [];
        }
        if (currentAns.includes(optionIdx)) {
            currentAns = currentAns.filter(idx => idx !== optionIdx);
        } else {
            currentAns.push(optionIdx);
        }
        
        if (currentAns.length === 0) {
            delete examState.answers[examState.currentIndex];
        } else {
            examState.answers[examState.currentIndex] = currentAns;
        }
    } else {
        examState.answers[examState.currentIndex] = optionIdx;
    }
    
    // Update UI selected styling
    const btns = document.querySelectorAll('#exam-options-list .option-btn');
    const selectedAns = examState.answers[examState.currentIndex];
    btns.forEach((btn, idx) => {
        const isSelected = Array.isArray(selectedAns) ? selectedAns.includes(idx) : (idx === selectedAns);
        if (isSelected) btn.classList.add('selected');
        else btn.classList.remove('selected');
    });
    
    // Update sidebar grid and counters
    const cell = document.getElementById(`exam-cell-${examState.currentIndex}`);
    if (cell) {
        const hasSelection = examState.answers[examState.currentIndex] !== undefined;
        if (hasSelection) cell.classList.add('answered');
        else cell.classList.remove('answered');
    }
    
    const answeredCount = Object.keys(examState.answers).length;
    document.getElementById('exam-answered-counter').textContent = `Đã chọn: ${answeredCount} / ${examState.questions.length}`;
}

function navigateExamQuestion(direction) {
    const target = examState.currentIndex + direction;
    if (target >= 0 && target < examState.questions.length) {
        examState.currentIndex = target;
        loadExamQuestion();
    }
}

function renderExamGrid() {
    const grid = document.getElementById('exam-question-grid');
    grid.innerHTML = '';
    
    examState.questions.forEach((q, idx) => {
        const cell = document.createElement('div');
        cell.id = `exam-cell-${idx}`;
        cell.className = 'grid-cell';
        cell.textContent = idx + 1;
        
        cell.addEventListener('click', () => {
            examState.currentIndex = idx;
            loadExamQuestion();
        });
        
        grid.appendChild(cell);
    });
    
    const answeredCount = Object.keys(examState.answers).length;
    document.getElementById('exam-answered-counter').textContent = `Đã chọn: ${answeredCount} / ${examState.questions.length}`;
}

function updateExamSidebarActiveCell() {
    const cells = document.querySelectorAll('#exam-question-grid .grid-cell');
    cells.forEach(cell => cell.classList.remove('active'));
    
    const active = document.getElementById(`exam-cell-${examState.currentIndex}`);
    if (active) {
        active.classList.add('active');
        active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function promptSubmitExam() {
    const total = examState.questions.length;
    const answered = Object.keys(examState.answers).length;
    const unanswered = total - answered;
    
    let msg = `Bạn chắc chắn muốn nộp bài thi ngay bây giờ?`;
    if (unanswered > 0) {
        msg = `Chú ý: Bạn còn **${unanswered} câu hỏi chưa trả lời** trên tổng số ${total} câu. Bạn có chắc chắn vẫn muốn nộp bài thi?`;
    }
    
    showConfirmModal("Xác nhận nộp bài", msg, () => {
        submitExam();
    });
}

// ==========================================================================
// SCREEN 6: RESULTS & GRADING ENGINE
// ==========================================================================
function submitExam() {
    clearInterval(examState.timerInterval);
    
    // Calculation
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    
    examState.questions.forEach((q, idx) => {
        const userAns = examState.answers[idx];
        const rawQuestionIndex = q.id - 1; // map back to absolute state
        
        const isSkipped = (userAns === undefined) || (q.isMultipleChoice && Array.isArray(userAns) && userAns.length === 0);
        
        if (isSkipped) {
            skipped++;
        } else if (isAnswerCorrect(userAns, q)) {
            correct++;
            state.answeredStats[rawQuestionIndex] = 'correct'; // sync study state stats
        } else {
            incorrect++;
            state.answeredStats[rawQuestionIndex] = 'incorrect'; // sync study state stats
        }
    });
    
    const total = examState.questions.length;
    const percentage = Math.round((correct / total) * 100);
    
    // Calculate elapsed time
    const elapsedSeconds = examState.totalSeconds - examState.timeRemaining;
    const elapsedMins = Math.floor(elapsedSeconds / 60);
    const elapsedSecs = elapsedSeconds % 60;
    const timeSpentStr = `${elapsedMins}m ${elapsedSecs}s`;
    
    // Save to history
    const dateNow = new Date();
    const formattedDate = `${dateNow.getDate()}/${dateNow.getMonth()+1} ${dateNow.getHours()}:${String(dateNow.getMinutes()).padStart(2, '0')}`;
    
    const historyItem = {
        id: Date.now(),
        title: `Đề thi gồm ${total} câu`,
        score: correct,
        total: total,
        percentage: percentage,
        timeSpent: timeSpentStr,
        date: formattedDate,
        questions: examState.questions,
        answers: examState.answers
    };
    
    state.history.push(historyItem);
    
    // Limit history entries to the last 15 to avoid localStorage size issues
    if (state.history.length > 15) {
        state.history.shift();
    }
    
    saveStateToLocalStorage();
    
    // Render Results Screen
    showScreen('screen-results');
    
    // Score fraction
    document.getElementById('result-score-fraction').textContent = `${correct}/${total}`;
    document.getElementById('result-score-percent').textContent = `${percentage}%`;
    
    // Set circle dash offset
    // stroke-dasharray = 2 * Math.PI * r = 2 * 3.14 * 50 = 314
    const circle = document.getElementById('result-svg-circle');
    const offset = 314 - (314 * percentage) / 100;
    circle.style.strokeDashoffset = offset;
    
    // Verdict style
    const verdict = document.getElementById('result-verdict');
    const isPass = percentage >= 70;
    if (isPass) {
        verdict.textContent = "ĐÃ ĐẠT";
        verdict.className = "result-verdict pass";
        // Start Celebration Confetti!
        setTimeout(() => triggerConfettiAnimation(), 300);
    } else {
        verdict.textContent = "CHƯA ĐẠT";
        verdict.className = "result-verdict fail";
    }
    
    document.getElementById('result-time-spent').textContent = timeSpentStr;
    document.getElementById('result-correct-count').textContent = correct;
    document.getElementById('result-incorrect-count').textContent = incorrect;
    document.getElementById('result-skipped-count').textContent = skipped;
    
    // Keep exam details in review state
    reviewState.questions = examState.questions;
    reviewState.answers = examState.answers;
}

function retakeExam() {
    examState.answers = {};
    examState.currentIndex = 0;
    examState.timeRemaining = examState.timeLimit * 60;
    
    showScreen('screen-exam');
    loadExamQuestion();
    renderExamGrid();
    startExamTimer();
}

// ==========================================================================
// SCREEN 7: EXAM REVIEW MODE
// ==========================================================================
function startReviewExamMode() {
    reviewState.currentIndex = 0;
    reviewState.filter = 'all';
    document.getElementById('review-question-filter').value = 'all';
    
    showScreen('screen-review');
    renderReviewQuestionGrid();
    loadReviewQuestion(0);
}

function getValidReviewIndices() {
    const valid = [];
    reviewState.questions.forEach((q, idx) => {
        const userAns = reviewState.answers[idx];
        const isCorrect = isAnswerCorrect(userAns, q);
        const isSkipped = (userAns === undefined) || (q.isMultipleChoice && Array.isArray(userAns) && userAns.length === 0);
        
        let match = false;
        if (reviewState.filter === 'all') match = true;
        else if (reviewState.filter === 'correct') match = isCorrect && !isSkipped;
        else if (reviewState.filter === 'incorrect') match = !isCorrect && !isSkipped;
        else if (reviewState.filter === 'skipped') match = isSkipped;
        
        if (match) valid.push(idx);
    });
    return valid;
}

function loadReviewQuestion(examIdx) {
    // Find matching index inside the valid indices array
    const validIndices = getValidReviewIndices();
    const relativeIdx = validIndices.indexOf(examIdx);
    
    if (relativeIdx === -1) return; // shouldn't happen unless filter issues
    
    reviewState.currentIndex = relativeIdx;
    const q = reviewState.questions[examIdx];
    
    // Title
    document.getElementById('review-q-tag').textContent = `Câu hỏi ${examIdx + 1}`;
    
    // Status Badge inside question card
    const badge = document.getElementById('review-q-status-badge');
    const userAns = reviewState.answers[examIdx];
    const isCorrect = isAnswerCorrect(userAns, q);
    const isSkipped = (userAns === undefined) || (q.isMultipleChoice && Array.isArray(userAns) && userAns.length === 0);
    
    if (isSkipped) {
        badge.className = 'review-card-status-badge skipped';
        badge.innerHTML = '<i class="fa-solid fa-circle-minus"></i> Chưa trả lời';
    } else if (isCorrect) {
        badge.className = 'review-card-status-badge correct';
        badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Trả lời đúng';
    } else {
        badge.className = 'review-card-status-badge incorrect';
        badge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Trả lời sai';
    }
    
    // Text
    document.getElementById('review-question-text').textContent = q.question;
    
    // Render Options with color codings
    const container = document.getElementById('review-options-list');
    container.innerHTML = '';
    
    const correctIndices = q.correctIndices || [q.correctIndex || 0];
    
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.disabled = true; // disable clicks in review
        
        const letter = String.fromCharCode(65 + idx);
        btn.innerHTML = `
            <span class="option-prefix">${letter}</span>
            <span class="option-text">${opt}</span>
        `;
        
        // Highlight states
        const isOptCorrect = q.isMultipleChoice ? correctIndices.includes(idx) : (idx === q.correctIndex);
        const isOptSelected = Array.isArray(userAns) ? userAns.includes(idx) : (idx === userAns);
        
        if (isOptCorrect) {
            btn.classList.add('correct');
        } else if (isOptSelected) {
            btn.classList.add('incorrect');
        }
        
        container.appendChild(btn);
    });
    
    // Explanation
    document.getElementById('review-explanation-text').textContent = q.explanation || `Đáp án đúng là ${q.correctKey}.`;
    
    // Active styling on sidebar
    updateReviewSidebarActiveCell(examIdx);
}

function navigateReviewQuestion(direction) {
    const validIndices = getValidReviewIndices();
    if (validIndices.length === 0) return;
    
    let targetRelative = reviewState.currentIndex + direction;
    if (targetRelative < 0) targetRelative = 0;
    if (targetRelative >= validIndices.length) targetRelative = validIndices.length - 1;
    
    reviewState.currentIndex = targetRelative;
    loadReviewQuestion(validIndices[targetRelative]);
}

function renderReviewQuestionGrid() {
    const grid = document.getElementById('review-question-grid');
    grid.innerHTML = '';
    
    const validIndices = getValidReviewIndices();
    
    reviewState.questions.forEach((q, idx) => {
        // Skip rendering cell if it doesn't match filter
        if (!validIndices.includes(idx)) return;
        
        const cell = document.createElement('div');
        cell.id = `review-cell-${idx}`;
        cell.textContent = idx + 1;
        
        const userAns = reviewState.answers[idx];
        const isSkipped = (userAns === undefined) || (q.isMultipleChoice && Array.isArray(userAns) && userAns.length === 0);
        let statusClass = 'skipped';
        if (!isSkipped) {
            statusClass = isAnswerCorrect(userAns, q) ? 'correct' : 'incorrect';
        }
        
        cell.className = `grid-cell ${statusClass}`;
        
        cell.addEventListener('click', () => {
            loadReviewQuestion(idx);
        });
        
        grid.appendChild(cell);
    });
}

function updateReviewSidebarActiveCell(examIdx) {
    const cells = document.querySelectorAll('#review-question-grid .grid-cell');
    cells.forEach(cell => cell.classList.remove('active'));
    
    const active = document.getElementById(`review-cell-${examIdx}`);
    if (active) {
        active.classList.add('active');
        active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ==========================================================================
// KEYBOARD SHORTCUTS & MISC HELPERS
// ==========================================================================
function handleGlobalKeydown(e) {
    // 1. Keyboard Shortcuts in Study Mode
    if (currentScreen === 'screen-study') {
        const activeCard = document.getElementById('study-question-card');
        if (!activeCard) return;
        
        const isExplanationVisible = !document.getElementById('study-explanation-panel').classList.contains('hidden');
        
        // Navigation: Arrow Left/Right
        if (e.key === 'ArrowLeft') {
            navigateStudyQuestion(-1);
        } else if (e.key === 'ArrowRight') {
            navigateStudyQuestion(1);
        } 
        // Show answer: Space bar (if answer is not shown yet)
        else if (e.key === ' ' && !isExplanationVisible) {
            e.preventDefault();
            revealStudyAnswer();
        }
        // Star: Key S
        else if (e.key.toLowerCase() === 's') {
            document.getElementById('btn-study-star').click();
        }
        // Confirm: Enter key (if multiple choice confirm button is visible)
        else if (e.key === 'Enter') {
            const confirmContainer = document.getElementById('study-confirm-container');
            if (confirmContainer && confirmContainer.style.display !== 'none') {
                e.preventDefault();
                document.getElementById('btn-study-confirm-answer').click();
            }
        }
        // Option select: 1, 2, 3, 4 (or A, B, C, D)
        else if (!isExplanationVisible) {
            const code = e.key.toUpperCase();
            let selectIndex = -1;
            
            if (code === '1' || code === 'A') selectIndex = 0;
            else if (code === '2' || code === 'B') selectIndex = 1;
            else if (code === '3' || code === 'C') selectIndex = 2;
            else if (code === '4' || code === 'D') selectIndex = 3;
            else if (code === '5' || code === 'E') selectIndex = 4;
            
            const btns = document.querySelectorAll('#study-options-list .option-btn');
            if (selectIndex !== -1 && selectIndex < btns.length) {
                btns[selectIndex].click();
            }
        }
    }
    
    // 2. Keyboard Shortcuts in Exam Mode
    else if (currentScreen === 'screen-exam') {
        if (e.key === 'ArrowLeft') {
            navigateExamQuestion(-1);
        } else if (e.key === 'ArrowRight') {
            navigateExamQuestion(1);
        }
        // Star: Key S
        else if (e.key.toLowerCase() === 's') {
            document.getElementById('btn-exam-star').click();
        }
        // Option select A, B, C, D...
        else {
            const code = e.key.toUpperCase();
            let selectIndex = -1;
            
            if (code === '1' || code === 'A') selectIndex = 0;
            else if (code === '2' || code === 'B') selectIndex = 1;
            else if (code === '3' || code === 'C') selectIndex = 2;
            else if (code === '4' || code === 'D') selectIndex = 3;
            
            const btns = document.querySelectorAll('#exam-options-list .option-btn');
            if (selectIndex !== -1 && selectIndex < btns.length) {
                btns[selectIndex].click();
            }
        }
    }
}

// Fisher-Yates Shuffle
function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// ==========================================================================
// MODAL DIALOG CONTROLLER
// ==========================================================================
let modalCallback = null;

function showConfirmModal(title, message, callback) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').innerHTML = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    modalCallback = callback;
    document.getElementById('confirm-modal').classList.add('active');
    
    // Add event listeners once
    document.getElementById('modal-btn-confirm').onclick = () => {
        const callbackToRun = modalCallback;
        closeModal();
        if (callbackToRun) callbackToRun();
    };
    
    document.getElementById('modal-btn-cancel').onclick = () => {
        closeModal();
    };
}

function closeModal() {
    document.getElementById('confirm-modal').classList.remove('active');
    modalCallback = null;
}

// ==========================================================================
// CUSTOM CANVAS CONFETTI CELEBRATION
// ==========================================================================
function triggerConfettiAnimation() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    
    // Resize canvas
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight || 500;
    
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];
    const particles = [];
    
    // Create particles from left and right bottom corners
    const particleCount = 120;
    
    // Left launcher
    for (let i = 0; i < particleCount / 2; i++) {
        particles.push({
            x: 50,
            y: canvas.height - 50,
            angle: -Math.PI / 4 + (Math.random() - 0.5) * 0.4,
            speed: 12 + Math.random() * 10,
            gravity: 0.4,
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            size: 6 + Math.random() * 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            decay: 0.98
        });
    }
    
    // Right launcher
    for (let i = 0; i < particleCount / 2; i++) {
        particles.push({
            x: canvas.width - 50,
            y: canvas.height - 50,
            angle: -3 * Math.PI / 4 + (Math.random() - 0.5) * 0.4,
            speed: 12 + Math.random() * 10,
            gravity: 0.4,
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            size: 6 + Math.random() * 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            decay: 0.98
        });
    }
    
    let animationFrameId;
    let frames = 0;
    
    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let alive = false;
        
        particles.forEach(p => {
            // Apply physics
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed + p.gravity;
            
            p.speed *= p.decay;
            p.rotation += p.rotationSpeed;
            
            // Draw square particle
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
            
            if (p.y < canvas.height + 20 && p.x > -20 && p.x < canvas.width + 20 && p.speed > 0.1) {
                alive = true;
            }
        });
        
        frames++;
        if (alive && frames < 180) { // Limit duration to ~3 seconds
            animationFrameId = requestAnimationFrame(update);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            cancelAnimationFrame(animationFrameId);
        }
    }
    
    update();
}

function reviewHistoricalExam(historyId) {
    const item = state.history.find(h => h.id === historyId);
    if (!item || !item.questions) {
        alert("Không tìm thấy dữ liệu câu hỏi cho bài thi này!");
        return;
    }
    
    // Load questions and answers into reviewState
    reviewState.questions = item.questions;
    reviewState.answers = item.answers;
    
    // Set where to go back when they click 'Quay lại' on the review screen
    reviewState.backScreen = currentScreen; // either 'screen-dashboard' or 'screen-history'
    
    // Start review screen
    startReviewExamMode();
}

window.reviewHistoricalExam = reviewHistoricalExam;

// ==========================================================================
// ALL QUESTIONS VIEWER FUNCTIONS
// ==========================================================================
function getFilteredQuestions() {
    const query = (questionsScreenState.searchQuery || '').trim().toLowerCase();
    if (!query) {
        return state.questions;
    }
    return state.questions.filter(q => {
        const questionMatch = (q.question || '').toLowerCase().includes(query);
        const explanationMatch = (q.explanation || '').toLowerCase().includes(query);
        const optionsMatch = (q.options || []).some(opt => (opt || '').toLowerCase().includes(query));
        return questionMatch || explanationMatch || optionsMatch;
    });
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderQuestionsScreen() {
    const tableHead = document.getElementById('all-questions-table-head');
    const tableBody = document.getElementById('all-questions-table-body');
    const countSummary = document.getElementById('questions-count-summary');
    const paginationPages = document.getElementById('questions-pagination-pages');
    
    if (!tableHead || !tableBody || !countSummary || !paginationPages) return;
    
    const filtered = getFilteredQuestions();
    const totalCount = state.questions.length;
    const filteredCount = filtered.length;
    
    countSummary.textContent = `Đang hiển thị ${filteredCount} / ${totalCount} câu hỏi`;
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredCount / questionsScreenState.pageSize) || 1;
    if (questionsScreenState.currentPage > totalPages) {
        questionsScreenState.currentPage = totalPages;
    }
    
    const startIdx = (questionsScreenState.currentPage - 1) * questionsScreenState.pageSize;
    const endIdx = Math.min(startIdx + questionsScreenState.pageSize, filteredCount);
    const paginatedQuestions = filtered.slice(startIdx, endIdx);
    
    // Build Headers
    let qHeader = "Câu hỏi";
    let optHeaders = [];
    let correctHeader = "Đáp án đúng";
    let explanationHeader = "Giải thích";
    
    const mapping = state.columnMapping;
    if (mapping) {
        const headers = mapping.headers || [];
        
        if (headers[mapping.question]) qHeader = headers[mapping.question];
        
        if (mapping.options && mapping.options.length > 0) {
            optHeaders = mapping.options.map((colIdx, i) => headers[colIdx] || `Lựa chọn ${String.fromCharCode(65 + i)}`);
        }
        
        if (headers[mapping.correct]) correctHeader = headers[mapping.correct];
        
        if (mapping.explanation !== undefined && mapping.explanation !== -1 && headers[mapping.explanation]) {
            explanationHeader = headers[mapping.explanation];
        }
    }
    
    if (optHeaders.length === 0) {
        const maxOpts = filtered.reduce((max, q) => Math.max(max, (q.options || []).length), 4);
        for (let i = 0; i < maxOpts; i++) {
            optHeaders.push(`Lựa chọn ${String.fromCharCode(65 + i)}`);
        }
    }
    
    // Render thead
    let theadHtml = `<tr>
        <th style="width: 60px; text-align: center;">STT</th>
        <th>${escapeHtml(qHeader)}</th>`;
    
    optHeaders.forEach(optH => {
        theadHtml += `<th>${escapeHtml(optH)}</th>`;
    });
    
    theadHtml += `<th style="width: 100px; text-align: center;">${escapeHtml(correctHeader)}</th>
        <th>${escapeHtml(explanationHeader)}</th>
    </tr>`;
    tableHead.innerHTML = theadHtml;
    
    // Render tbody
    if (paginatedQuestions.length === 0) {
        tableBody.innerHTML = `<tr>
            <td colspan="${2 + optHeaders.length + 2}" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">
                Không tìm thấy câu hỏi nào phù hợp với bộ lọc tìm kiếm.
            </td>
        </tr>`;
    } else {
        let tbodyHtml = '';
        paginatedQuestions.forEach((q, index) => {
            const displayIndex = startIdx + index + 1;
            tbodyHtml += `<tr>
                <td style="text-align: center; font-weight: 600; color: var(--text-muted);">${displayIndex}</td>
                <td style="font-weight: 500; color: var(--text-main); line-height: 1.4; min-width: 250px;">${escapeHtml(q.question)}</td>`;
            
            for (let i = 0; i < optHeaders.length; i++) {
                const optText = q.options[i] || '';
                const isCorrect = q.isMultipleChoice ? (q.correctIndices && q.correctIndices.includes(i)) : (i === q.correctIndex);
                
                if (isCorrect) {
                    tbodyHtml += `<td style="background-color: var(--color-success-light); color: var(--color-success); font-weight: 600; border: 1px solid var(--color-success); border-radius: var(--radius-sm); padding: 0.75rem 1rem;">${escapeHtml(optText)}</td>`;
                } else {
                    tbodyHtml += `<td style="color: var(--text-main);">${escapeHtml(optText)}</td>`;
                }
            }
            
            tbodyHtml += `<td style="text-align: center;">
                <span class="badge badge-success" style="font-size: 0.85rem; padding: 0.35rem 0.65rem; font-weight: 700;">${escapeHtml(q.correctKey || String.fromCharCode(65 + q.correctIndex))}</span>
            </td>
            <td style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.4; min-width: 200px;">${escapeHtml(q.explanation || '')}</td>
        </tr>`;
        });
        tableBody.innerHTML = tbodyHtml;
    }
    
    // Render pagination
    let paginationHtml = '';
    const pageRange = getPaginationRange(questionsScreenState.currentPage, totalPages);
    
    pageRange.forEach(p => {
        if (p === '...') {
            paginationHtml += `<span style="color: var(--text-muted); padding: 0.25rem 0.5rem;">...</span>`;
        } else {
            const isActive = (p === questionsScreenState.currentPage);
            const activeStyle = isActive ? `background-color: var(--color-primary); color: white; border-color: var(--color-primary);` : `color: var(--text-main); border: 1px solid var(--border-color); background-color: var(--bg-card);`;
            paginationHtml += `<button class="btn btn-xs" style="min-width: 2rem; cursor: pointer; padding: 0.25rem 0.5rem; font-size: 0.85rem; border-radius: var(--radius-sm); ${activeStyle} transition: all 0.2s;" onclick="changeQuestionsPage(${p})">${p}</button>`;
        }
    });
    paginationPages.innerHTML = paginationHtml;
    
    const btnPrev = document.getElementById('btn-questions-prev-page');
    const btnNext = document.getElementById('btn-questions-next-page');
    if (btnPrev) btnPrev.disabled = (questionsScreenState.currentPage === 1);
    if (btnNext) btnNext.disabled = (questionsScreenState.currentPage === totalPages);
}

function getPaginationRange(current, total) {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
            range.push(i);
        }
    }

    for (let i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l > 2) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    }

    return rangeWithDots;
}

function changeQuestionsPage(pageNum) {
    questionsScreenState.currentPage = pageNum;
    renderQuestionsScreen();
}

window.changeQuestionsPage = changeQuestionsPage;
