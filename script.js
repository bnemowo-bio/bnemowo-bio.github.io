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

function formatTime(ms) {
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
                ? `⏱ ${formatTime(Date.now() - game.timestamps.start)}`
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
            bar.style.width = Math.min(((Date.now() - start) / (end - start)) * 100, 100) + "%";

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
setInterval(loadDiscord, 1000);

document.querySelector(".discord-wrapper").addEventListener("mouseenter", () => {
    const card = document.getElementById("discord-card");
    card.addEventListener("transitionend", refreshMarquees, { once: true });
});

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