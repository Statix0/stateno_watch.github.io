document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.getElementById('profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const usernameDisplay = document.getElementById('username-display');
    const uploadSection = document.getElementById('uploadSection');
    const authNav = document.getElementById('auth-nav');

    // Toggle profile dropdown
    profileBtn.addEventListener('click', () => {
        profileDropdown.classList.toggle('active');
    });

    // Handle logout
    logoutBtn.addEventListener('click', () => {
        fetch('/logout')
            .then(response => {
                if (response.ok) {
                    window.location.href = '/login.html';
                }
            });
    });

    // Check authentication status and fetch username
    fetch('/check-auth')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                profileBtn.style.display = 'block';
                authNav.style.display = 'none';
                // Fetch and display username
                fetch('/get-username')
                    .then(response => response.json())
                    .then(data => {
                        if (data.username) {
                            usernameDisplay.textContent = data.username;
                        }
                    });
            } else {
                profileBtn.style.display = 'none';
                authNav.style.display = 'block';
                uploadSection.style.display = 'none';
            }
        });

    // Fetch and display videos
    fetch('/videos')
        .then(response => response.json())
        .then(videos => {
            const videoList = document.getElementById('videoList');
            videos.forEach(videoPath => {
                const videoItem = document.createElement('div');
                videoItem.classList.add('video-item');
                videoItem.innerHTML = `<video controls src="${videoPath}"></video>`;
                videoList.appendChild(videoItem);
            });
        });
});
