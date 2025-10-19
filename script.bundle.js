let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function loadManifest() {
    if (window.__songsManifest) return window.__songsManifest;
    const res = await fetch('./songs/manifest.json');
    const json = await res.json();
    window.__songsManifest = json;
    return json;
}

async function getSongs(folder) {
    try {
        currFolder = folder; // e.g., 'songs/ncs' or 'songs/karan aujla'
        const folderName = folder.split('/').slice(-1)[0];
        const manifest = await loadManifest();
        const album = manifest.albums.find(a => a.folder === folderName);
        songs = album ? album.tracks.slice() : [];

        const songUL = document.querySelector('.songList').getElementsByTagName('ul')[0];
        songUL.innerHTML = '';
        for (const song of songs) {
            const displayName = decodeURIComponent(song);
            songUL.innerHTML += `<li><img class="invert" width="34" src="img/music.svg" alt="">
                            <div class="info">
                                <div>${displayName}</div>
                                <div>Artist</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="img/play.svg" alt="">
                            </div> </li>`;
        }

        // Attach an event listener to each song
        Array.from(document.querySelector('.songList').getElementsByTagName('li')).forEach(li => {
            li.addEventListener('click', () => {
                const track = li.querySelector('.info').firstElementChild.textContent.trim();
                playMusic(track);
            });
        });

        return songs;
    } catch (err) {
        console.error('Error loading songs for folder', folder, err);
        return [];
    }
}

const playMusic = (track, pause = false) => {
    document.querySelector('.songinfo').textContent = track;
    // Ensure URL-safe path segments and use relative path
    const safeFolder = currFolder
        .split('/')
        .map(seg => encodeURIComponent(seg))
        .join('/');
    const safeTrack = encodeURIComponent(track);
    currentSong.src = `./${safeFolder}/${safeTrack}`;

    if (!pause) {
        currentSong.play();
        play.src = 'img/pause.svg';
    } else {
        play.src = 'img/play.svg';
    }
}

async function displayAlbums() {
    try {
        const manifest = await loadManifest();
        const cardContainer = document.querySelector('.cardContainer');
        cardContainer.innerHTML = '';
        for (const album of manifest.albums) {
            const coverPath = `./songs/${encodeURIComponent(album.folder)}/cover.jpg`;
            cardContainer.innerHTML += ` <div data-folder="${album.folder}" class="card">
            <div class="play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                        stroke-linejoin="round" />
                </svg>
            </div>

            <img src="${coverPath}" alt="cover">
            <h2>${album.title}</h2>
            <p>${album.description}</p>
        </div>`;
        }
        Array.from(document.getElementsByClassName('card')).forEach(card => {
            card.addEventListener('click', async item => {
                songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
                if (songs.length > 0) {
                    playMusic(songs[0]);
                }
            });
        });
    } catch (err) {
        console.error('Error displaying albums', err);
    }
}

async function main() {
    displayAlbums();

    songs = await getSongs("songs/ncs");
    if (songs.length > 0) {
        playMusic(songs[0], true)
    }

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg"
        }
        else {
            currentSong.pause();
            play.src = "img/play.svg"
        }
    })
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)}/${secondsToMinutesSeconds(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%"
    })
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = e.offsetX / e.target.getBoundingClientRect().width * 100
        document.querySelector(".circle").style.left = percent + "%"
        currentSong.currentTime = currentSong.duration * (percent / 100);
    })
    previous.addEventListener("click", () => {
        currentSong.pause()
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
        else {
            playMusic(songs[songs.length - 1])
        }
    })
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    // Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })

    next.addEventListener("click", () => {
        currentSong.pause()
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
        else {
            playMusic(songs[0])
        }
    })
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
        }
    })
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg")
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg")
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })
}
main()
