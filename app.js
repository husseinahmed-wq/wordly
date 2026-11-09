const form = document.getElementById('searchForm');
const input = document.getElementById('wordInput');
const resultCard = document.getElementById('result');
const errorBox = document.getElementById('error');
const loading = document.getElementById('loading');

let currentWord = '';
let audioUrl = '';
let favorites = JSON.parse(localStorage.getItem('wordly_favs') || '[]');

function renderFavorites() {
    const list = document.getElementById('favList');
    if (favorites.length === 0) {
        list.innerHTML = '<p>No saved words yet.</p>';
        return;
    }
    list.innerHTML = '';
    favorites.forEach(function(word) {
        const span = document.createElement('span');
        span.className = 'fav' + (word === currentWord ? ' saved' : '');
        span.textContent = word;
        span.addEventListener('click', function() {
            searchWord(word);
        });
        list.appendChild(span);
    });
}

async function searchWord(word) {
    word = word.trim().toLowerCase();
    if (!word) return;
    input.value = word;
    errorBox.classList.add('hidden');
    resultCard.classList.add('hidden');
    loading.classList.remove('hidden');

    try {
        const response = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word);
        if (!response.ok) {
            throw new Error('Word not found');
        }
        const data = await response.json();
        const entry = data[0];
        currentWord = entry.word;
        displayWord(entry);
    } catch (error) {
        errorBox.textContent = 'Word "' + word + '" not found. Please try another word.';
        errorBox.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
    }
}

function displayWord(entry) {
    document.getElementById('wordTitle').textContent = entry.word;
    document.getElementById('phonetic').textContent = entry.phonetic || '';

    const audioObj = entry.phonetics.find(function(p) { return p.audio; });
    audioUrl = audioObj ? audioObj.audio : '';
    document.getElementById('audioBtn').classList.toggle('hidden', !audioUrl);

    let defHtml = '';
    let allSynonyms = [];

    entry.meanings.forEach(function(meaning) {
        defHtml += '<div><span class="pos">' + meaning.partOfSpeech + '</span>';
        meaning.definitions.slice(0, 3).forEach(function(def, index) {
            defHtml += '<p><b>' + (index + 1) + '.</b> ' + def.definition + '</p>';
            if (def.example) {
                defHtml += '<p class="example">"' + def.example + '"</p>';
            }
            if (def.synonyms) {
                allSynonyms = allSynonyms.concat(def.synonyms);
            }
        });
        if (meaning.synonyms) {
            allSynonyms = allSynonyms.concat(meaning.synonyms);
        }
        defHtml += '</div>';
    });

    document.getElementById('definitions').innerHTML = defHtml;

    const synBox = document.getElementById('synonymsBox');
    if (allSynonyms.length > 0) {
        synBox.innerHTML = '<b>Synonyms:</b><br>';
        allSynonyms.slice(0, 8).forEach(function(s) {
            const span = document.createElement('span');
            span.className = 'syn';
            span.textContent = s;
            span.addEventListener('click', function() {
                searchWord(s);
            });
            synBox.appendChild(span);
        });
    } else {
        synBox.innerHTML = '';
    }

    document.getElementById('source').textContent = 'Source: ' + (entry.sourceUrls ? entry.sourceUrls[0] : '');

    updateSaveBtn();
    resultCard.classList.remove('hidden');
    renderFavorites();
}

function updateSaveBtn() {
    const btn = document.getElementById('saveBtn');
    if (favorites.includes(currentWord)) {
        btn.textContent = 'Saved';
    } else {
        btn.textContent = 'Save Word';
    }
}

document.getElementById('saveBtn').addEventListener('click', function() {
    if (!currentWord) return;
    if (favorites.includes(currentWord)) {
        favorites = favorites.filter(function(w) { return w !== currentWord; });
    } else {
        favorites.push(currentWord);
    }
    localStorage.setItem('wordly_favs', JSON.stringify(favorites));
    updateSaveBtn();
    renderFavorites();
});

document.getElementById('audioBtn').addEventListener('click', function() {
    if (audioUrl) {
        new Audio(audioUrl).play();
    }
});

document.getElementById('clearFav').addEventListener('click', function() {
    favorites = [];
    localStorage.removeItem('wordly_favs');
    renderFavorites();
    updateSaveBtn();
});

document.getElementById('themeBtn').addEventListener('click', function() {
    document.body.classList.toggle('dark');
});

form.addEventListener('submit', function(e) {
    e.preventDefault();
    searchWord(input.value);
});

renderFavorites();
searchWord('serendipity');