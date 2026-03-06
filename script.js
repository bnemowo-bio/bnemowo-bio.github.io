// --- Views \\

fetch("https://tracknemowo.baonam04012010.workers.dev/track")
    .then(res => res.json())
    .then(data => {
        document.getElementById("views").textContent = data.views;
    })
    .catch(() => {
        document.getElementById("views").textContent = "--?";
    });

// --- Title Text \\
const TITLE_TEXT = "nem's profile :^";
const BLUR_TITLE = "ur mom";
const PLACEHOLDER = "_";

let index = 0;
let deleting = false;
let typingTimeout = null;

function nextDelay(char, isDeleting) {
    if (isDeleting) return 70;
    if (char === " ") return 0;
    return 120;
}

function typeTitle() {
    if (!deleting) {
        document.title = TITLE_TEXT.slice(0, index++) || PLACEHOLDER;
        if (index > TITLE_TEXT.length) {
            deleting = true;
            typingTimeout = setTimeout(typeTitle, 1200);
            return;
        }
    } else {
        const text = TITLE_TEXT.slice(0, index--);
        document.title = text.length ? text : PLACEHOLDER;
        if (index < 1) deleting = false;
    }
    const char = TITLE_TEXT[index - 1] || "";
    typingTimeout = setTimeout(typeTitle, nextDelay(char, deleting));
}

document.addEventListener("visibilitychange", () => {
    clearTimeout(typingTimeout);
    if (document.hidden) {
        document.title = BLUR_TITLE;
    } else {
        index = 0;
        deleting = false;
        typeTitle();
    }
});

typeTitle();


// --- Discord \\

const DISCORD_ID = "941992157416398858";
const SEP = "\u00a0\u00a0\u00a0\u2022\u00a0\u00a0\u00a0";

let lastSong = "";
let lastArtist = "";

// ===== MARQUEE =====

function setMarquee(trackEl, spanA, spanB, text) {
    trackEl.classList.remove("scrolling");
    trackEl.style.removeProperty("--dur");

    const wrap = trackEl.parentElement;
    const sep = SEP;

    spanA.textContent = text;
    spanB.textContent = "";

    requestAnimationFrame(() => {
        const wrapWidth = wrap.clientWidth;
        const textWidth = spanA.scrollWidth;

        if (textWidth <= wrapWidth) return;

        spanA.textContent = text + sep;
        spanB.textContent = text + sep;

        const halfWidth = trackEl.scrollWidth / 2;
        const dur = halfWidth / 40;
        trackEl.style.setProperty("--dur", dur + "s");
        trackEl.classList.add("scrolling");
    });
}

function refreshMarquees() {
    const songTrack = document.getElementById("spotify-song-track");
    const artistTrack = document.getElementById("spotify-artist-track");
    if (lastSong && !songTrack.classList.contains("scrolling"))
        setMarquee(songTrack, document.getElementById("spotify-song-a"), document.getElementById("spotify-song-b"), lastSong);
    if (lastArtist && !artistTrack.classList.contains("scrolling"))
        setMarquee(artistTrack, document.getElementById("spotify-artist-a"), document.getElementById("spotify-artist-b"), lastArtist);
}

function formatActivityTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

function getActivityImageUrl(activity) {
    const assets = activity.assets;
    if (!assets) return null;

    const appId = activity.application_id;
    const img = assets.large_image || assets.small_image;
    if (!img) return null;

    if (img.startsWith("mp:external/")) {
        const path = img.replace("mp:external/", "");
        return `https://media.discordapp.net/external/${path}`;
    }

    if (appId) {
        return `https://cdn.discordapp.com/app-assets/${appId}/${img}.png`;
    }

    return null;
}

let lastActivityImg = "";

async function loadDiscord() {
    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const json = await res.json();
        const data = json.data;
        const user = data.discord_user;

        document.getElementById("dc-name").textContent = user.global_name || user.username;
        document.getElementById("dc-username").textContent = "@" + user.username;

        const avatarHash = user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
            : `https://cdn.discordapp.com/embed/avatars/0.png`;
        document.getElementById("dc-avatar").src = avatarHash;

        const deco = document.getElementById("dc-decoration");
        if (user.avatar_decoration_data?.asset) {
            deco.style.backgroundImage = `url(https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png)`;
            deco.style.display = "block";
        } else {
            deco.style.display = "none";
        }

        const dot = document.getElementById("status-dot");
        const colors = { online: "#23a55a", idle: "#f0b232", dnd: "#f23f43", offline: "#747f8d" };
        dot.style.background = colors[data.discord_status] || "#747f8d";

        const spotify = data.spotify;
        const game = data.activities?.find(a => a.type === 0);
        const nameEl = document.getElementById("activity-name");
        const detailsEl = document.getElementById("activity-details");
        const timeEl = document.getElementById("activity-time");
        const activityBox = document.getElementById("dc-activity");
        const activityBg = document.getElementById("activity-bg");
        const section = document.getElementById("spotify-section");
        const albumArt = document.getElementById("album-art");
        const bar = document.getElementById("spotify-bar");

        if (game) {
            nameEl.textContent = "🎮 " + game.name;
            detailsEl.textContent = game.details || "";
            timeEl.textContent = game.timestamps?.start
                ? `⏱ ${formatActivityTime(Date.now() - game.timestamps.start)}`
                : "";
            activityBox.style.display = "flex";
            section.style.flex = "0 0 90px";

            const imgUrl = getActivityImageUrl(game);
            if (imgUrl && imgUrl !== lastActivityImg) {
                lastActivityImg = imgUrl;
                activityBg.style.backgroundImage = `url(${imgUrl})`;
                activityBg.classList.add("visible");
            } else if (!imgUrl) {
                activityBg.classList.remove("visible");
                lastActivityImg = "";
            }

        } else if (!spotify) {
            nameEl.textContent = "🛌 Gooning";
            detailsEl.textContent = "";
            timeEl.textContent = "";
            activityBox.style.display = "flex";
            activityBox.style.flex = "1";
            section.style.display = "none";
            activityBg.classList.remove("visible");
            lastActivityImg = "";
        } else {
            nameEl.textContent = "";
            detailsEl.textContent = "";
            timeEl.textContent = "";
            activityBox.style.display = "none";
            section.style.flex = "1";
            activityBg.classList.remove("visible");
            lastActivityImg = "";
        }

        if (spotify) {
            section.style.display = "block";

            const songTrack = document.getElementById("spotify-song-track");
            const artistTrack = document.getElementById("spotify-artist-track");
            const songA = document.getElementById("spotify-song-a");
            const songB = document.getElementById("spotify-song-b");
            const artistA = document.getElementById("spotify-artist-a");
            const artistB = document.getElementById("spotify-artist-b");

            if (spotify.song !== lastSong) {
                lastSong = spotify.song;
                setMarquee(songTrack, songA, songB, spotify.song);
            }
            if (spotify.artist !== lastArtist) {
                lastArtist = spotify.artist;
                setMarquee(artistTrack, artistA, artistB, spotify.artist);
            }

            albumArt.style.backgroundImage = `url(${spotify.album_art_url})`;

            const start = spotify.timestamps.start;
            const end = spotify.timestamps.end;
            bar.__spotifyStart = start;
            bar.__spotifyEnd = end;

        } else {
            section.style.display = "none";
            activityBox.style.display = "flex";
            lastSong = "";
            lastArtist = "";
        }

    } catch (err) {
        console.log("mmb:", err);
    }
}

loadDiscord();
const pollInterval = window.innerWidth <= 768 ? 5000 : 1000;
setInterval(loadDiscord, pollInterval);

let rafId = null;
function tickSpotifyBar() {
    const bar = document.getElementById("spotify-bar");
    const startEl = bar.__spotifyStart;
    const endEl = bar.__spotifyEnd;
    if (startEl && endEl) {
        const pct = Math.min(((Date.now() - startEl) / (endEl - startEl)) * 100, 100);
        bar.style.width = pct + "%";
    }
    rafId = requestAnimationFrame(tickSpotifyBar);
}
tickSpotifyBar();

// pause bg video when tab hidden to free GPU
const bgVideo = document.getElementById("bg-video");
document.addEventListener("visibilitychange", () => {
    if (document.hidden) bgVideo.pause();
    else bgVideo.play().catch(() => {});
});

document.querySelector(".discord-wrapper").addEventListener("mouseenter", () => {
    const card = document.getElementById("discord-card");
    card.addEventListener("transitionend", refreshMarquees, { once: true });
});


// ===== MUSIC PLAYER =====

const STORAGE_KEY = "nem_player";

const playlist = [
    {
        title: "this is what heartbreak feels like ",
        artist: "JVKE",
        src: "assets/this is what heartbreak feels like.mp3",
        cover: "https://i.scdn.co/image/ab67616d0000b273f06a22f2e0d39d75b4f56814"
    },
    {
        title: "Như vậy nhé",
        artist: "Lil Wuyn, Wxrdie",
        src: "assets/nhu vay nhe.mp3",
        cover: "https://i.scdn.co/image/ab67616d0000b273c62daea05d1551334722dbf0"
    },
    {
        title: "Badtrip",
        artist: "RPT MCK",
        src: "assets/badtrip.mp3",
        cover: "https://i.scdn.co/image/ab67616d0000b273b315e8bb7ef5e57e9a25bb0f"
    },
    {
        title: "2h",
        artist: "RPT MCK",
        src: "assets/badtrip.mp3",
        cover: "https://i.ytimg.com/vi/mbEZ_9dhM_Y/maxresdefault.jpg"
    },
    {
        title: "novacaine",
        artist: "GenriX, CORBAL, Shiloh Dynasty",
        src: "assets/novacaine.mp3",
        cover: "https://i.scdn.co/image/ab67616d0000b27314e21b4fc24f2b3cae15ef93"
    },
];

let current = 0;
let isShuffle = false;

const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const shuffleBtn = document.getElementById("shuffle");
const muteBtn = document.getElementById("mute");
const progress = document.getElementById("progress");
const volume = document.getElementById("volume");

const coverEl = document.getElementById("cover");
const currentTimeEl = document.getElementById("current-time");
const totalTimeEl = document.getElementById("total-time");

// music marquee elements
const musicTitleTrack = document.getElementById("music-title-track");
const musicTitleA = document.getElementById("music-title-a");
const musicTitleB = document.getElementById("music-title-b");
const musicArtistTrack = document.getElementById("music-artist-track");
const musicArtistA = document.getElementById("music-artist-a");
const musicArtistB = document.getElementById("music-artist-b");

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2,"0")}`;
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        index: current,
        time: audio.currentTime,
        volume: audio.volume,
        muted: audio.muted
    }));
}

function loadState() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!data) return;

    current = data.index ?? 0;
    audio.volume = data.volume ?? 1;
    audio.muted = data.muted ?? false;
    volume.value = audio.volume;

    muteBtn.innerHTML = audio.muted
        ? '<i class="fa-solid fa-volume-xmark"></i>'
        : '<i class="fa-solid fa-volume-high"></i>';

    loadSong(current);

    audio.addEventListener("loadedmetadata", () => {
        audio.currentTime = data.time ?? 0;
        totalTimeEl.textContent = formatTime(audio.duration);
    }, { once: true });
}

function loadSong(index) {
    const song = playlist[index];
    audio.src = song.src;
    coverEl.src = song.cover;
    setMarquee(musicTitleTrack, musicTitleA, musicTitleB, song.title);
    setMarquee(musicArtistTrack, musicArtistA, musicArtistB, song.artist);
}

function playSong() {
    audio.play();
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
}

function pauseSong() {
    audio.pause();
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
}

playBtn.onclick = () => {
    if (audio.paused) playSong();
    else pauseSong();
};

nextBtn.onclick = () => {
    current = isShuffle
        ? Math.floor(Math.random() * playlist.length)
        : (current + 1) % playlist.length;

    loadSong(current);
    playSong();
    saveState();
};

prevBtn.onclick = () => {
    current = (current - 1 + playlist.length) % playlist.length;
    loadSong(current);
    playSong();
    saveState();
};

shuffleBtn.onclick = () => {
    isShuffle = !isShuffle;
    shuffleBtn.style.color = isShuffle ? "#8ab4ff" : "#fff";
};

muteBtn.onclick = () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
        ? '<i class="fa-solid fa-volume-xmark"></i>'
        : '<i class="fa-solid fa-volume-high"></i>';
    saveState();
};

volume.oninput = () => {
    audio.volume = volume.value;
    audio.muted = false;
    muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    saveState();
};

audio.ontimeupdate = () => {
    progress.value = (audio.currentTime / audio.duration) * 100 || 0;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    saveState();
};

audio.onloadedmetadata = () => {
    totalTimeEl.textContent = formatTime(audio.duration);
};

progress.oninput = () => {
    audio.currentTime = (progress.value / 100) * audio.duration;
};

audio.onended = () => nextBtn.click();

loadState();
if (!audio.src) loadSong(current);


// ===== DONATING =====

const rawQR = "00020101021138570010A000000727012700069704220113VQRQABTRF15880208QRIBFTTA53037045802VN62150107NPS6869080063042497";

const QR_RENDER_SIZE = 1440;
const QR_DISPLAY_SIZE = 186;

const donateQR = new QRCodeStyling({
    width: QR_RENDER_SIZE,
    height: QR_RENDER_SIZE,
    data: rawQR,
    image: "assets/logo.jpg",
    qrOptions: { errorCorrectionLevel: "H" },
    dotsOptions: { color: "#ffffff", type: "rounded" },
    cornersSquareOptions: { type: "extra-rounded" },
    backgroundOptions: { color: "transparent" },
    imageOptions: { crossOrigin: "anonymous", margin: 4, imageSize: 0.2 }
});

donateQR.append(document.getElementById("donate-qr"));

function applyQRStyles() {
    const el = document.querySelector("#donate-qr canvas, #donate-qr svg");
    if (el) {
        el.style.width = QR_DISPLAY_SIZE + "px";
        el.style.height = QR_DISPLAY_SIZE + "px";
        el.style.borderRadius = "12px";
        el.style.display = "block";
    }
}

applyQRStyles();
setTimeout(applyQRStyles, 100);
setTimeout(applyQRStyles, 500);

function downloadQR() {
    donateQR.download({ name: "donate-qr", extension: "png" });
}

function openDonate() {
    document.getElementById("donate-overlay").classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeDonate() {
    document.getElementById("donate-overlay").classList.remove("open");
    document.body.style.overflow = "";
}

function overlayClick(e) {
    if (e.target === document.getElementById("donate-overlay")) closeDonate();
}

document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeDonate();
});

function switchTab(name, btn) {
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.getElementById("tab-" + name).classList.add("active");
    btn.classList.add("active");
}

function copyField(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        btn.classList.add("copied");
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => {
            btn.classList.remove("copied");
            btn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        }, 1500);
    });
}


// ===== CREDIT =====

const credit = document.getElementById("credit-copy");

credit.addEventListener("click", async () => {
    const email = credit.dataset.email;

    try {
        await navigator.clipboard.writeText(email);

        credit.classList.add("copied");
        credit.textContent = "email copied";

        setTimeout(() => {
            credit.classList.remove("copied");
            credit.textContent = "made by nem";
        }, 1500);

    } catch (err) {
        credit.textContent = "copy failed";
    }
});

// ===== RESPONSIVE =====

const discordWrapper = document.querySelector(".discord-wrapper");
const discordBtn = document.getElementById("discord-link");

discordBtn.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
        e.preventDefault();
        e.stopPropagation();
        discordWrapper.classList.toggle("active");
    } else {
        window.open("https://discord.com/users/941992157416398858", "_blank");
    }
});

function closeDiscordCard(e) {
    e.stopPropagation();
    discordWrapper.classList.remove("active");
}

document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
        if (!discordWrapper.contains(e.target)) {
            discordWrapper.classList.remove("active");
        }
    }
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") discordWrapper.classList.remove("active");
});