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

let lastSong = "";
let lastArtist = "";

function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

function setMarquee(el, text) {
    el.classList.remove("scrolling");
    el.style.removeProperty("--marquee-offset");
    el.style.animation = "none";
    el.textContent = text;

    setTimeout(() => {
        el.style.animation = "";
        const wrap = el.parentElement;
        const overflow = el.getBoundingClientRect().width - wrap.getBoundingClientRect().width;
        if (overflow > 2) {
            el.style.setProperty("--marquee-offset", `-${Math.ceil(overflow)}px`);
            el.classList.add("scrolling");
        }
    }, 100);
}

function refreshMarquees() {
    [document.getElementById("spotify-song"), document.getElementById("spotify-artist")].forEach(el => {
        if (!el.textContent) return;

        el.classList.remove("scrolling");
        el.style.removeProperty("--marquee-offset");
        el.style.animation = "none";

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.style.animation = "";
                const wrap = el.parentElement;
                const overflow = el.getBoundingClientRect().width - wrap.getBoundingClientRect().width;
                if (overflow > 2) {
                    el.style.setProperty("--marquee-offset", `-${Math.ceil(overflow)}px`);
                    el.classList.add("scrolling");
                }
            });
        });
    });
}

async function loadDiscord() {
    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const json = await res.json();
        const data = json.data;
        const user = data.discord_user;

        // ===== BASIC INFO =====
        document.getElementById("dc-name").textContent = user.global_name || user.username;
        document.getElementById("dc-username").textContent = "@" + user.username;

        const avatarHash = user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
            : `https://cdn.discordapp.com/embed/avatars/0.png`;
        document.getElementById("dc-avatar").src = avatarHash;

        // ===== AVATAR DECORATION =====
        const deco = document.getElementById("dc-decoration");
        if (user.avatar_decoration_data?.asset) {
            deco.style.backgroundImage = `url(https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png)`;
            deco.style.display = "block";
        } else {
            deco.style.display = "none";
        }

        // ===== STATUS DOT =====
        const dot = document.getElementById("status-dot");
        const colors = {
            online: "#23a55a",
            idle: "#f0b232",
            dnd: "#f23f43",
            offline: "#747f8d"
        };
        dot.style.background = colors[data.discord_status] || "#747f8d";

        // ===== ELEMENTS =====
        const spotify = data.spotify;
        const game = data.activities?.find(a => a.type === 0);
        const nameEl = document.getElementById("activity-name");
        const detailsEl = document.getElementById("activity-details");
        const timeEl = document.getElementById("activity-time");
        const activityBox = document.getElementById("dc-activity");
        const section = document.getElementById("spotify-section"); // khai báo sớm
        const songEl = document.getElementById("spotify-song");
        const artistEl = document.getElementById("spotify-artist");
        const albumArt = document.getElementById("album-art");
        const bar = document.getElementById("spotify-bar");

        // ===== ACTIVITY =====
        if (game) {
            nameEl.textContent = "🎮 " + game.name;
            detailsEl.textContent = game.details || "";
            if (game.timestamps?.start) {
                timeEl.textContent = `⏱ ${formatTime(Date.now() - game.timestamps.start)}`;
            } else {
                timeEl.textContent = "";
            }
            activityBox.style.display = "flex";
            section.style.flex = "0 0 90px";
        } else if (!spotify) {
            nameEl.textContent = "🛌 Gooning";
            detailsEl.textContent = "";
            timeEl.textContent = "";
            activityBox.style.display = "flex";
            activityBox.style.flex = "1";
            section.style.display = "none";
        } else {
            nameEl.textContent = "";
            detailsEl.textContent = "";
            timeEl.textContent = "";
            activityBox.style.display = "none";
            section.style.flex = "1";
        }

        // ===== SPOTIFY =====
        if (spotify) {
            section.style.display = "block";

        if (spotify.song !== lastSong) {
            lastSong = spotify.song;
            songEl.textContent = spotify.song;
            songEl.classList.remove("scrolling");
            setTimeout(refreshMarquees, 50);
        }
        if (spotify.artist !== lastArtist) {
            lastArtist = spotify.artist;
            artistEl.textContent = spotify.artist;
            artistEl.classList.remove("scrolling");
        }

            albumArt.style.backgroundImage = `url(${spotify.album_art_url})`;

            const start = spotify.timestamps.start;
            const end = spotify.timestamps.end;
            bar.style.width = Math.min(((Date.now() - start) / (end - start)) * 100, 100) + "%";

        } else {
            section.style.display = "none";
            activityBox.style.display = "flex";
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